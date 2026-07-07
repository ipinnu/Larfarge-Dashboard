import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Phone } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import type { LogEntry } from '../context/FleetContext';
import { isKnownDriver, displayDriverName } from '../lib/driverUtils';

const HIDDEN_LABELS = ['Possible Power Tamper', 'Battery Disconnection', 'Battery Disconnected', 'Front Panel Tamper', 'Back Panel Tamper', 'No Blue Key'];
const LABEL_KEYS = ['Harsh Braking', 'Harsh Acceleration', 'Overspeeding', 'Overspeed Tiered', 'Harsh Cornering'];

type DateRange = 'today' | '7days' | '30days' | 'alltime';

interface DriverProfile {
  name: string;
  phone: string;
  assetName: string;
  regNo: string;
  transporter: string;
  harshBraking: number;
  harshAccel: number;
  overspeeding: number;
  cornering: number;
  panic: number;
  total: number;
  score: number;
  trend: 'up' | 'stable' | 'down';
  events: LogEntry[];
}

function computeScore(counts: { harshBraking: number; harshAccel: number; overspeeding: number; cornering: number; panic: number }) {
  let s = 100;
  s -= counts.harshBraking * 3;
  s -= counts.harshAccel * 2;
  s -= counts.overspeeding * 2;
  s -= counts.cornering * 1;
  s -= counts.panic * 8;
  return Math.max(35, Math.min(100, Math.round(s)));
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#CC0000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 30 }}>{score}</span>
    </div>
  );
}

