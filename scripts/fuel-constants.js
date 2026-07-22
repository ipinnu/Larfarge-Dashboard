/** Shared MiX fuel-probe event IDs and quarry zones */

export const FUEL_PROBE_1MIN_TICKER_EVENT_TYPE_ID = '-6061736210584957932';
export const FUEL_PROBE_5MIN_TICKER_EVENT_TYPE_ID = '7835540334200528539';
export const FUEL_PROBE_TRIP_START_EVENT_TYPE_ID = '7732808521542418259';
export const FUEL_PROBE_TRIP_END_EVENT_TYPE_ID = '-1651664568698074374';

export const FUEL_PROBE_KNOWN_IDS = new Set([
  FUEL_PROBE_1MIN_TICKER_EVENT_TYPE_ID,
  FUEL_PROBE_5MIN_TICKER_EVENT_TYPE_ID,
  FUEL_PROBE_TRIP_START_EVENT_TYPE_ID,
  FUEL_PROBE_TRIP_END_EVENT_TYPE_ID,
]);

export const FUEL_PROBE_LOG_IDS = new Set([
  FUEL_PROBE_5MIN_TICKER_EVENT_TYPE_ID,
  FUEL_PROBE_TRIP_START_EVENT_TYPE_ID,
  FUEL_PROBE_TRIP_END_EVENT_TYPE_ID,
]);

export const FUEL_EVENT_TYPE = {
  FIVE_MIN: '5min_ticker',
  TRIP_START: 'trip_start',
  TRIP_END: 'trip_end',
};

const ID_TO_EVENT_TYPE = {
  [FUEL_PROBE_5MIN_TICKER_EVENT_TYPE_ID]: FUEL_EVENT_TYPE.FIVE_MIN,
  [FUEL_PROBE_TRIP_START_EVENT_TYPE_ID]: FUEL_EVENT_TYPE.TRIP_START,
  [FUEL_PROBE_TRIP_END_EVENT_TYPE_ID]: FUEL_EVENT_TYPE.TRIP_END,
};

export const QUARRY_ZONES = new Set([
  'QUARRY EWEKORO',
  'QUARRY MFAMOSING',
]);

export function fuelEventTypeFromId(eventTypeId) {
  return ID_TO_EVENT_TYPE[eventTypeId?.toString()] ?? null;
}

export function extractFuelLevel(event) {
  const raw = event.Value ?? event.EventValue ?? event.FuelLevel
    ?? event.FuelLevelPercentage ?? event.ValueNumber ?? null;
  if (raw === null || raw === undefined) return null;
  const parsed = Math.max(0, parseFloat(raw));
  return Number.isNaN(parsed) ? null : parsed;
}

export function extractEventTimestamp(event) {
  const ts = event.EventDateTime ?? event.StartDateTime ?? event.ReceivedDateTime;
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeFuelLogEntry({ assetId, level, timestamp, eventType, eventId, driverId }) {
  return JSON.stringify({
    assetId,
    level,
    timestamp,
    eventType,
    ...(eventId ? { eventId } : {}),
    ...(driverId ? { driverId } : {}),
  });
}

export function safeParseJsonBigInt(text) {
  return JSON.parse(text.replace(/:\s*(-?\d{16,})/g, ': "$1"'));
}

export function getSinceTokenDaysAgo(daysAgo) {
  const effective = Math.max(1, daysAgo - 1);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - effective);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}000000000`;
}
