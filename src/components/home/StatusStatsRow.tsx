import { useMemo } from 'react';
import {
  Truck, Navigation, Clock, MapPin, ParkingCircle, WifiOff, Ban, AlertTriangle, Fuel, Route,
} from 'lucide-react';
import { useFleet, type StatusFilter, type DistanceRange } from '../../context/FleetContext';
import WidgetStatGraphic from './WidgetStatGraphic';

export type MetricPeriod = DistanceRange;

const DISTANCE_PERIOD_LABELS: Record<DistanceRange, string> = {
  '24h': 'Today',
  currentMonth: 'This Month',
  lastMonth: 'Last Month',
};

const STATUS_STATS = [
  { key: 'totalVehicles' as const, label: 'Total', filter: 'All' as StatusFilter, color: '#7c3aed', icon: Truck, tooltip: 'Total number of vehicles in the fleet' },
  { key: 'moving' as const, label: 'Moving', filter: 'Moving' as StatusFilter, color: '#16a34a', icon: Navigation, tooltip: 'Vehicle is actively travelling above 5 km/h' },
  { key: 'idle' as const, label: 'Idle', filter: 'Idle' as StatusFilter, color: '#d97706', icon: Clock, tooltip: 'Vehicle is idling' },
  { key: 'stationary' as const, label: 'Stationary', filter: 'Stationary' as StatusFilter, color: '#0d9488', icon: MapPin, tooltip: 'Vehicle has been stationary for less than 1 hour' },
  { key: 'parked' as const, label: 'Parked', filter: 'Parked' as StatusFilter, color: '#ea580c', icon: ParkingCircle, tooltip: 'Vehicle has been stationary for between 1 and 24 hours' },
  { key: 'offline' as const, label: 'Offline', filter: 'Offline' as StatusFilter, color: '#64748b', icon: WifiOff, tooltip: 'Vehicle has not moved in over 24 hours' },
  { key: 'inactive' as const, label: 'Non-Operational', filter: 'Inactive' as StatusFilter, color: '#2563eb', icon: Ban, tooltip: 'Vehicle has not moved in over 30 days' },
  { key: 'panic' as const, label: 'Panic', filter: 'All' as StatusFilter, color: '#c8102e', icon: AlertTriangle, tooltip: 'Vehicle has an active panic alert', isPanic: true },
];

/** Rough fuel display scaling until fuel consumption API is wired. */
function fuelPeriodMult(period: DistanceRange) {
  if (period === '24h') return 0.14;
  if (period === 'lastMonth') return 0.9;
  return 1;
}

interface Props {
  statusFilter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  metricPeriod: MetricPeriod;
  onMetricPeriodChange: (p: MetricPeriod) => void;
}

