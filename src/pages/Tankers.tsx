import { useState } from 'react';
import {
  Truck, Navigation, Clock, MapPin, Activity,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Route, LayoutGrid, Map, Table,
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import type { Vehicle, LogEntry } from '../context/FleetContext';
import { displayDriverName } from '../lib/driverUtils';

const TANKER_ZONES = ['bulk tanker', 'bulk tankers'];

function isTanker(v: Vehicle) {
  const zone = (v.zone || '').toLowerCase();
  return TANKER_ZONES.some(z => zone.includes(z));
}

type StatusFilter = 'All' | 'Moving' | 'Idle' | 'Stationary' | 'Parked' | 'Inactive';

// ── KPI Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon: Icon, active, onClick, tooltip,
}: {
  label: string; value: string | number; sub?: string; color: string;
  icon: React.ElementType; active?: boolean; onClick?: () => void; tooltip?: string;
}) {
  return (
    <button
      title={tooltip}
      onClick={onClick}
      className="bpl-card"
      style={{
        padding: '12px 14px', cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
        borderTopColor: color, borderTopWidth: 3,
        background: active ? `${color}10` : undefined,
        outline: active ? `1.5px solid ${color}40` : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cd-text-muted)' }}>
          {label}
        </span>
        <Icon size={13} style={{ color, opacity: 0.6 }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1, fontFamily: 'var(--cd-font-display)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 5 }}>{sub}</div>}
    </button>
  );
}

// ── Safety Score ─────────────────────────────────────────────────────────────

function TankerSafetyScore({ events, vehicleCount }: { events: LogEntry[]; vehicleCount: number }) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const REFERENCE = 50;

  const scoreFor = (evts: LogEntry[]) => {
    const scale = REFERENCE / Math.max(vehicleCount, 1);
    let d = 0;
    evts.forEach(e => {
      if (e.label === 'Harsh Braking') d += 2;
      else if (e.label === 'Harsh Acceleration') d += 1.5;
      else if (e.label === 'Overspeeding' || e.label === 'Overspeed Tiered') d += 1.5;
      else if (e.label === 'Harsh Cornering') d += 1;
      else if (e.type === 'panic') d += 5;
    });
    return Math.max(30, Math.min(100, Math.round(100 - d * scale)));
  };

  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);
  const prev   = events.filter(e => { const t = new Date(e.eventTime || e.timestamp).getTime(); return t >= sixtyDaysAgo && t < thirtyDaysAgo; });
  const score  = scoreFor(recent);
  const delta  = score - scoreFor(prev);

  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : score >= 45 ? '#e05c2a' : '#CC0000';
  const label = score >= 80 ? 'Good Standing' : score >= 60 ? 'Needs Attention' : score >= 45 ? 'Below Average' : 'Poor Performance';

  return (
    <div className="bpl-card" style={{ padding: '20px 22px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cd-text-muted)', marginBottom: 14 }}>
        Tanker Safety Score
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--cd-border)" strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, color: 'var(--cd-text-muted)', fontWeight: 600 }}>/100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'var(--cd-font-display)', marginBottom: 3 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 8 }}>
            {delta > 0
              ? <><TrendingUp size={12} color="#16a34a" /><span style={{ color: '#16a34a', fontWeight: 600 }}>+{delta} pts vs last month</span></>
              : delta < 0
              ? <><TrendingDown size={12} color="#CC0000" /><span style={{ color: '#CC0000', fontWeight: 600 }}>{delta} pts vs last month</span></>
              : <><Minus size={12} color="var(--cd-text-muted)" /><span style={{ color: 'var(--cd-text-muted)' }}>No change vs last month</span></>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>{recent.length}</div>
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 2 }}>incidents / 30d</div>
            </div>
            <div style={{ width: 1, background: 'var(--cd-border)' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>
                {vehicleCount > 0 ? ((recent.length / vehicleCount) * 100).toFixed(1) : '0.0'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 2 }}>per 100 vehicles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Zone Breakdown ────────────────────────────────────────────────────────────

function ZoneBreakdown({ tankers }: { tankers: Vehicle[] }) {
  const zones: Record<string, Vehicle[]> = {};
  tankers.forEach(v => {
    const z = v.zone || 'Unknown';
    if (!zones[z]) zones[z] = [];
    zones[z].push(v);
  });

  const colors = ['#0078D4', '#7C3AED'];

  return (
    <div className="bpl-card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 14 }}>
        By Zone
      </div>
      {Object.entries(zones).map(([zone, vehicles], i) => {
        const moving = vehicles.filter(v => v.status === 'Moving').length;
        const pct = Math.round((vehicles.length / tankers.length) * 100);
        const color = colors[i % colors.length];
        return (
          <div key={zone} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--cd-text)' }}>{zone}</span>
              <span style={{ color: 'var(--cd-text-muted)' }}>{vehicles.length} assets · <span style={{ color: '#16a34a', fontWeight: 600 }}>{moving} moving</span></span>
            </div>
            <div style={{ height: 6, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent Incidents ──────────────────────────────────────────────────────────

function TankerIncidents({ events }: { events: LogEntry[] }) {
  const visible = events.slice(0, 8);
  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Recent Incidents</span>
        <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>{events.length} total</span>
      </div>
      {visible.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>No incidents recorded</div>
      ) : visible.map((e, i) => (
        <div key={i} style={{
          padding: '11px 20px',
          borderBottom: i < visible.length - 1 ? '1px solid var(--cd-border)' : 'none',
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: e.type === 'panic' ? '#CC0000' : e.label === 'Harsh Braking' ? '#CC0000' : '#d97706',
          }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text)' }}>{e.label || 'Panic'}{displayDriverName(e.driverName) !== '—' ? ` — ${displayDriverName(e.driverName)}` : ''}</div>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>{e.regNo || e.assetId} · {e.address || 'Location unknown'}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', flexShrink: 0 }}>
            {e.eventTime ? new Date(e.eventTime).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Vehicle Table ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Moving: '#16a34a', Idle: '#d97706', 'Excessive Idle': '#CC0000',
  Stationary: '#0d9488', Parked: '#7C3AED', Offline: '#6B7A8D', Inactive: '#6878A0',
};

function TankerTable({ tankers, statusFilter }: { tankers: Vehicle[]; statusFilter: StatusFilter }) {
  const filtered = statusFilter === 'All' ? tankers : tankers.filter(v =>
    statusFilter === 'Inactive' ? (v.status === 'Inactive' || v.status === 'Offline') : v.status === statusFilter
  );

  return (
    <div className="bpl-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
          Tanker Fleet {statusFilter !== 'All' ? `— ${statusFilter}` : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>{filtered.length} vehicles</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--cd-surface-2)' }}>
              {['Reg No', 'Asset Name', 'Zone', 'Status', 'Speed', 'Location'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--cd-text-muted)' }}>No tankers match this filter</td></tr>
            ) : filtered.map((v, i) => {
              const color = STATUS_COLOR[v.status] ?? '#6B7A8D';
              return (
                <tr key={v.id} style={{ borderTop: '1px solid var(--cd-border)', background: i % 2 === 0 ? 'transparent' : 'var(--cd-surface-2)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', whiteSpace: 'nowrap' }}>{v.regNo}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--cd-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.assetName}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>{v.zone}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: `${color}18`, color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--cd-text-muted)', textAlign: 'right' }}>
                    {v.position?.speed != null && v.position.speed > 0 ? `${Math.round(v.position.speed)} km/h` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--cd-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.position?.address || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Tankers() {
  const { vehicles, events, driverDistance } = useFleet();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  const tankers = vehicles.filter(isTanker);
  const tankerIds = new Set(tankers.map(v => v.id));
  const tankerRegNos = new Set(tankers.map(v => v.regNo));

  // Events that belong to tanker assets
  const tankerEvents = events.filter(e => tankerIds.has(e.assetId?.toString() || '') || tankerRegNos.has(e.regNo || ''));

  // Distance data filtered to tankers
  const tankerAssets = (driverDistance?.assets || []).filter(a => tankerIds.has(a.assetId));
  const tankerDistanceKm = tankerAssets.reduce((s, a) => s + a.totalDistanceKm, 0);
  const tankerJourneys = tankerAssets.reduce((s, a) => s + a.journeyCount, 0);

  const total   = tankers.length;
  const moving  = tankers.filter(v => v.status === 'Moving').length;
  const idle    = tankers.filter(v => v.status === 'Idle' || v.status === 'Excessive Idle').length;
  const parked  = tankers.filter(v => v.status === 'Parked' || v.status === 'Stationary').length;
  const offline = tankers.filter(v => v.status === 'Inactive' || v.status === 'Offline').length;

  const stats = [
    { label: 'Total Tankers',  value: total,   color: '#0078D4', icon: Truck,       filter: 'All' as StatusFilter,      tooltip: 'All bulk tanker assets' },
    { label: 'Moving',         value: moving,  color: '#16a34a', icon: Navigation,  filter: 'Moving' as StatusFilter,   tooltip: 'Currently on road above 5 km/h' },
    { label: 'Idle',           value: idle,    color: '#d97706', icon: Clock,       filter: 'Idle' as StatusFilter,     tooltip: 'Engine on, not moving' },
    { label: 'Parked',         value: parked,  color: '#7C3AED', icon: MapPin,      filter: 'Parked' as StatusFilter,   tooltip: 'Stationary or parked' },
    { label: 'Temp Inactive',  value: offline, color: '#6B7A8D', icon: Activity,    filter: 'Inactive' as StatusFilter, tooltip: 'Offline or inactive 24h+' },
  ];

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Bulk Tankers</h1>
        <p className="bpl-page-subtitle">East & West zones — {total} assets tracked</p>
      </div>

      {/* Top row: score + KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, marginBottom: 20 }}>
        <TankerSafetyScore events={tankerEvents} vehicleCount={total} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {stats.map(s => (
              <StatCard
                key={s.label} label={s.label} value={s.value}
                color={s.color} icon={s.icon} tooltip={s.tooltip}
                active={statusFilter === s.filter}
                onClick={() => setStatusFilter(s.filter)}
                sub={s.filter !== 'All' && total > 0 ? `${Math.round((s.value / total) * 100)}% of fleet` : 'total assets'}
              />
            ))}
          </div>

          {/* Distance row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <StatCard label="Distance Today" value={`${tankerDistanceKm.toFixed(0)} km`} color="#0078D4" icon={Route}
              sub={`${tankerJourneys} journeys recorded`} />
            <ZoneBreakdown tankers={tankers} />
          </div>
        </div>
      </div>

      {/* Incidents + view toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 20 }}>
        <TankerIncidents events={tankerEvents} />

        <div className="bpl-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 14 }}>
            Incident Breakdown
          </div>
          {(() => {
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const recent = tankerEvents.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);
            const counts = [
              { label: 'Overspeeding',   n: recent.filter(e => e.label?.includes('Overspeed')).length, color: '#d97706' },
              { label: 'Harsh Braking',  n: recent.filter(e => e.label === 'Harsh Braking').length,    color: '#CC0000' },
              { label: 'Harsh Accel.',   n: recent.filter(e => e.label === 'Harsh Acceleration').length, color: '#f59e0b' },
              { label: 'Harsh Cornering',n: recent.filter(e => e.label === 'Harsh Cornering').length,  color: '#8b5cf6' },
              { label: 'Panic',          n: recent.filter(e => e.type === 'panic').length,              color: '#CC0000' },
            ];
            const max = Math.max(...counts.map(c => c.n), 1);
            return counts.map(c => (
              <div key={c.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--cd-text)', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ color: 'var(--cd-text-muted)', fontWeight: 600 }}>{c.n}</span>
                </div>
                <div style={{ height: 5, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.n / max) * 100}%`, background: c.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Fleet table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['All', 'Moving', 'Idle', 'Parked', 'Inactive'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className="bpl-btn-secondary"
              style={{
                padding: '5px 12px', fontSize: 12,
                background: statusFilter === f ? 'var(--bpl-blue-soft)' : undefined,
                borderColor: statusFilter === f ? 'var(--bpl-blue)' : undefined,
                color: statusFilter === f ? 'var(--bpl-blue)' : undefined,
              }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['table', 'grouped'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)} className="bpl-btn-secondary"
              style={{
                padding: '5px 12px', fontSize: 12,
                background: viewMode === v ? 'var(--bpl-blue-soft)' : undefined,
                borderColor: viewMode === v ? 'var(--bpl-blue)' : undefined,
                color: viewMode === v ? 'var(--bpl-blue)' : undefined,
              }}>
              {v === 'table' ? <><Table size={12} /> Table</> : <><LayoutGrid size={12} /> Grouped</>}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'table' ? (
        <TankerTable tankers={tankers} statusFilter={statusFilter} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {Object.entries(
            tankers.reduce((acc, v) => {
              const z = v.zone || 'Unknown'; if (!acc[z]) acc[z] = []; acc[z].push(v); return acc;
            }, {} as Record<string, Vehicle[]>)
          ).sort(([a], [b]) => a.localeCompare(b)).map(([zone, zvehicles]) => {
            const filtered = statusFilter === 'All' ? zvehicles : zvehicles.filter(v =>
              statusFilter === 'Inactive' ? (v.status === 'Inactive' || v.status === 'Offline') : v.status === statusFilter
            );
            return (
              <div key={zone} className="bpl-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>{zone}</span>
                  <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>{filtered.length} / {zvehicles.length}</span>
                </div>
                {filtered.slice(0, 12).map((v, i) => {
                  const color = STATUS_COLOR[v.status] ?? '#6B7A8D';
                  return (
                    <div key={v.id} style={{ padding: '9px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>{v.regNo}</div>
                        <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 1 }}>{v.assetName?.trim()}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: `${color}18`, color }}>{v.status}</span>
                    </div>
                  );
                })}
                {filtered.length > 12 && (
                  <div style={{ padding: '8px 18px', fontSize: 11, color: 'var(--cd-text-muted)', borderTop: '1px solid var(--cd-border)' }}>
                    +{filtered.length - 12} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
