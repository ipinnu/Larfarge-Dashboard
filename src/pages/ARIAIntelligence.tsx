import { Brain, AlertTriangle, TrendingDown, BookOpen, Zap, CheckCircle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { isKnownDriver, displayDriverName } from '../lib/driverUtils';

const HIDDEN_LABELS = ['Possible Power Tamper', 'Battery Disconnection', 'Battery Disconnected', 'Front Panel Tamper', 'Back Panel Tamper', 'No Blue Key'];

const FMCSA_BASICS = [
  { code: 'B1', name: 'Unsafe Driving', desc: 'Speeding, harsh braking, reckless driving, improper lane changes' },
  { code: 'B2', name: 'Crash Indicator', desc: 'Historical crash patterns and near-miss frequency' },
  { code: 'B3', name: 'Hours-of-Service', desc: 'Driving time limits and rest period compliance' },
  { code: 'B4', name: 'Vehicle Maintenance', desc: 'Overdue maintenance, defects, inspection failures' },
];

function IncidentAnalysisCard({ event, index }: { event: any; index: number }) {
  const label = event.label || 'Unknown';
  const severity = event.label === 'Harsh Braking' ? 'RED' :
    event.label?.includes('Overspeed') ? 'YELLOW' : 'YELLOW';

  const basicCategory = label === 'Harsh Braking' ? 'B1 — Unsafe Driving' :
    label.includes('Overspeed') ? 'B1 — Unsafe Driving' :
    label === 'Harsh Acceleration' ? 'B1 — Unsafe Driving' : 'B1 — Unsafe Driving';

  const coaching = label === 'Harsh Braking'
    ? 'Schedule defensive driving refresher. Emphasise 4-second wet-road following rule. Review brake system if maintenance overdue.'
    : label.includes('Overspeed')
    ? 'Document event. Conduct pre-shift speed limit awareness briefing. Second event within 14 days triggers formal review.'
    : label === 'Harsh Acceleration'
    ? 'Review smooth acceleration technique. Check if schedule pressure is causing aggressive driving behaviour.'
    : 'Log event, conduct driver interview within 24 hours. Assess contributing factors before next assignment.';

  return (
    <div className="bpl-card" style={{ borderLeft: `4px solid ${severity === 'RED' ? '#CC0000' : '#d97706'}` }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={severity === 'RED' ? 'bpl-badge-red' : 'bpl-badge-yellow'}>
                {severity}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>
              {displayDriverName(event.driverName)} · {event.regNo || event.assetId} · {event.transporter || '—'}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', textAlign: 'right', flexShrink: 0 }}>
            <div>{event.eventTime ? new Date(event.eventTime).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
            <div style={{ marginTop: 2 }}>{event.address || '—'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding: '10px 12px', background: 'var(--cd-surface-2)', borderRadius: 8, border: '1px solid var(--cd-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cd-text-muted)', marginBottom: 4 }}>
              FMCSA Reference
            </div>
            <div style={{ fontSize: 12, color: 'var(--bpl-blue)', fontWeight: 600 }}>{basicCategory}</div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--cd-surface-2)', borderRadius: 8, border: '1px solid var(--cd-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cd-text-muted)', marginBottom: 4 }}>
              FRSC Guideline
            </div>
            <div style={{ fontSize: 12, color: 'var(--cd-text)', fontWeight: 500 }}>
              {label.includes('Overspeed') ? 'Highway Code §14 — Speed limit compliance' : 'RTSSS §7 — Driver behaviour standards'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,120,212,0.05)', borderRadius: 8, border: '1px solid rgba(0,120,212,0.15)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--bpl-blue)', marginBottom: 4 }}>
            Coaching Recommendation
          </div>
          <div style={{ fontSize: 12, color: 'var(--cd-text)', lineHeight: 1.5 }}>{coaching}</div>
        </div>
      </div>
    </div>
  );
}