function DriverCard({ driver, expanded, onToggle }: { driver: DriverProfile; expanded: boolean; onToggle: () => void }) {
  const color = driver.score >= 80 ? '#16a34a' : driver.score >= 60 ? '#d97706' : '#CC0000';
  const level = driver.score >= 80 ? 'LOW RISK' : driver.score >= 60 ? 'MODERATE' : 'HIGH RISK';
  const recentEvents = driver.events.slice(0, 10);

  return (
    <div className="bpl-card" style={{ overflow: 'hidden', borderLeft: `4px solid ${color}` }}>
      <div
        onClick={onToggle}
        style={{
          padding: '14px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16,
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `${color}20`, border: `2px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color,
        }}>
          {driver.name.charAt(0)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--cd-text)', fontSize: 14 }}>{driver.name}</div>
          <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
            <span>{driver.regNo}</span>
            <span>·</span>
            <span>{driver.assetName}</span>
            {driver.phone && driver.phone !== 'N/A' && <><span>·</span><span>{driver.phone}</span></>}
          </div>
        </div>

        {/* Score */}
        <div style={{ width: 140, flexShrink: 0 }}>
          <ScoreBar score={driver.score} />
        </div>

        {/* Risk level */}
        <div style={{ flexShrink: 0 }}>
          <span style={{
            padding: '3px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
            background: `${color}15`, color,
          }}>
            {level}
          </span>
        </div>

        {/* Incident counts */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {driver.harshBraking > 0 && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 9999, background: '#CC000015', color: '#CC0000', fontWeight: 600 }}>
              HB {driver.harshBraking}
            </span>
          )}
          {driver.overspeeding > 0 && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 9999, background: '#9333ea15', color: '#9333ea', fontWeight: 600 }}>
              OS {driver.overspeeding}
            </span>
          )}
          {driver.panic > 0 && (
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 9999, background: '#CC000020', color: '#CC0000', fontWeight: 700 }}>
              🚨 {driver.panic}
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cd-text-muted)', minWidth: 24, textAlign: 'right' }}>
            {driver.total}
          </span>
        </div>

        {expanded ? <ChevronUp size={16} color="var(--cd-text-muted)" /> : <ChevronDown size={16} color="var(--cd-text-muted)" />}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--cd-border)', background: 'var(--cd-surface-2)' }}>
          {/* FMCSA warning */}
          {driver.harshBraking >= 8 && (
            <div style={{
              margin: '12px 20px', padding: '10px 14px', borderRadius: 8,
              background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.2)',
              fontSize: 12, color: '#CC0000',
            }}>
              ⚠ FMCSA BASIC Category 1 threshold exceeded ({driver.harshBraking} harsh braking events). Formal intervention required per FRSC guidelines.
            </div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, padding: '12px 20px' }}>
            {[
              { label: 'Harsh Brake', value: driver.harshBraking, color: '#CC0000' },
              { label: 'Harsh Accel.', value: driver.harshAccel, color: '#0078D4' },
              { label: 'Overspeeding', value: driver.overspeeding, color: '#9333ea' },
              { label: 'Cornering', value: driver.cornering, color: '#d97706' },
              { label: 'Panic', value: driver.panic, color: '#CC0000' },
              { label: 'Total', value: driver.total, color: 'var(--cd-text)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--cd-surface)', borderRadius: 8, border: '1px solid var(--cd-border)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--cd-font-display)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent events */}
          {recentEvents.length > 0 && (
            <div style={{ padding: '0 20px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Recent Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentEvents.map((e, i) => {
                  const label = e.type === 'panic' ? 'Panic' : e.label || 'Unknown';
                  const c = label === 'Panic' ? '#CC0000' : label === 'Harsh Braking' ? '#CC0000' : 'var(--cd-text-muted)';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: c, fontWeight: 600 }}>{label}</span>
                      <span style={{ color: 'var(--cd-text-muted)' }}>{e.address || '—'}</span>
                      <span style={{ color: 'var(--cd-text-muted)' }}>
                        {e.eventTime ? new Date(e.eventTime).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type DriverTab = 'drivers' | 'coaching' | 'training' | 'certifications';

export default function DriverManagement({ tab = 'drivers' }: { tab?: DriverTab }) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const { events } = useFleet();

  // Auto-expand the driver that matches a ?q= deep-link from SafeIQ
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    setSearch(q);
    setExpandedDrivers(new Set([q]));
    setDateRange('alltime');
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter(e => {
      const ts = new Date(e.eventTime || e.timestamp).getTime();
      if (dateRange === 'today') { const s = new Date(); s.setHours(0,0,0,0); return ts >= s.getTime(); }
      if (dateRange === '7days') return ts >= now - 7 * 24 * 60 * 60 * 1000;
      if (dateRange === '30days') return ts >= now - 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [events, dateRange]);

  const drivers: DriverProfile[] = useMemo(() => {
    const map = new Map<string, DriverProfile>();
    filtered.forEach(e => {
      const label = e.type === 'panic' ? 'Panic' : (e.label || '');
      if (HIDDEN_LABELS.includes(label)) return;
      if (!isKnownDriver(e.driverName)) return;
      const key = e.driverName!;
      if (!map.has(key)) {
        map.set(key, {
          name: key, phone: e.driverPhone || 'N/A',
          assetName: e.assetName || 'N/A', regNo: e.regNo || 'N/A',
          transporter: e.transporter || 'N/A',
          harshBraking: 0, harshAccel: 0, overspeeding: 0, cornering: 0, panic: 0, total: 0,
          score: 100, trend: 'stable', events: [],
        });
      }
      const d = map.get(key)!;
      d.events.push(e);
      if (e.type === 'panic') { d.panic++; }
      else if (label === 'Harsh Braking') { d.harshBraking++; d.total++; }
      else if (label === 'Harsh Acceleration') { d.harshAccel++; d.total++; }
      else if (label === 'Overspeeding' || label === 'Overspeed Tiered') { d.overspeeding++; d.total++; }
      else if (label === 'Harsh Cornering') { d.cornering++; d.total++; }
      if (e.assetName && e.assetName !== 'N/A') d.assetName = e.assetName;
      if (e.regNo && e.regNo !== 'N/A') d.regNo = e.regNo;
      if (e.transporter && e.transporter !== 'N/A') d.transporter = e.transporter;
      if (e.driverPhone && e.driverPhone !== 'N/A') d.phone = e.driverPhone;
    });

    return Array.from(map.values())
      .map(d => ({
        ...d,
        score: computeScore(d),
        trend: d.total > 5 ? 'down' : d.total < 2 ? 'up' : 'stable',
      } as DriverProfile))
      .sort((a, b) => a.score - b.score);
  }, [filtered]);

  const visible = search
    ? drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.regNo.toLowerCase().includes(search.toLowerCase()))
    : drivers;

  const toggle = (name: string) => setExpandedDrivers(prev => {
    const n = new Set(prev);
    n.has(name) ? n.delete(name) : n.add(name);
    return n;
  });

  const highRisk = drivers.filter(d => d.score < 60).length;
  const needsAction = drivers.filter(d => d.harshBraking >= 8 || d.panic > 0).length;

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Driver Management</h1>
        <p className="bpl-page-subtitle">Safety scores, incident history, and coaching records</p>
      </div>

      {/* KPIs */}
      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="bpl-kpi-card">
          <div className="bpl-kpi-label">Total Drivers</div>
          <div className="bpl-kpi-value">{drivers.length}</div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #CC0000' }}>
          <div className="bpl-kpi-label">High Risk</div>
          <div className="bpl-kpi-value" style={{ color: '#CC0000' }}>{highRisk}</div>
          <div className="bpl-kpi-sub">Score below 60</div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="bpl-kpi-label">Needs Action</div>
          <div className="bpl-kpi-value" style={{ color: '#d97706' }}>{needsAction}</div>
          <div className="bpl-kpi-sub">FMCSA threshold or panic</div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="bpl-kpi-label">Low Risk</div>
          <div className="bpl-kpi-value" style={{ color: '#16a34a' }}>{drivers.filter(d => d.score >= 80).length}</div>
          <div className="bpl-kpi-sub">Score 80+</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cd-text-muted)' }} />
          <input
            type="text"
            placeholder="Search driver or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 13,
              background: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none',
            }}
          />
        </div>
        {(['today', '7days', '30days', 'alltime'] as DateRange[]).map(r => (
          <button key={r}
            onClick={() => setDateRange(r)}
            style={{
              padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              border: '1px solid',
              borderColor: dateRange === r ? 'var(--bpl-blue)' : 'var(--cd-border)',
              background: dateRange === r ? 'var(--bpl-blue-soft)' : 'var(--cd-surface)',
              color: dateRange === r ? 'var(--bpl-blue)' : 'var(--cd-text-muted)',
            }}
          >
            {r === 'today' ? 'Today' : r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : 'All Time'}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>{visible.length} drivers</span>
      </div>

      {/* Tab-based content */}
      {tab === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cd-text-muted)' }}>
              No driver data available
            </div>
          ) : visible.map(d => (
            <DriverCard
              key={d.name}
              driver={d}
              expanded={expandedDrivers.has(d.name)}
              onToggle={() => toggle(d.name)}
            />
          ))}
        </div>
      )}

      {(tab === 'coaching' || tab === 'training' || tab === 'certifications') && (
        <div className="bpl-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 8, fontFamily: 'var(--cd-font-display)' }}>
            {tab === 'coaching' ? 'Coaching History' : tab === 'training' ? 'Training Records' : 'Certifications'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginBottom: 12 }}>
            {tab === 'coaching'
              ? 'Log coaching sessions, track assigned actions, and monitor driver improvement over time.'
              : tab === 'training'
              ? 'Record completed training programmes, scheduled refreshers, and compliance requirements.'
              : 'Track driver licences, medical certificates, hazmat certifications, and renewal dates.'}
          </div>
          <span className="bpl-badge-coming-soon" style={{ fontSize: 11, padding: '4px 12px' }}>Coming Soon</span>
        </div>
      )}
    </div>
  );
}
