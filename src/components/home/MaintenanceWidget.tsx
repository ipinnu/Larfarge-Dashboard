import { Link } from 'react-router-dom';
import AssetThumbnail from '../AssetThumbnail';
import { useFleet } from '../../context/FleetContext';

export default function MaintenanceWidget() {
  const { maintenance } = useFleet();

  return (
    <div className="bpl-card bpl-home-panel-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Maintenance Overview</span>
        <Link to="/maintenance" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-card-body">
        {maintenance.map(m => (
          <Link key={m.vehicle + m.service} to="/maintenance" className="bpl-maint-row bpl-widget-row-link">
            <AssetThumbnail assetName={m.assetName} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{m.vehicle}</div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>{m.assetName}</div>
              <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginTop: 2 }}>{m.service}</div>
            </div>
            <span className={`bpl-urgency-${m.urgency}`}>{m.due}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