function DriverRiskVisual({ events }: { events: any[] }) {
  const driverMap = new Map<string, { name: string; count: number }>();
  events.forEach(e => {
    if (e.type === 'panic') return;
    const key = isKnownDriver(e.driverName) ? e.driverName! : null;
    if (!key || HIDDEN_LABELS.includes(e.label || '')) return;
    if (!driverMap.has(key)) driverMap.set(key, { name: key, count: 0 });
    driverMap.get(key)!.count++;
  });

  const drivers = Array.from(driverMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  const max = Math.max(...drivers.map(d => d.count), 1);

  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Driver Risk Visualisation</span>
        <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>Last 30 days</span>
      </div>
      <div className="bpl-card-body">
        {drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--cd-text-muted)', fontSize: 13 }}>
            No driver data available
          </div>
        ) : drivers.map(d => {
          const risk = d.count;
          const pct = (risk / max) * 100;
          const color = pct > 60 ? '#CC0000' : pct > 30 ? '#d97706' : '#16a34a';
          return (
            <div key={d.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--cd-text)' }}>{d.name}</span>
                <span style={{ color, fontWeight: 700 }}>{d.count} events</span>
              </div>
              <div style={{ height: 8, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpsRecommendations({ events }: { events: any[] }) {
  const harshBrakingCount = events.filter(e => e.type !== 'panic' && e.label === 'Harsh Braking').length;
  const overspeedCount = events.filter(e => e.type !== 'panic' && e.label?.includes('Overspeed')).length;

  const recs = [];

  if (harshBrakingCount > 10) recs.push({
    priority: 'HIGH',
    text: `Fleet-wide harsh braking at ${harshBrakingCount} events this period — schedule mandatory defensive driving refresher for all active drivers within 7 days.`,
    standard: 'FMCSA BASIC B1',
    color: '#CC0000',
  });

  if (overspeedCount > 8) recs.push({
    priority: 'HIGH',
    text: `${overspeedCount} speeding events recorded — issue speed compliance reminder via WhatsApp broadcast before next shift cycle.`,
    standard: 'FRSC §14',
    color: '#CC0000',
  });

  if (recs.length === 0) recs.push({
    priority: 'LOW',
    text: 'No critical operational recommendations at this time. Continue routine safety monitoring and weekly coaching reviews.',
    standard: 'ISO 39001',
    color: '#16a34a',
  });

  return (
    <div className="bpl-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Operations Recommendations</span>
        <span className="bpl-badge-blue">BPL Analyst Generated</span>
      </div>
      <div>
        {recs.map((r, i) => (
          <div key={i} style={{
            padding: '14px 20px',
            borderBottom: i < recs.length - 1 ? '1px solid var(--cd-border)' : 'none',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: r.color, flexShrink: 0, marginTop: 4,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--cd-text)', lineHeight: 1.5, marginBottom: 4 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>
                Standard: <span style={{ color: 'var(--bpl-blue)', fontWeight: 600 }}>{r.standard}</span>
              </div>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
              background: `${r.color}15`, color: r.color, flexShrink: 0,
            }}>
              {r.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ARIATab = 'analysis' | 'root-cause' | 'risk-trends' | 'coaching' | 'environment' | 'standards';

export default function ARIAIntelligence({ tab = 'analysis' }: { tab?: ARIATab }) {
  const { events, fleetSafetyScore } = useFleet();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const recentEvents = events
    .filter(e => {
      if (e.type === 'panic') return false;
      const label = e.label || '';
      if (HIDDEN_LABELS.includes(label)) return false;
      return new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo;
    })
    .slice(0, 12);

  return (
    <div>
      <div className="bpl-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="bpl-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={22} color="var(--bpl-blue)" />
            BPL Analyst Intelligence — {{
              'analysis': 'Incident Analysis',
              'root-cause': 'Root Cause',
              'risk-trends': 'Driver Risk Trends',
              'coaching': 'Coaching Recommendations',
              'environment': 'Environmental Context',
              'standards': 'FMCSA / FRSC Mapping',
            }[tab]}
          </h1>
          <p className="bpl-page-subtitle">AI-generated analysis, root cause reports, and coaching recommendations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bpl-blue-soft)', borderRadius: 10, border: '1px solid rgba(0,120,212,0.2)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa', animation: 'aria-pulse 2s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bpl-blue)' }}>BPL Analyst Online</span>
        </div>
      </div>

      {/* FMCSA BASIC mapping */}
      <div className="bpl-card" style={{ marginBottom: 20 }}>
        <div className="bpl-card-header">
          <span className="bpl-card-title">FMCSA BASIC Category Mapping</span>
          <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>Federal Motor Carrier Safety Administration</span>
        </div>
        <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {FMCSA_BASICS.map(b => (
            <div key={b.code} style={{ padding: '12px', background: 'var(--cd-surface-2)', borderRadius: 8, border: '1px solid var(--cd-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bpl-blue)', letterSpacing: '0.06em', marginBottom: 4 }}>BASIC {b.code}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <DriverRiskVisual events={events} />
        <OpsRecommendations events={recentEvents} />
      </div>

      {/* Recent incident analyses */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 12 }}>
          Recent Incident Analyses
        </div>
        {recentEvents.length === 0 ? (
          <div className="bpl-card" style={{ padding: '40px', textAlign: 'center' }}>
            <Brain size={40} color="var(--cd-border)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 14, color: 'var(--cd-text-muted)' }}>No recent incidents to analyse</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentEvents.map((e, i) => (
              <IncidentAnalysisCard key={i} event={e} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Industry benchmarks */}
      <div className="bpl-card">
        <div className="bpl-card-header">
          <span className="bpl-card-title">Industry Safety Benchmarks</span>
          <span className="bpl-badge-blue">Reference</span>
        </div>
        <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { stat: '3.4×', desc: 'Higher rear-end collision risk for drivers with elevated harsh braking frequency' },
            { stat: '45%', desc: 'Reduction in unplanned downtime with predictive maintenance implementation' },
            { stat: '0.35G', desc: 'Harsh braking threshold in wet conditions that elevates loss-of-control risk significantly' },
            { stat: '3%', desc: 'Of Nigerian GDP lost annually to road traffic fatalities (WHO/UNECE)' },
          ].map(b => (
            <div key={b.stat} style={{ padding: '14px', background: 'var(--cd-surface-2)', borderRadius: 8, border: '1px solid var(--cd-border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--bpl-blue)', fontFamily: 'var(--cd-font-display)', flexShrink: 0 }}>{b.stat}</div>
              <div style={{ fontSize: 12, color: 'var(--cd-text)', lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
