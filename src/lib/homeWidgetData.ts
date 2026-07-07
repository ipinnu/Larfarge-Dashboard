import type { LogEntry, Vehicle } from '../context/FleetContext';
import { isKnownDriver } from './driverUtils';

export type StatusFilter =
  | 'All'
  | 'Moving'
  | 'Idle'
  | 'Excessive Idle'
  | 'Stationary'
  | 'Parked'
  | 'Offline'
  | 'Inactive';

export interface AlertItem {
  id: string;
  label: string;
  vehicle: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface DriverScore {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MaintenanceItem {
  vehicle: string;
  assetName: string;
  service: string;
  due: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface FuelDay {
  day: string;
  liters: number;
}

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  type: 'fuel' | 'safety' | 'route' | 'maintenance';
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function deriveAlerts(events: LogEntry[]): AlertItem[] {
  return events
    .filter(e => e.type === 'panic' || e.label === 'Harsh Braking' || e.label === 'Overspeeding')
    .slice(0, 6)
    .map(e => ({
      id: e.eventId,
      label: e.type === 'panic' ? 'Panic Alert' : (e.label || 'Incident'),
      vehicle: e.regNo || e.assetId || 'Unknown',
      time: timeAgo(e.eventTime || e.timestamp),
      severity: e.type === 'panic' ? 'critical' as const
        : e.label === 'Harsh Braking' ? 'warning' as const
        : 'info' as const,
    }));
}

export function deriveDriverScores(events: LogEntry[]): DriverScore[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const byDriver = new Map<string, { recent: number; prev: number }>();

  events.forEach(e => {
    const name = e.driverName;
    if (!isKnownDriver(name)) return;
    const t = new Date(e.eventTime || e.timestamp).getTime();
    if (!byDriver.has(name)) byDriver.set(name, { recent: 0, prev: 0 });
    const row = byDriver.get(name)!;
    if (t >= thirtyDaysAgo) row.recent++;
    else if (t >= sixtyDaysAgo) row.prev++;
  });

  return [...byDriver.entries()]
    .map(([name, { recent, prev }]) => ({
      name,
      score: Math.max(35, Math.min(100, 100 - recent * 3)),
      trend: recent < prev ? 'up' as const : recent > prev ? 'down' as const : 'stable' as const,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);
}

export function deriveInsights(events: LogEntry[], vehicles: Vehicle[]): AiInsight[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);
  const panic = recent.filter(e => e.type === 'panic').length;
  const harsh = recent.filter(e => e.label === 'Harsh Braking').length;
  const lowFuel = vehicles.filter(v => {
    const level = (v as Vehicle & { fuelLevel?: { level: number } }).fuelLevel?.level;
    return level != null && level < 20;
  }).length;

  const insights: AiInsight[] = [];
  if (harsh > 0) {
    insights.push({
      id: 'safety-harsh',
      title: 'Harsh braking activity',
      description: `${harsh} harsh braking event${harsh === 1 ? '' : 's'} in the last 30 days — coaching review suggested.`,
      type: 'safety',
    });
  }
  if (panic > 0) {
    insights.push({
      id: 'safety-panic',
      title: 'Active panic alerts',
      description: `${panic} panic alert${panic === 1 ? '' : 's'} logged recently — verify operator response.`,
      type: 'safety',
    });
  }
  if (lowFuel > 0) {
    insights.push({
      id: 'fuel-low',
      title: 'Low fuel levels',
      description: `${lowFuel} vehicle${lowFuel === 1 ? '' : 's'} below 20% probe reading.`,
      type: 'fuel',
    });
  }
  if (insights.length === 0) {
    insights.push({
      id: 'all-clear',
      title: 'Fleet operating normally',
      description: 'No significant anomalies detected in recent telemetry.',
      type: 'safety',
    });
  }
  return insights.slice(0, 3);
}

export function normalizeVehicle(v: Vehicle) {
  return {
    ...v,
    address: v.position?.address || '—',
    site: v.site || 'Unknown',
    zone: (v as Vehicle & { zone?: string }).zone,
  };
}

export const DEFAULT_MAINTENANCE: MaintenanceItem[] = [
  { vehicle: '—', assetName: 'Fleet service', service: 'Scheduled maintenance', due: 'Review schedule', urgency: 'low' },
];

export const DEFAULT_FUEL_SERIES: FuelDay[] = [
  { day: 'Mon', liters: 0 },
  { day: 'Tue', liters: 0 },
  { day: 'Wed', liters: 0 },
  { day: 'Thu', liters: 0 },
  { day: 'Fri', liters: 0 },
  { day: 'Sat', liters: 0 },
  { day: 'Sun', liters: 0 },
];

export interface TripItem {
  id: string;
  vehicle: string;
  driver: string;
  route: string;
  timing: 'On Time' | 'Delayed' | 'Completed';
  status: 'Ongoing' | 'Completed';
  progress: number;
  eta: string;
}

export const DEMO_TRIPS: TripItem[] = [
  { id: '1', vehicle: 'FLT-0042', driver: 'Alex Morgan', route: 'North Quarry → Central Depot', timing: 'On Time', status: 'Ongoing', progress: 72, eta: '14:30' },
  { id: '2', vehicle: 'FLT-0033', driver: 'Sam Rivera', route: 'Quarry → East Terminal', timing: 'Delayed', status: 'Ongoing', progress: 45, eta: '15:10' },
  { id: '3', vehicle: 'FLT-0017', driver: 'Jordan Lee', route: 'West Depot → South Plant', timing: 'On Time', status: 'Ongoing', progress: 88, eta: '13:45' },
  { id: '4', vehicle: 'FLT-0055', driver: 'Taylor Reed', route: 'Hub → North Quarry', timing: 'Completed', status: 'Completed', progress: 100, eta: '12:00' },
];
