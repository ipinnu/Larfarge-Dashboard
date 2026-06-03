import { X, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
}

const weekLabel = 'Apr 28 – May 4, 2025';
const fleetScore = { current: 73, previous: 68, delta: 5 };
const totalIncidents = { current: 47, previous: 61 };
const incidentBreakdown = [
  { name: 'Harsh Braking', count: 18, prev: 24 },
  { name: 'Overspeeding', count: 14, prev: 19 },
  { name: 'Harsh Accel.', count: 9, prev: 11 },
  { name: 'Excess Idling', count: 6, prev: 7 },
];
const topDrivers = [
  { name: 'Kelechi Nwosu', score: 94, vehicle: 'JMG-0033', trend: 'up' },
  { name: 'Amaka Eze', score: 91, vehicle: 'JMG-0081', trend: 'stable' },
  { name: 'Tunde Fashola', score: 89, vehicle: 'JMG-0055', trend: 'up' },
  { name: 'Grace Okonkwo', score: 87, vehicle: 'JMG-0024', trend: 'stable' },
  { name: 'Chidi Obioma', score: 86, vehicle: 'JMG-0067', trend: 'up' },
];
const bottomDrivers = [
  { name: 'Emmanuel Adeyemi', score: 43, vehicle: 'JMG-0042', trend: 'down', flag: true },
  { name: 'Rotimi Balogun', score: 51, vehicle: 'JMG-0019', trend: 'down', flag: true },
  { name: 'Sunday Obi', score: 58, vehicle: 'JMG-0073', trend: 'down', flag: false },
  { name: 'Blessing Okafor', score: 65, vehicle: 'JMG-0017', trend: 'stable', flag: false },
  { name: 'Peter Adamu', score: 67, vehicle: 'JMG-0051', trend: 'stable', flag: false },
];
const mostImproved = {
  name: 'Kelechi Nwosu',
  vehicle: 'JMG-0033',
  improvement: '+18 pts',
  note: 'Consistent compliance across all FMCSA BASIC categories. Zero harsh events recorded this week.',
};
const narrative = `Fleet safety performance improved meaningfully this week, with the aggregate safety score rising 5 points to 73/100 and total incidents declining 23% from 61 to 47. This trajectory is encouraging but remains below the target threshold of 80 — sustained focus on the bottom-performing drivers is essential to close this gap.\n\nThe most significant concern falls under FMCSA BASIC Category 1 (Unsafe Driving): harsh braking events, though declining 25%, remain the largest incident category at 18 occurrences. Industry data indicates that drivers with elevated harsh braking rates are 3.4× more likely to be involved in rear-end collisions. Emmanuel Adeyemi and Rotimi Balogun have both crossed the 8-incident intervention threshold and require formal review before the next reporting period.\n\nPositively, Kelechi Nwosu's 18-point improvement demonstrates that structured coaching produces measurable results within a single week. Fleet-wide, harsh acceleration declined 18% and overspeeding dropped 26%, suggesting the speed awareness communications issued two weeks ago are taking effect. Operations should reinforce this momentum with a brief all-driver reminder on Monday.`;
const actions = [
  'Schedule defensive driving refresher for Emmanuel Adeyemi and Rotimi Balogun — both above the 8-incident intervention threshold',
  'Send fleet-wide speed compliance reminder via WhatsApp broadcast by Monday EOD',
  'Review Apapa port gate scheduling to reduce engine-on idle time in queues',
  'Recognise Kelechi Nwosu at next driver briefing — positive reinforcement drives measurable improvement',
  'Schedule brake inspection for JMG-0042 (Adeyemi) — maintenance overdue since December 2024',
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={13} style={{ color: '#16a34a' }} />;
  if (trend === 'down') return <TrendingDown size={13} style={{ color: '#dc2626' }} />;
  return <Minus size={13} style={{ color: '#d97706' }} />;
}

function scoreColor(score: number) {
  if (score >= 80) return '#16a34a';
  if (score >= 65) return '#d97706';
  return '#dc2626';
}

