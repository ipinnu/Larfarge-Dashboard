import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Navigation, Clock, MapPin, ParkingCircle, WifiOff, Ban, Fuel, Route,
} from 'lucide-react';
import { useFleet, type StatusFilter, type DistanceRange } from '../../context/FleetContext';
import WidgetStatGraphic from './WidgetStatGraphic';
import InfoTip from '../InfoTip';
import { STATUS_DEFINITIONS } from '../../lib/metricDefinitions';
import { useFuelConsumptionByDistanceRange } from '../../hooks/useFuelConsumption';

export type MetricPeriod = DistanceRange;

const DISTANCE_PERIOD_LABELS: Record<DistanceRange, string> = {
  '24h': 'Today',
  currentMonth: 'This Month',
  lastMonth: 'Last Month',
};

const STATUS_STATS = [
  { key: 'totalVehicles' as const, label: 'Total', filter: 'All' as StatusFilter, color: '#7c3aed', icon: Truck, tip: STATUS_DEFINITIONS.total },
  { key: 'moving' as const, label: 'Moving', filter: 'Moving' as StatusFilter, color: '#16a34a', icon: Navigation, tip: STATUS_DEFINITIONS.moving },
  { key: 'idle' as const, label: 'Idle', filter: 'Idle' as StatusFilter, color: '#d97706', icon: Clock, tip: STATUS_DEFINITIONS.idle },
  { key: 'stationary' as const, label: 'Stationary', filter: 'Stationary' as StatusFilter, color: '#0d9488', icon: MapPin, tip: STATUS_DEFINITIONS.stationary },
  { key: 'parked' as const, label: 'Parked', filter: 'Parked' as StatusFilter, color: '#ea580c', icon: ParkingCircle, tip: STATUS_DEFINITIONS.parked },
  { key: 'offline' as const, label: 'Offline', filter: 'Offline' as StatusFilter, color: '#64748b', icon: WifiOff, tip: STATUS_DEFINITIONS.offline },
  { key: 'inactive' as const, label: 'Non-Operational', filter: 'Inactive' as StatusFilter, color: '#2563eb', icon: Ban, tip: STATUS_DEFINITIONS.nonOperational },
];

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
  const navigate = useNavigate();
  const { metadata, totalDistanceKm } = useFleet();
  const { data: fuelData, totalLiters: tripFuelLiters, loading: fuelLoading } = useFuelConsumptionByDistanceRange(metricPeriod);

  const quarryFuelLiters = useMemo(() => {
    if (tripFuelLiters > 0) return tripFuelLiters;
    const assets = fuelData?.assets ?? [];
    const periodDrop = assets.reduce((s, a) => s + (a.periodFuelLiters || 0), 0);
    if (periodDrop > 0) return Math.round(periodDrop);
    return tripFuelLiters;
  }, [tripFuelLiters, fuelData]);

  const getValue = (key: typeof STATUS_STATS[number]['key']) => {
    if (key === 'totalVehicles') return metadata.totalVehicles;
    return metadata[key];
  };

  return (
    <div className="bpl-status-stats-layout">
      <div className="bpl-status-stats-grid">
        {STATUS_STATS.map(stat => {
          const Icon = stat.icon;
          const value = getValue(stat.key);
          const isActive = stat.filter === 'All' ? statusFilter === 'All' : statusFilter === stat.filter;
          const pct = stat.filter !== 'All' && metadata.totalVehicles > 0
            ? Math.round((value / metadata.totalVehicles) * 100)
            : null;

          return (
            <button
              key={stat.key}
              type="button"
              className={`bpl-card bpl-status-stat${isActive ? ' active' : ''}`}
              style={{
                borderTopColor: stat.color,
                cursor: 'pointer',
                background: isActive ? `${stat.color}10` : undefined,
                outline: isActive ? `1.5px solid ${stat.color}40` : 'none',
              }}
              onClick={() => onFilterChange(stat.filter)}
            >
              <div className="bpl-status-stat-inner">
                <div className="bpl-status-stat-copy">
                  <span className="bpl-status-stat-label" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {stat.label}
                    <InfoTip text={stat.tip} label={stat.label} />
                  </span>
                  <div className="bpl-status-stat-value" style={{ color: stat.color }}>
                    {value}
                  </div>
                  <div className="bpl-status-stat-sub">
                    {pct !== null ? `${pct}% of fleet` : 'vehicles'}
                  </div>
                </div>
                <WidgetStatGraphic color={stat.color} icon={Icon} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="bpl-status-metrics-col">
        <button
          type="button"
          className="bpl-card bpl-status-stat bpl-status-metric-card"
          style={{ borderTopColor: '#f97316', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          title="Open quarry fuel consumption"
          onClick={() => navigate('/fuel/consumption')}
        >
          <div className="bpl-status-stat-inner">
            <div className="bpl-status-stat-copy">
              <span className="bpl-status-stat-label">Quarry Total Fuel Used</span>
              <div className="bpl-status-stat-value" style={{ color: '#f97316' }}>
                {fuelLoading && quarryFuelLiters === 0 ? '…' : quarryFuelLiters.toLocaleString()}
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
        </button>

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
              </div>
            </div>
            <WidgetStatGraphic color="#8b5cf6" icon={Route} />
          </div>
        </div>
      </div>
    </div>
  );
}
