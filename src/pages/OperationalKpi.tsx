import { useState, useEffect, useCallback, useMemo } from 'react';
import { Gauge, AlertTriangle, Zap, Eye, Search, Truck } from 'lucide-react';
import { authFetch } from '../context/FleetContext';
import {
  type KpiPeriodMode,
  type KpiScope,
  type KpiData,
  type KpiAssetRow,
  buildKpiUrl,
  defaultKpiCustomRange,
  ASSET_CLASS_LABELS,
} from '../lib/operationalKpi';
import { cachedFetchJson, cachePeek, CACHE_KEYS, CACHE_TTL } from '../lib/apiCache';
import { KPI_DEFINITIONS } from '../lib/metricDefinitions';
import InfoTip from '../components/InfoTip';

function fmt(n: number | null | undefined, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toFixed(digits);
}

function fmtPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function fmtHours(h: number | null | undefined) {
  if (h == null || Number.isNaN(h) || h <= 0) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(1)} h`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pctColor(pct: number | null) {
  if (pct == null) return 'var(--cd-text-muted)';
  if (pct >= 60) return '#16a34a';
  if (pct >= 35) return '#d97706';
  return '#dc2626';
}

function PctBar({ pct }: { pct: number | null }) {
  if (pct == null) return <span style={{ color: 'var(--cd-text-muted)' }}>—</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--cd-surface-2)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 3, background: pctColor(pct) }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: pctColor(pct), minWidth: 42, textAlign: 'right' }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

const FATIGUE_LABELS: Record<string, { label: string; color: string }> = {
  fatigue_yawning: { label: 'Yawning', color: '#d97706' },
  fatigue_eye_closing: { label: 'Eye Closing', color: '#dc2626' },
  distraction: { label: 'Distraction', color: '#7c3aed' },
  phone_distraction: { label: 'Phone Use', color: '#0078D4' },
};

export default function OperationalKpi() {
  const [scope, setScope] = useState<KpiScope>('quarry');
  const [period, setPeriod] = useState<KpiPeriodMode>('week');
  const [customRange, setCustomRange] = useState(defaultKpiCustomRange);
  const initialUrl = buildKpiUrl('week', 'quarry');
  const [data, setData] = useState<KpiData | null>(
    () => cachePeek<KpiData>(CACHE_KEYS.kpi(initialUrl)),
  );
  const [loading, setLoading] = useState(() => !cachePeek(CACHE_KEYS.kpi(initialUrl)));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof KpiAssetRow>('regNo');
  const [sortDesc, setSortDesc] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    const url = buildKpiUrl(period, scope, customRange.from, customRange.to);
    const cacheKey = CACHE_KEYS.kpi(url);

    if (!silent) {
      const cached = cachePeek<KpiData>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    try {
      const next = await cachedFetchJson<KpiData>(
        cacheKey,
        CACHE_TTL.kpi,
        async () => {
          const res = await authFetch(url);
          if (!res.ok) return null;
          return res.json();
        },
        // Never force — TTL + server cache handle freshness; force made every poll ~20s
      );
      if (next) setData(next);
    } catch { /* keep prior */ }
    finally {
      if (!silent) setLoading(false);
    }
  }, [period, scope, customRange.from, customRange.to]);

  useEffect(() => { void fetchData(false); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => void fetchData(true), 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const initialLoading = loading && data === null;
  const summary = data?.summary;

  const assets = useMemo(() => {
    let rows = data?.assets ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(a =>
        (a.regNo || '').toLowerCase().includes(q)
        || (a.assetName || '').toLowerCase().includes(q)
        || (a.zone || '').toLowerCase().includes(q));
    }
    const sorted = [...rows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDesc ? vb.localeCompare(va) : va.localeCompare(vb);
      }
      const na = typeof va === 'number' ? va : -Infinity;
      const nb = typeof vb === 'number' ? vb : -Infinity;
      return sortDesc ? nb - na : na - nb;
    });
    return sorted;
  }, [data?.assets, search, sortKey, sortDesc]);

  const hasLoadData = (data?.assets ?? []).some(a => a.loadCount > 0);
  const fatigueDrivers = data?.fatigue.drivers ?? [];
  const fatigueEvents = data?.fatigue.events ?? [];

  const toggleSort = (key: keyof KpiAssetRow) => {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  };

  const kpiCards = [
    { label: 'Utilization (avg)', value: fmtPct(summary?.avgUtilizationPct), hint: 'Working while in use', tip: KPI_DEFINITIONS.utilization },
    { label: 'Availability (avg)', value: fmtPct(summary?.avgAvailabilityPct), hint: 'Engine runtime / period hours', tip: KPI_DEFINITIONS.availability },
    { label: 'Engine runtime', value: fmtHours(summary?.totalEngineHours ?? 0), hint: `${summary?.assetCount ?? 0} assets`, tip: KPI_DEFINITIONS.engineRuntime },
    { label: 'Loaded duration', value: fmtHours(summary?.totalLoadedHours ?? 0), hint: 'From loaded-truck events', tip: KPI_DEFINITIONS.loadedDuration },
    { label: 'Harsh braking', value: String(summary?.harshBrakingTotal ?? 0), hint: 'Event count', tip: KPI_DEFINITIONS.harshBraking },
    { label: 'Overspeeding', value: String(summary?.overspeedTotal ?? 0), hint: `${fmtHours(summary?.overspeedHoursTotal ?? 0)} duration`, tip: KPI_DEFINITIONS.overspeeding },
    { label: 'Fatigue events', value: String(summary?.fatigueEventTotal ?? 0), hint: `${summary?.yawningTotal ?? 0} yawning`, tip: KPI_DEFINITIONS.fatigue },
  ];

  const columns: { key: keyof KpiAssetRow; label: string; tip?: string }[] = [
    { key: 'regNo', label: 'Reg' },
    { key: 'assetClass', label: 'Class' },
    { key: 'engineHours', label: 'Engine h', tip: KPI_DEFINITIONS.engineRuntime },
    { key: 'loadedHours', label: 'Loaded h', tip: KPI_DEFINITIONS.loadedDuration },
    { key: 'loadCount', label: 'Loads' },
    { key: 'utilizationPct', label: 'Utilization', tip: KPI_DEFINITIONS.utilization },
    { key: 'availabilityPct', label: 'Availability', tip: KPI_DEFINITIONS.availability },
    { key: 'harshBrakingCount', label: 'Harsh braking', tip: KPI_DEFINITIONS.harshBraking },
    { key: 'overspeedCount', label: 'Overspeed', tip: KPI_DEFINITIONS.overspeeding },
    { key: 'yawningCount', label: 'Fatigue', tip: KPI_DEFINITIONS.fatigue },
  ];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Gauge size={18} color="#0078D4" />
        Utilization &amp; KPIs
      </div>
      <p style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginBottom: 20 }}>
        Utilization = how much the truck was actually working while it was in use (operational time ÷ available engine time).
        Availability = engine runtime vs hours in the selected period. Harsh braking, overspeeding and fatigue come from MiX event telemetry.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cd-text-muted)' }} />
          <input
            type="text"
            placeholder="Search reg no, asset, zone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 13,
              background: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['quarry', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: scope === s ? '1px solid #0078D4' : '1px solid var(--cd-border)',
                background: scope === s ? 'rgba(0,120,212,0.12)' : 'transparent',
                color: scope === s ? '#0078D4' : 'var(--cd-text-muted)',
              }}
            >
              <Truck size={13} />
              {s === 'quarry' ? 'Quarry (DT/EXC)' : 'All fleet'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: period === p ? '1px solid #0078D4' : '1px solid var(--cd-border)',
                background: period === p ? 'rgba(0,120,212,0.12)' : 'transparent',
                color: period === p ? '#0078D4' : 'var(--cd-text-muted)',
              }}
            >
              {p === 'day' ? 'Today' : p === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
          <button
            onClick={() => setPeriod('custom')}
            style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: period === 'custom' ? '1px solid #0078D4' : '1px solid var(--cd-border)',
              background: period === 'custom' ? 'rgba(0,120,212,0.12)' : 'transparent',
              color: period === 'custom' ? '#0078D4' : 'var(--cd-text-muted)',
            }}
          >
            Custom
          </button>
        </div>

        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={customRange.from} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--cd-border)', fontSize: 12 }} />
            <span style={{ color: 'var(--cd-text-muted)', fontSize: 12 }}>to</span>
            <input type="date" value={customRange.to} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--cd-border)', fontSize: 12 }} />
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{
            padding: '14px 16px', borderRadius: 10,
            background: 'var(--cd-surface)', border: '1px solid var(--cd-border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              {k.label}
              <InfoTip text={k.tip} label={k.label} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cd-text)' }}>{initialLoading ? '…' : k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 2 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      {!hasLoadData && !initialLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 20,
          background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)',
          fontSize: 12, color: 'var(--cd-text)',
        }}>
          <AlertTriangle size={14} color="#d97706" />
          Loaded-truck payload events are sparse in this period — “Loaded h” may show “—”. Utilization (info) means working while in use;
          engine runtime and availability are live from trips.
        </div>
      )}

      {/* Asset table */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--cd-text)' }}>
          By asset
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--cd-text-muted)', marginLeft: 8 }}>
            Click a column to sort · harsh braking score = count ÷ 3 · overspeed score = count ÷ 1
          </span>
        </div>
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--cd-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--cd-surface-2)', textAlign: 'left' }}>
                {columns.map(c => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    style={{ padding: '10px 12px', fontWeight: 600, color: sortKey === c.key ? '#0078D4' : 'var(--cd-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {c.label}{sortKey === c.key ? (sortDesc ? ' ↓' : ' ↑') : ''}
                      {c.tip && <InfoTip text={c.tip} label={c.label} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                <tr><td colSpan={columns.length} style={{ padding: 20, textAlign: 'center', color: 'var(--cd-text-muted)' }}>Loading…</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ padding: 20, textAlign: 'center', color: 'var(--cd-text-muted)' }}>
                  {search.trim() ? `No assets match "${search.trim()}"` : 'No activity in this period'}
                </td></tr>
              ) : assets.map(a => (
                <tr key={a.assetId} style={{ borderTop: '1px solid var(--cd-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }} title={a.assetName}>{a.regNo}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>{ASSET_CLASS_LABELS[a.assetClass]}</td>
                  <td style={{ padding: '8px 12px' }}>{fmt(a.engineHours)}</td>
                  <td style={{ padding: '8px 12px' }}>{a.loadCount > 0 ? fmt(a.loadedHours) : '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{a.loadCount || '—'}</td>
                  <td style={{ padding: '8px 12px' }}><PctBar pct={a.utilizationPct} /></td>
                  <td style={{ padding: '8px 12px' }}><PctBar pct={a.availabilityPct} /></td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {a.harshBrakingCount > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        {a.harshBrakingCount}
                        <span style={{ fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 6, fontSize: 11 }}>
                          {a.harshBrakingSharePct != null ? `${a.harshBrakingSharePct.toFixed(0)}% of fleet` : ''}
                        </span>
                      </span>
                    ) : '0'}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {a.overspeedCount > 0 ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                        {a.overspeedCount}
                        <span style={{ fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 6, fontSize: 11 }}>
                          {fmtHours(a.overspeedHours)}
                        </span>
                      </span>
                    ) : '0'}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {(a.yawningCount + a.eyeClosingCount + a.distractionCount + a.phoneDistractionCount) > 0 ? (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                        {a.yawningCount + a.eyeClosingCount + a.distractionCount + a.phoneDistractionCount}
                        {a.yawningCount > 0 && (
                          <span style={{ fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 6, fontSize: 11 }}>
                            {a.yawningCount} yawn
                          </span>
                        )}
                      </span>
                    ) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fatigue management */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--cd-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={15} color="#7c3aed" />
          Fatigue management
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--cd-text-muted)', marginLeft: 4 }}>
            MiX Vision in-cab camera events — yawning, eye closing, distraction, phone use
          </span>
        </div>

        {fatigueDrivers.length === 0 ? (
          <div style={{
            padding: '18px 16px', borderRadius: 10, border: '1px dashed var(--cd-border)',
            fontSize: 12, color: 'var(--cd-text-muted)', textAlign: 'center',
          }}>
            No fatigue events recorded in this period. Events appear here as soon as MiX Vision
            fatigue telemetry (yawning / eye closing) is received.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--cd-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--cd-surface-2)', textAlign: 'left' }}>
                    {['Driver', 'Yawning', 'Eye Closing', 'Distraction', 'Phone', 'Total', 'Last event'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fatigueDrivers.map((d, i) => (
                    <tr key={d.driverId ?? i} style={{ borderTop: '1px solid var(--cd-border)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }} title={d.vehicles.join(', ')}>{d.driverName}</td>
                      <td style={{ padding: '8px 12px', color: d.yawningCount > 0 ? '#d97706' : undefined }}>{d.yawningCount}</td>
                      <td style={{ padding: '8px 12px', color: d.eyeClosingCount > 0 ? '#dc2626' : undefined }}>{d.eyeClosingCount}</td>
                      <td style={{ padding: '8px 12px' }}>{d.distractionCount}</td>
                      <td style={{ padding: '8px 12px' }}>{d.phoneDistractionCount}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{d.totalEvents}</td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--cd-text-muted)' }}>{fmtDate(d.lastEventTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderRadius: 10, border: '1px solid var(--cd-border)', maxHeight: 420, overflowY: 'auto' }}>
              {fatigueEvents.map((e, i) => {
                const meta = FATIGUE_LABELS[e.category] ?? { label: e.label, color: 'var(--cd-text-muted)' };
                return (
                  <div key={e.eventId ?? i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', borderTop: i > 0 ? '1px solid var(--cd-border)' : 'none',
                  }}>
                    <Zap size={13} color={meta.color} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text)' }}>
                        {meta.label}
                        <span style={{ fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 6 }}>{e.regNo}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>
                        {e.driverName}{e.speed != null ? ` · ${Math.round(e.speed)} km/h` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(e.eventTime)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
