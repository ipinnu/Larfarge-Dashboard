import { Link } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';

const SEV_COLOR = { critical: '#CC0000', warning: '#d97706', info: '#0078D4' };

export default function AlertsWidget() {
  const { alerts } = useFleet();

  return (
    <div className="bpl-card bpl-home-panel-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Recent Alerts</span>
        <Link to="/incidents" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-card-body bpl-home-panel-scroll">
        {alerts.length === 0 ? (
          <div style={{ padding: '12px 0', color: 'var(--cd-text-muted)', fontSize: 13 }}>No recent alerts</div>
        ) : alerts.map(a => (
          <Link key={a.id} to="/incidents" className="bpl-alert-item bpl-widget-row-link">
            <div className="bpl-alert-dot" style={{ background: SEV_COLOR[a.severity] }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text)' }}>{a.label}</div>
              <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginTop: 2 }}>
                {[
                  a.vehicle,
                  a.driver && a.driver !== 'Unassigned' && a.driver !== '—' ? a.driver : null,
                  a.time,
                ].filter(Boolean).join(' · ')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