function DriverRow({ d, isBottom }: { d: typeof topDrivers[0] & { flag?: boolean }; isBottom?: boolean }) {
  const color = scoreColor(d.score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--cd-border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cd-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
          {isBottom && (d as any).flag && (
            <span style={{ fontSize: '9px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '1px 5px', fontWeight: '700', flexShrink: 0 }}>FLAG</span>
          )}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--cd-text-muted)' }}>{d.vehicle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div style={{ width: '50px', height: '5px', background: 'var(--cd-border)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${d.score}%`, background: color, borderRadius: '99px' }} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: '700', color, minWidth: '28px', textAlign: 'right' }}>{d.score}</span>
        <TrendIcon trend={d.trend} />
      </div>
    </div>
  );
}

export default function WeeklySafetyReport({ open, onClose }: Props) {
  if (!open) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '65%',
    minWidth: '680px',
    zIndex: 1001,
    backgroundColor: 'var(--cd-surface)',
    borderLeft: '1px solid var(--cd-border)',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const mobilePanelStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1001,
    backgroundColor: 'var(--cd-surface)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }} />
      <div style={isMobileView ? mobilePanelStyle : panelStyle}>

        {/* Panel header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} style={{ color: 'var(--cd-accent)' }} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cd-text)' }}>SafeIQ Weekly Safety Report</span>
            <span style={{ fontSize: '11px', background: 'var(--cd-surface-2, #f1f5f9)', border: '1px solid var(--cd-border)', borderRadius: '9999px', padding: '3px 10px', color: 'var(--cd-text-muted)', fontWeight: '600' }}>
              {weekLabel}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cd-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section 1 — Fleet Summary */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Fleet Safety Score</div>
              <div style={{ fontSize: '42px', fontWeight: '700', color: scoreColor(fleetScore.current), lineHeight: 1, marginBottom: '8px' }}>{fleetScore.current}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                <TrendingUp size={14} />
                +{fleetScore.delta} vs last week
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Total Incidents</div>
              <div style={{ fontSize: '42px', fontWeight: '700', color: 'var(--cd-text)', lineHeight: 1, marginBottom: '8px' }}>{totalIncidents.current}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                <TrendingDown size={14} />
                −{totalIncidents.previous - totalIncidents.current} from last week
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Reporting Period</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cd-text)', lineHeight: 1.3, marginBottom: '8px' }}>Apr 28 – May 4</div>
              <div style={{ fontSize: '12px', color: 'var(--cd-text-muted)' }}>2025</div>
            </div>
          </div>

          {/* Section 2 — Incident Breakdown */}
          <div style={{ background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cd-text)', marginBottom: '14px' }}>Incident Breakdown</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={incidentBreakdown} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cd-border, #e2e8f0)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--cd-text-muted, #94a3b8)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--cd-text-muted, #94a3b8)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--cd-surface)', border: '1px solid var(--cd-border)', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(240,80,34,0.06)' }}
                />
                <Bar dataKey="count" fill="var(--cd-accent, #F05022)" radius={[4, 4, 0, 0]} name="This Week" />
                <Bar dataKey="prev" fill="var(--cd-border, #e2e8f0)" radius={[4, 4, 0, 0]} name="Last Week" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Section 3 — Driver Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', marginBottom: '12px' }}>Top 5 Drivers</div>
              {topDrivers.map(d => <DriverRow key={d.name} d={d} />)}
            </div>
            <div style={{ background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', marginBottom: '12px' }}>Bottom 5 Drivers</div>
              {bottomDrivers.map(d => <DriverRow key={d.name} d={d} isBottom />)}
            </div>
          </div>

          {/* Section 4 — Most Improved */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most Improved This Week</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--cd-text)' }}>{mostImproved.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--cd-text-muted)' }}>{mostImproved.vehicle}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '9999px', padding: '2px 10px' }}>{mostImproved.improvement}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>{mostImproved.note}</div>
          </div>

          {/* Section 5 — AI Safety Narrative */}
          <div style={{ background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Shield size={16} style={{ color: 'var(--cd-accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cd-text)' }}>SafeIQ Analysis</span>
              <span style={{ fontSize: '10px', background: '#fef0eb', color: 'var(--cd-accent)', border: '1px solid #fdc8b0', borderRadius: '9999px', padding: '2px 8px', fontWeight: '700', letterSpacing: '0.04em' }}>AI GENERATED</span>
            </div>
            {narrative.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--cd-text-muted)', marginBottom: i < narrative.split('\n\n').length - 1 ? '12px' : '0', marginTop: 0 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Section 6 — Recommended Actions */}
          <div style={{ background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cd-text)', marginBottom: '14px' }}>Recommended Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#fef2f2' : i === 1 ? '#fffbeb' : i === 2 ? '#f0fdf4' : i === 3 ? '#f0fdf4' : '#fffbeb',
                    color: i === 0 ? '#dc2626' : i === 1 ? '#d97706' : i === 2 ? '#16a34a' : i === 3 ? '#16a34a' : '#d97706',
                    border: `1px solid ${i === 0 ? '#fecaca' : i === 1 ? '#fef08a' : i === 2 ? '#bbf7d0' : i === 3 ? '#bbf7d0' : '#fef08a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--cd-text)', lineHeight: '1.6', flex: 1 }}>{action}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
