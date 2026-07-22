/**
 * Compute fuel consumption metrics from fuel-history.log + trips.log
 */
import fs from 'fs';
import path from 'path';
import {
  FUEL_EVENT_TYPE,
  QUARRY_ZONES,
} from './fuel-constants.js';

const REFUEL_LITERS = 50;
const REFUEL_WINDOW_MS = 30 * 60 * 1000;
const SUSPECT_DROP_LITERS = 30;
const SUSPECT_DROP_WINDOW_MS = 30 * 60 * 1000;
const FUEL_MATCH_MS = 15 * 60 * 1000;

function parsePeriodBounds(period, fromQ, toQ) {
  const now = Date.now();
  if (fromQ && toQ) {
    const start = new Date(fromQ).getTime();
    const endDate = new Date(toQ);
    endDate.setHours(23, 59, 59, 999);
    return { start, end: endDate.getTime() };
  }
  const cutoffs = { day: 86400000, week: 604800000, month: 2592000000 };
  const ms = cutoffs[period] || cutoffs.week;
  return { start: now - ms, end: now };
}

function loadFuelEntries(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map(line => {
    try {
      const row = JSON.parse(line);
      return {
        assetId: row.assetId?.toString(),
        level: row.level,
        timestamp: row.timestamp,
        eventType: row.eventType || FUEL_EVENT_TYPE.FIVE_MIN,
        eventId: row.eventId || null,
        driverId: row.driverId || null,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function loadTrips(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function loadVehicleLookup(cwd) {
  const map = new Map();
  const dataPath = path.join(cwd, 'public', 'data.json');
  if (!fs.existsSync(dataPath)) return map;
  JSON.parse(fs.readFileSync(dataPath, 'utf8')).forEach(v => {
    map.set(v.id?.toString(), {
      regNo: v.regNo,
      assetName: v.assetName,
      zone: (v.zone || '').toUpperCase(),
    });
  });
  return map;
}

function loadDriverLookup(cwd) {
  const map = new Map();
  const p = path.join(cwd, 'public', 'drivers.json');
  if (!fs.existsSync(p)) return map;
  JSON.parse(fs.readFileSync(p, 'utf8')).forEach(d => {
    map.set(d.DriverId?.toString(), d.Name || 'N/A');
  });
  return map;
}

function nearestFuelReading(entries, assetId, targetMs, preferTypes, direction) {
  const pool = entries.filter(e =>
    e.assetId === assetId
    && preferTypes.includes(e.eventType)
    && (direction === 'before' ? new Date(e.timestamp).getTime() <= targetMs : new Date(e.timestamp).getTime() >= targetMs)
  );
  if (!pool.length) return null;
  pool.sort((a, b) => {
    const da = Math.abs(new Date(a.timestamp).getTime() - targetMs);
    const db = Math.abs(new Date(b.timestamp).getTime() - targetMs);
    return da - db;
  });
  const best = pool[0];
  if (Math.abs(new Date(best.timestamp).getTime() - targetMs) > FUEL_MATCH_MS) return null;
  return best;
}

function detectRefuels(entries, start, end) {
  const refuels = [];
  const byAsset = new Map();
  entries.forEach(e => {
    if (!byAsset.has(e.assetId)) byAsset.set(e.assetId, []);
    byAsset.get(e.assetId).push(e);
  });

  byAsset.forEach((rows, assetId) => {
    const sorted = [...rows].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const t0 = new Date(prev.timestamp).getTime();
      const t1 = new Date(cur.timestamp).getTime();
      if (t1 < start || t0 > end) continue;
      const delta = cur.level - prev.level;
      const dt = t1 - t0;
      if (delta >= REFUEL_LITERS && dt <= REFUEL_WINDOW_MS) {
        refuels.push({
          assetId,
          timestamp: cur.timestamp,
          startTime: prev.timestamp,
          endTime: cur.timestamp,
          durationMinutes: Math.round(dt / 60_000),
          beforeLevel: prev.level,
          afterLevel: cur.level,
          deltaLiters: delta,
        });
      }
    }
  });
  return refuels;
}

function detectSuspectDrops(entries, start, end) {
  const drops = [];
  const byAsset = new Map();
  entries
    .filter(e => e.eventType === FUEL_EVENT_TYPE.FIVE_MIN)
    .forEach(e => {
      if (!byAsset.has(e.assetId)) byAsset.set(e.assetId, []);
      byAsset.get(e.assetId).push(e);
    });

  byAsset.forEach((rows, assetId) => {
    const sorted = [...rows].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const t0 = new Date(prev.timestamp).getTime();
      const t1 = new Date(cur.timestamp).getTime();
      if (t1 < start || t0 > end) continue;
      const delta = prev.level - cur.level;
      const dt = t1 - t0;
      if (delta >= SUSPECT_DROP_LITERS && dt > 0 && dt <= SUSPECT_DROP_WINDOW_MS) {
        drops.push({
          assetId,
          timestamp: cur.timestamp,
          startTime: prev.timestamp,
          endTime: cur.timestamp,
          durationMinutes: Math.max(1, Math.round(dt / 60_000)),
          beforeLevel: prev.level,
          afterLevel: cur.level,
          deltaLiters: delta,
        });
      }
    }
  });
  return drops;
}

function periodFuelDrop(entries, assetId, start, end) {
  const rows = entries
    .filter(e => e.assetId === assetId)
    .filter(e => {
      const t = new Date(e.timestamp).getTime();
      return t >= start && t <= end;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (rows.length < 2) return 0;

  let used = 0;
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const delta = prev.level - cur.level;
    const dt = new Date(cur.timestamp).getTime() - new Date(prev.timestamp).getTime();
    if (cur.level - prev.level >= REFUEL_LITERS && dt <= REFUEL_WINDOW_MS) continue;
    if (delta > 0) used += delta;
  }
  return used;
}

export function computeConsumption({
  cwd = process.cwd(),
  period = 'week',
  from,
  to,
  siteFilter = null,
}) {
  const { start, end } = parsePeriodBounds(period, from, to);
  const fuelEntries = loadFuelEntries(path.join(cwd, 'fuel-history.log'));
  const trips = loadTrips(path.join(cwd, 'trips.log'));
  const vehicles = loadVehicleLookup(cwd);
  const drivers = loadDriverLookup(cwd);

  const quarryAssetIds = new Set(
    [...vehicles.entries()]
      .filter(([, v]) => QUARRY_ZONES.has(v.zone))
      .map(([id]) => id),
  );

  const refuels = detectRefuels(fuelEntries, start, end);
  const suspectDrops = detectSuspectDrops(fuelEntries, start, end);

  const tripRows = trips
    .filter(t => quarryAssetIds.has(t.AssetId?.toString()))
    .filter(t => {
      const ts = new Date(t.TripEnd || t.TripStart).getTime();
      return ts >= start && ts <= end;
    })
    .filter(t => {
      if (!siteFilter) return true;
      const info = vehicles.get(t.AssetId?.toString());
      return info?.zone === siteFilter.toUpperCase();
    })
    .map(t => {
      const assetId = t.AssetId?.toString();
      const tripStartMs = new Date(t.TripStart).getTime();
      const tripEndMs = new Date(t.TripEnd).getTime();
      const startFuel = nearestFuelReading(
        fuelEntries, assetId, tripStartMs,
        [FUEL_EVENT_TYPE.TRIP_START, FUEL_EVENT_TYPE.FIVE_MIN],
        'before',
      );
      const endFuel = nearestFuelReading(
        fuelEntries, assetId, tripEndMs,
        [FUEL_EVENT_TYPE.TRIP_END, FUEL_EVENT_TYPE.FIVE_MIN],
        'after',
      );
      const fuelUsed = (startFuel && endFuel && startFuel.level > endFuel.level)
        ? startFuel.level - endFuel.level
        : null;
      const distanceKm = t.DistanceKilometers ?? 0;
      const drivingHours = (t.DrivingTime ?? t.Duration ?? 0) / 3600;
      const info = vehicles.get(assetId) || {};
      const driverId = t.DriverId?.toString() || null;
      return {
        tripId: t.TripId?.toString(),
        assetId,
        regNo: info.regNo || assetId,
        assetName: info.assetName || '',
        zone: info.zone || '',
        driverId,
        driverName: driverId ? (drivers.get(driverId) || 'N/A') : 'N/A',
        tripStart: t.TripStart,
        tripEnd: t.TripEnd,
        distanceKm,
        drivingHours,
        durationHours: (t.Duration ?? 0) / 3600,
        fuelUsedLiters: fuelUsed,
        litersPerKm: fuelUsed != null && distanceKm > 0 ? fuelUsed / distanceKm : null,
        litersPerHour: fuelUsed != null && drivingHours > 0 ? fuelUsed / drivingHours : null,
        startAddress: t.StartPosition?.FormattedAddress || null,
        endAddress: t.EndPosition?.FormattedAddress || null,
        maxSpeedKmh: t.MaxSpeedKilometersPerHour ?? null,
      };
    });

  const assetMap = new Map();
  quarryAssetIds.forEach(assetId => {
    const info = vehicles.get(assetId) || {};
    if (siteFilter && info.zone !== siteFilter.toUpperCase()) return;
    assetMap.set(assetId, {
      assetId,
      regNo: info.regNo || assetId,
      assetName: info.assetName || '',
      zone: info.zone || '',
      tripCount: 0,
      totalFuelLiters: 0,
      totalDistanceKm: 0,
      totalDrivingHours: 0,
      periodFuelLiters: periodFuelDrop(fuelEntries, assetId, start, end),
      refuelCount: refuels.filter(r => r.assetId === assetId).length,
      refuelLiters: refuels
        .filter(r => r.assetId === assetId)
        .reduce((sum, r) => sum + r.deltaLiters, 0),
      suspectDropCount: suspectDrops.filter(r => r.assetId === assetId).length,
      suspectDropLiters: suspectDrops
        .filter(r => r.assetId === assetId)
        .reduce((sum, r) => sum + r.deltaLiters, 0),
    });
  });

  tripRows.forEach(t => {
    const row = assetMap.get(t.assetId);
    if (!row) return;
    row.tripCount += 1;
    row.totalDistanceKm += t.distanceKm || 0;
    row.totalDrivingHours += t.drivingHours || 0;
    if (t.fuelUsedLiters != null) row.totalFuelLiters += t.fuelUsedLiters;
  });

  const assets = [...assetMap.values()].map(a => ({
    ...a,
    litersPerKm: a.totalFuelLiters > 0 && a.totalDistanceKm > 0 ? a.totalFuelLiters / a.totalDistanceKm : null,
    litersPerHour: a.totalFuelLiters > 0 && a.totalDrivingHours > 0 ? a.totalFuelLiters / a.totalDrivingHours : null,
    periodLitersPerHour: a.periodFuelLiters > 0 && a.totalDrivingHours > 0
      ? a.periodFuelLiters / a.totalDrivingHours
      : null,
  })).sort((a, b) => a.regNo.localeCompare(b.regNo));

  const siteTotals = {};
  assets.forEach(a => {
    const z = a.zone || 'Unknown';
    if (!siteTotals[z]) {
      siteTotals[z] = { zone: z, assets: 0, tripCount: 0, fuelLiters: 0, distanceKm: 0, drivingHours: 0, refuels: 0 };
    }
    siteTotals[z].assets += 1;
    siteTotals[z].tripCount += a.tripCount;
    siteTotals[z].fuelLiters += a.totalFuelLiters;
    siteTotals[z].distanceKm += a.totalDistanceKm;
    siteTotals[z].drivingHours += a.totalDrivingHours;
    siteTotals[z].refuels += a.refuelCount;
  });

  Object.values(siteTotals).forEach(s => {
    s.litersPerKm = s.fuelLiters > 0 && s.distanceKm > 0 ? s.fuelLiters / s.distanceKm : null;
    s.litersPerHour = s.fuelLiters > 0 && s.drivingHours > 0 ? s.fuelLiters / s.drivingHours : null;
  });

  const totalFuelLiters = assets.reduce((s, a) => s + a.totalFuelLiters, 0);
  const totalDistanceKm = assets.reduce((s, a) => s + a.totalDistanceKm, 0);
  const totalDrivingHours = assets.reduce((s, a) => s + a.totalDrivingHours, 0);
  const dailySeries = buildDailySeries(tripRows, start, end, period);

  return {
    period: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
    summary: {
      totalFuelLiters,
      totalDistanceKm,
      totalDrivingHours,
      tripCount: tripRows.length,
      refuelCount: refuels.length,
      suspectDropCount: suspectDrops.length,
    },
    dailySeries,
    assets,
    trips: tripRows.sort((a, b) => new Date(b.tripEnd).getTime() - new Date(a.tripEnd).getTime()),
    refuels: refuels.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    suspectDrops: suspectDrops.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    siteTotals: Object.values(siteTotals).sort((a, b) => a.zone.localeCompare(b.zone)),
  };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildDailySeries(tripRows, start, end, period) {
  const buckets = new Map();
  tripRows.forEach(t => {
    if (t.fuelUsedLiters == null || t.fuelUsedLiters <= 0) return;
    const d = new Date(t.tripEnd || t.tripStart);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + t.fuelUsedLiters);
  });

  const series = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);

  while (cur <= endD) {
    const key = cur.toISOString().slice(0, 10);
    const liters = Math.round((buckets.get(key) || 0) * 10) / 10;
    const day = WEEKDAY_LABELS[cur.getDay()];
    const label = period === 'month'
      ? cur.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : day;
    series.push({ date: key, day, label, liters });
    cur.setDate(cur.getDate() + 1);
  }

  if (period === 'week' && series.length <= 7) {
    const byDay = new Map(series.map(row => [row.day, row]));
    return WEEK_ORDER.map(day => byDay.get(day) || { date: '', day, label: day, liters: 0 });
  }

  return series;
}
