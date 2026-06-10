import { useState, useMemo } from 'react';
import { Plus, Download, TrendingUp, TrendingDown, Minus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFleet } from '../context/FleetContext';

type Tab = 'weekly' | 'monthly' | 'quarterly' | 'actions' | 'documents';

interface Action {
  id: string;
  goal: string;
  owner: string;
  status: 'pending' | 'in_progress' | 'complete';
  dueDate: string;
  category: string;
  createdAt: string;
}

const STATUS_COLORS = { pending: '#d97706', in_progress: '#0078D4', complete: '#16a34a' };
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', complete: 'Complete' };

function useActions() {
  const [actions, setActions] = useState<Action[]>(() => {
    try { return JSON.parse(localStorage.getItem('bpl_actions') || '[]'); } catch { return []; }
  });

  const add = (a: Action) => setActions(prev => {
    const n = [...prev, a];
    localStorage.setItem('bpl_actions', JSON.stringify(n));
    return n;
  });

  const update = (id: string, u: Partial<Action>) => setActions(prev => {
    const n = prev.map(a => a.id === id ? { ...a, ...u } : a);
    localStorage.setItem('bpl_actions', JSON.stringify(n));
    return n;
  });

  return { actions, add, update };
}

function WeeklyReport({ events }: { events: any[] }) {
  const { fleetSafetyScore, fleetScoreDelta } = useFleet();

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const thisWeek = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= sevenDaysAgo);
  const lastWeek = events.filter(e => {
    const t = new Date(e.eventTime || e.timestamp).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  const counts = (evts: any[]) => ({
    harsh_braking: evts.filter(e => e.label === 'Harsh Braking').length,
    overspeeding: evts.filter(e => e.label?.includes('Overspeed')).length,
    harsh_accel: evts.filter(e => e.label === 'Harsh Acceleration').length,
    panic: evts.filter(e => e.type === 'panic').length,
    total: evts.filter(e => !['Possible Power Tamper', 'Battery Disconnection', 'Battery Disconnected'].includes(e.label || '')).length,
  });

  const tw = counts(thisWeek);
  const lw = counts(lastWeek);

  const delta = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

  const chartData = [
    { name: 'Harsh Braking', 'This Week': tw.harsh_braking, 'Last Week': lw.harsh_braking },
    { name: 'Overspeeding', 'This Week': tw.overspeeding, 'Last Week': lw.overspeeding },
    { name: 'Harsh Accel.', 'This Week': tw.harsh_accel, 'Last Week': lw.harsh_accel },
    { name: 'Panic', 'This Week': tw.panic, 'Last Week': lw.panic },
  ];

  const pctChange = delta(tw.total, lw.total);

  return (
    <div>
      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="bpl-kpi-card">
          <div className="bpl-kpi-label">Fleet Safety Score</div>
          <div className="bpl-kpi-value" style={{ color: fleetSafetyScore >= 80 ? '#16a34a' : fleetSafetyScore >= 60 ? '#d97706' : fleetSafetyScore >= 45 ? '#e05c2a' : '#CC0000' }}>
            {fleetSafetyScore}
          </div>
          <div className="bpl-kpi-sub">
            {fleetScoreDelta > 0 ? <span className="bpl-kpi-delta-up">↑ +{fleetScoreDelta} pts</span> :
             fleetScoreDelta < 0 ? <span className="bpl-kpi-delta-down">↓ {fleetScoreDelta} pts</span> :
             <span>No change</span>} vs 30-day avg
          </div>
        </div>
        <div className="bpl-kpi-card">
          <div className="bpl-kpi-label">Total Incidents</div>
          <div className="bpl-kpi-value">{tw.total}</div>
          <div className="bpl-kpi-sub">
            {pctChange < 0 ? <span className="bpl-kpi-delta-up">↓ {Math.abs(pctChange)}% vs last week</span> :
             pctChange > 0 ? <span className="bpl-kpi-delta-down">↑ +{pctChange}% vs last week</span> :
             <span>Same as last week</span>}
          </div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #CC0000' }}>
          <div className="bpl-kpi-label">Harsh Braking</div>
          <div className="bpl-kpi-value" style={{ color: '#CC0000' }}>{tw.harsh_braking}</div>
          <div className="bpl-kpi-sub" style={{ color: lw.harsh_braking < tw.harsh_braking ? '#CC0000' : '#16a34a' }}>
            vs {lw.harsh_braking} last week
          </div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #CC0000' }}>
          <div className="bpl-kpi-label">Panic Alerts</div>
          <div className="bpl-kpi-value" style={{ color: tw.panic > 0 ? '#CC0000' : '#16a34a' }}>{tw.panic}</div>
          <div className="bpl-kpi-sub">vs {lw.panic} last week</div>
        </div>
      </div>

      <div className="bpl-card" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 16, fontFamily: 'var(--cd-font-display)' }}>
          Week-over-Week Comparison
        </div>
        {tw.total === 0 && lw.total === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cd-text-muted)' }}>No incident data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cd-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--cd-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--cd-text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--cd-surface)', border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="This Week" fill="#CC0000" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Last Week" fill="var(--cd-border)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 12, fontFamily: 'var(--cd-font-display)' }}>
          Weekly Safety Summary
        </div>
        <div style={{ fontSize: 14, color: 'var(--cd-text)', lineHeight: 1.7 }}>
          {tw.total === 0
            ? 'No incident data available for this period. Connect the MiX Telematics API to populate real fleet data.'
            : `Fleet recorded ${tw.total} safety events this week${lw.total > 0 ? `, compared to ${lw.total} last week (${pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`})` : ''}. ${tw.harsh_braking > 0 ? `Harsh braking remains the leading incident category at ${tw.harsh_braking} events` : 'No harsh braking events recorded'}. ${tw.panic > 0 ? `${tw.panic} panic alert${tw.panic > 1 ? 's' : ''} logged — requires immediate supervisor review.` : 'No panic alerts this week.'} ${fleetSafetyScore >= 80 ? 'Fleet safety score is within acceptable range.' : fleetSafetyScore >= 60 ? 'Fleet safety score needs attention — focus coaching on high-incident drivers.' : 'Fleet safety score is below threshold — escalate to management immediately.'}`}
        </div>
      </div>
    </div>
  );
}

function ActionTracking({ actions, onAdd, onUpdate }: {
  actions: Action[];
  onAdd: (a: Action) => void;
  onUpdate: (id: string, u: Partial<Action>) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ goal: '', owner: '', dueDate: '', category: 'Safety', status: 'pending' as Action['status'] });

  const save = () => {
    if (!form.goal || !form.owner) return;
    onAdd({
      id: `action-${Date.now()}`,
      ...form,
      createdAt: new Date().toISOString(),
    });
    setForm({ goal: '', owner: '', dueDate: '', category: 'Safety', status: 'pending' });
    setShowNew(false);
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '1px solid var(--cd-border)', borderRadius: 7, fontSize: 13,
    background: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--cd-text-muted)' }}>
            ISO 39001 continuous improvement evidence — track goals and accountability
          </div>
        </div>
        <button className="bpl-btn-primary" onClick={() => setShowNew(s => !s)}>
          <Plus size={14} /> Add Action
        </button>
      </div>

      {showNew && (
        <div className="bpl-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', display: 'block', marginBottom: 4 }}>Goal</label>
              <input style={fieldStyle} placeholder="Safety improvement goal..." value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', display: 'block', marginBottom: 4 }}>Owner</label>
              <input style={fieldStyle} placeholder="Responsible person/team" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', display: 'block', marginBottom: 4 }}>Due Date</label>
              <input style={fieldStyle} type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <button className="bpl-btn-primary" onClick={save}>Save</button>
              <button className="bpl-btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bpl-card" style={{ overflow: 'hidden' }}>
        {actions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>
            No action items yet. Add your first ISO 39001 improvement goal above.
          </div>
        ) : (
          <table className="bpl-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>Owner</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.goal}</td>
                  <td style={{ color: 'var(--cd-text-muted)' }}>{a.owner}</td>
                  <td style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td>
                    <select
                      value={a.status}
                      onChange={e => onUpdate(a.id, { status: e.target.value as Action['status'] })}
                      style={{
                        padding: '4px 8px', border: `1px solid ${STATUS_COLORS[a.status]}40`,
                        borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: `${STATUS_COLORS[a.status]}10`, color: STATUS_COLORS[a.status],
                        cursor: 'pointer', outline: 'none',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="complete">Complete</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="bpl-coming-soon-section">
      <div className="bpl-coming-soon-label">Coming Soon</div>
      <div className="bpl-coming-soon-title">{title}</div>
      <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginTop: 8 }}>
        This report type will aggregate automatically from live fleet data.
      </div>
    </div>
  );
}

export default function ReportsReviews({ tab }: { tab: Tab }) {
  const { events } = useFleet();
  const { actions, add, update } = useActions();

  const pending = actions.filter(a => a.status === 'pending').length;
  const inProgress = actions.filter(a => a.status === 'in_progress').length;
  const complete = actions.filter(a => a.status === 'complete').length;

  const TAB_TITLES: Record<Tab, string> = {
    weekly: 'Weekly Report',
    monthly: 'Monthly Report',
    quarterly: 'Quarterly Review',
    actions: 'Action Tracking',
    documents: 'Documents',
  };

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Reports & Reviews — {TAB_TITLES[tab]}</h1>
        <p className="bpl-page-subtitle">Measure improvement, create accountability, and generate ISO 39001 evidence</p>
      </div>

      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #d97706' }}>
          <div className="bpl-kpi-label">Pending Actions</div>
          <div className="bpl-kpi-value" style={{ color: '#d97706' }}>{pending}</div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #0078D4' }}>
          <div className="bpl-kpi-label">In Progress</div>
          <div className="bpl-kpi-value" style={{ color: '#0078D4' }}>{inProgress}</div>
        </div>
        <div className="bpl-kpi-card" style={{ borderTop: '3px solid #16a34a' }}>
          <div className="bpl-kpi-label">Complete</div>
          <div className="bpl-kpi-value" style={{ color: '#16a34a' }}>{complete}</div>
        </div>
      </div>

      {tab === 'weekly' && <WeeklyReport events={events} />}
      {tab === 'monthly' && <ComingSoon title="Monthly Safety Report" />}
      {tab === 'quarterly' && <ComingSoon title="Quarterly Performance Review" />}
      {tab === 'actions' && <ActionTracking actions={actions} onAdd={add} onUpdate={update} />}
      {tab === 'documents' && (
        <div className="bpl-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 8 }}>Document Repository</div>
          <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginBottom: 20 }}>
            Upload and manage fleet safety documents, driver certificates, vehicle inspection reports, and compliance evidence.
          </div>
          <span className="bpl-badge-coming-soon" style={{ fontSize: 11, padding: '4px 12px' }}>Coming Soon</span>
        </div>
      )}
    </div>
  );
}
