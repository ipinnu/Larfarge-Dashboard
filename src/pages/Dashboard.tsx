import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Truck,
  Navigation, MapPin, Clock, Activity, LayoutGrid, Map, Table,
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import AnomaliesTable from '../components/AnomaliesTable';
import MapView from '../components/MapView';
import GroupedView from '../components/GroupedView';

type StatusFilter = 'All' | 'Moving' | 'Idle' | 'Excessive Idle' | 'Stationary' | 'Parked' | 'Offline' | 'Inactive';
type ViewMode = 'table' | 'map' | 'grouped';

const HIDDEN_LABELS = ['Possible Power Tamper', 'Battery Disconnection', 'Battery Disconnected', 'Front Panel Tamper', 'Back Panel Tamper', 'No Blue Key'];

function ScoreGauge({ score, delta, events, vehicleCount }: { score: number; delta: number; events: any[]; vehicleCount: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#CC0000';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Needs Attention' : 'Critical';

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);

  const totalIncidents = recent.length;
  const rate = vehicleCount > 0 ? ((totalIncidents / vehicleCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="bpl-card" style={{ padding: '20px 22px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cd-text-muted)', marginBottom: 14 }}>
        Fleet Safety Score
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
          <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="38" cy="38" r="32" fill="none" stroke="var(--cd-border)" strokeWidth="6" />
            <circle
              cx="38" cy="38" r="32" fill="none"
              stroke={color} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, color: 'var(--cd-text-muted)', fontWeight: 600 }}>/100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: 'var(--cd-font-display)', lineHeight: 1, marginBottom: 5 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 8 }}>
            {delta > 0 ? (
              <><TrendingUp size={12} color="#16a34a" /><span style={{ color: '#16a34a', fontWeight: 600 }}>+{delta} pt{Math.abs(delta) !== 1 ? 's' : ''} vs last month</span></>
            ) : delta < 0 ? (
              <><TrendingDown size={12} color="#CC0000" /><span style={{ color: '#CC0000', fontWeight: 600 }}>{delta} pts vs last month</span></>
            ) : (
              <><Minus size={12} color="var(--cd-text-muted)" /><span style={{ color: 'var(--cd-text-muted)' }}>No change vs last month</span></>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>{totalIncidents}</div>
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 2 }}>incidents / 30d</div>
            </div>
            <div style={{ width: 1, background: 'var(--cd-border)' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>{rate}</div>
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 2 }}>per 100 vehicles</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function AlertFeed({ events }: { events: any[] }) {
  const critical = events
    .filter(e => e.type === 'panic' || e.label === 'Harsh Braking')
    .slice(0, 5);

  if (critical.length === 0) {
    return (
      <div className="bpl-card" style={{ padding: '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 12, fontFamily: 'var(--cd-font-display)' }}>
          Active Alerts
        </div>
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>
          No critical alerts right now
        </div>
      </div>
    );
  }

  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Active Alerts</span>
        <span className="bpl-badge-red">{critical.length}</span>
      </div>
      <div>
        {critical.map((e, i) => (
          <div key={i} style={{
            padding: '12px 20px',
            borderBottom: i < critical.length - 1 ? '1px solid var(--cd-border)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#CC0000' }}>
                {e.label || 'Panic Alert'} — {e.driverName || 'Unknown Driver'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 2 }}>
                {e.regNo || e.assetId} · {e.address || 'Location unknown'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', flexShrink: 0, marginLeft: 12 }}>
              {e.eventTime ? new Date(e.eventTime).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentIncidents({ events }: { events: any[] }) {
  const visible = events
    .filter(e => !HIDDEN_LABELS.includes(e.label || ''))
    .slice(0, 8);

  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Recent Incidents</span>
        <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>Live · updates every 15s</span>
      </div>
      <div>
        {visible.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>No recent incidents</div>
        ) : visible.map((e, i) => {
          const isPanic = e.type === 'panic';
          return (
            <div key={i} style={{
              padding: '11px 20px',
              borderBottom: i < visible.length - 1 ? '1px solid var(--cd-border)' : 'none',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '10px',
              alignItems: 'center',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isPanic ? '#CC0000' : e.label === 'Harsh Braking' ? '#CC0000' : e.label?.includes('Overspeed') ? '#d97706' : '#d97706',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text)' }}>
                  {e.label || 'Panic'} — {e.driverName || e.assetName || 'Unknown'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>
                  {e.regNo || e.assetId}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', flexShrink: 0 }}>
                {e.eventTime ? new Date(e.eventTime).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IncidentBreakdown({ events }: { events: any[] }) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);

  const counts = {
    'Harsh Braking': recent.filter(e => e.label === 'Harsh Braking').length,
    'Overspeeding': recent.filter(e => e.label === 'Overspeeding' || e.label === 'Overspeed Tiered').length,
    'Harsh Accel.': recent.filter(e => e.label === 'Harsh Acceleration').length,
    'Harsh Cornering': recent.filter(e => e.label === 'Harsh Cornering').length,
    'Panic': recent.filter(e => e.type === 'panic').length,
  };

  const max = Math.max(...Object.values(counts), 1);
  const colors = ['#CC0000', '#d97706', '#f59e0b', '#8b5cf6', '#CC0000'];

  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Incident Breakdown</span>
        <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>Last 30 days</span>
      </div>
      <div className="bpl-card-body">
        {Object.entries(counts).map(([label, count], i) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: 'var(--cd-text)', fontWeight: 500 }}>{label}</span>
              <span style={{ color: 'var(--cd-text-muted)', fontWeight: 600 }}>{count}</span>
            </div>
            <div style={{ height: 5, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: colors[i],
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { metadata, vehicles, events, fleetSafetyScore, fleetScoreDelta, authFetch } = useFleet();

  const stats = [
    { label: 'Total Fleet', value: metadata.totalVehicles, icon: Truck, color: '#0078D4', filter: 'All' as StatusFilter },
    { label: 'Moving', value: metadata.moving, icon: Navigation, color: '#16a34a', filter: 'Moving' as StatusFilter },
    { label: 'Parked', value: metadata.parked, icon: MapPin, color: '#7C3AED', filter: 'Parked' as StatusFilter },
    { label: 'Idle', value: metadata.idle + metadata.excessiveIdle, icon: Clock, color: '#d97706', filter: 'Idle' as StatusFilter },
    { label: 'Offline', value: metadata.offline, icon: Activity, color: '#6B7A8D', filter: 'Offline' as StatusFilter },
  ];

  const handleMapAcknowledge = async (id: string) => {
    try {
      await authFetch('/api/acknowledged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {}
  };

  return (
    <div>
      {/* Page header */}
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Fleet Overview</h1>
        <p className="bpl-page-subtitle">Lafarge Nigeria — Real-time fleet intelligence</p>
      </div>

      {/* Top row: score + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, marginBottom: 20 }}>
        <ScoreGauge score={fleetSafetyScore} delta={fleetScoreDelta} events={events} vehicleCount={vehicles.length} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {stats.map(s => {
            const Icon = s.icon;
            const isActive = statusFilter === s.filter || (s.filter === 'All' && statusFilter === 'All');
            return (
              <button
                key={s.label}
                onClick={() => setStatusFilter(s.filter === 'All' ? 'All' : s.filter)}
                className="bpl-card"
                style={{
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                  borderTopColor: s.color, borderTopWidth: 3,
                  background: isActive ? `${s.color}10` : undefined,
                  outline: isActive ? `1.5px solid ${s.color}40` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cd-text-muted)' }}>
                    {s.label}
                  </span>
                  <Icon size={14} style={{ color: s.color, opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: 'var(--cd-font-display)' }}>
                  {s.value}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle row: alerts + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <AlertFeed events={events} />
        <IncidentBreakdown events={events} />
      </div>

      {/* Fleet view toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        {(['table', 'grouped', 'map'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className="bpl-btn-secondary"
            style={{
              padding: '5px 12px', fontSize: 12,
              background: viewMode === v ? 'var(--bpl-blue-soft)' : undefined,
              borderColor: viewMode === v ? 'var(--bpl-blue)' : undefined,
              color: viewMode === v ? 'var(--bpl-blue)' : undefined,
            }}
          >
            {v === 'table' && <><Table size={12} /> Table</>}
            {v === 'grouped' && <><LayoutGrid size={12} /> Grouped</>}
            {v === 'map' && <><Map size={12} /> Map</>}
          </button>
        ))}
      </div>

      {viewMode === 'table' && (
        <AnomaliesTable
          statusFilter={statusFilter}
          onFilterChange={f => setStatusFilter(f as StatusFilter)}
          authFetch={authFetch}
        />
      )}
      {viewMode === 'grouped' && (
        <GroupedView statusFilter={statusFilter} authFetch={authFetch} />
      )}
      {viewMode === 'map' && (
        <MapView
          authFetch={authFetch}
          statusFilter={statusFilter}
          onAcknowledge={handleMapAcknowledge}
        />
      )}

      {/* Recent incidents feed */}
      <RecentIncidents events={events} />
    </div>
  );
}