export default function StatusStatsRow({
  statusFilter,
  onFilterChange,
  metricPeriod,
  onMetricPeriodChange,
}: Props) {
  const { metadata, totalDistanceKm, fuelSeries, driverDistance } = useFleet();

  const totalFuel = useMemo(() => {
    const baseFuel = fuelSeries.reduce((s, d) => s + d.liters, 0);
    return Math.round(baseFuel * fuelPeriodMult(metricPeriod));
  }, [fuelSeries, metricPeriod]);

  const journeySub = driverDistance?.journeyCount != null
    ? `${driverDistance.journeyCount} journeys`
    : null;

  const getValue = (key: typeof STATUS_STATS[number]['key']) => {
    if (key === 'totalVehicles') return metadata.totalVehicles;
    if (key === 'panic') return metadata.panic ?? 0;
    return metadata[key];
  };

  return (
    <div className="bpl-status-stats-layout">
      <div className="bpl-status-stats-grid">
        {STATUS_STATS.map(stat => {
          const Icon = stat.icon;
          const value = getValue(stat.key);
          const isActive = !stat.isPanic && (
            stat.filter === 'All' ? statusFilter === 'All' : statusFilter === stat.filter
          );
          const pct = !stat.isPanic && stat.filter !== 'All' && metadata.totalVehicles > 0
            ? Math.round((value / metadata.totalVehicles) * 100)
            : null;

          return (
            <button
              key={stat.key}
              type="button"
              title={stat.tooltip}
              className={`bpl-card bpl-status-stat${isActive ? ' active' : ''}`}
              style={{
                borderTopColor: stat.color,
                cursor: stat.isPanic ? 'default' : 'pointer',
                background: isActive ? `${stat.color}10` : undefined,
                outline: isActive ? `1.5px solid ${stat.color}40` : 'none',
              }}
              onClick={() => {
                if (!stat.isPanic) onFilterChange(stat.filter);
              }}
            >
              <div className="bpl-status-stat-inner">
                <div className="bpl-status-stat-copy">
                  <span className="bpl-status-stat-label">{stat.label}</span>
                  <div
                    className="bpl-status-stat-value"
                    style={{
                      color: stat.color,
                      animation: stat.isPanic && value > 0 ? 'pulse 1.5s infinite' : 'none',
                    }}
                  >
                    {value}
                  </div>
                  <div className="bpl-status-stat-sub">
                    {pct !== null ? `${pct}% of fleet` : stat.isPanic ? 'active alerts' : 'vehicles'}
                  </div>
                </div>
                <WidgetStatGraphic color={stat.color} icon={Icon} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="bpl-status-metrics-col">
        <div className="bpl-card bpl-status-stat bpl-status-metric-card" style={{ borderTopColor: '#f97316' }}>
          <div className="bpl-status-stat-inner">
            <div className="bpl-status-stat-copy">
              <span className="bpl-status-stat-label">Total Fuel Used</span>
              <div className="bpl-status-stat-value" style={{ color: '#f97316' }}>
                {totalFuel.toLocaleString()}
                <span className="bpl-status-metric-unit">L</span>
              </div>
              <div className="bpl-status-stat-sub">
                <select
                  className="bpl-status-period-select"
                  value={metricPeriod}
                  onChange={e => onMetricPeriodChange(e.target.value as MetricPeriod)}
                  onClick={e => e.stopPropagation()}
                  aria-label="Fuel time period"
                >
                  {(Object.keys(DISTANCE_PERIOD_LABELS) as DistanceRange[]).map(p => (
                    <option key={p} value={p}>{DISTANCE_PERIOD_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>
            <WidgetStatGraphic color="#f97316" icon={Fuel} />
          </div>
        </div>

        <div className="bpl-card bpl-status-stat bpl-status-metric-card" style={{ borderTopColor: '#8b5cf6' }}>
          <div className="bpl-status-stat-inner">
            <div className="bpl-status-stat-copy">
              <span className="bpl-status-stat-label">Total Distance</span>
              <div className="bpl-status-stat-value" style={{ color: '#8b5cf6' }}>
                {totalDistanceKm.toLocaleString()}
                <span className="bpl-status-metric-unit">km</span>
              </div>
              <div className="bpl-status-stat-sub">
                <select
                  className="bpl-status-period-select"
                  value={metricPeriod}
                  onChange={e => onMetricPeriodChange(e.target.value as MetricPeriod)}
                  onClick={e => e.stopPropagation()}
                  aria-label="Distance time period"
                >
                  {(Object.keys(DISTANCE_PERIOD_LABELS) as DistanceRange[]).map(p => (
                    <option key={p} value={p}>{DISTANCE_PERIOD_LABELS[p]}</option>
                  ))}
                </select>
                {journeySub && (
                  <span style={{ display: 'block', marginTop: 4, fontSize: 10, color: 'var(--cd-text-muted)' }}>
                    {journeySub}
                  </span>
                )}
              </div>
            </div>
            <WidgetStatGraphic color="#8b5cf6" icon={Route} />
          </div>
        </div>
      </div>
    </div>
  );
}
