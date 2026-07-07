import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export default function DriverPerformanceWidget() {
  const { drivers } = useFleet();

  return (
    <div className="bpl-card bpl-home-panel-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Driver Performance</span>
        <Link to="/drivers" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-card-body">
        {drivers.length === 0 ? (
          <div style={{ color: 'var(--cd-text-muted)', fontSize: 13 }}>No driver data yet</div>
        ) : drivers.map(d => (
          <Link key={d.name} to="/drivers" className="bpl-driver-row bpl-widget-row-link">
            <div className="bpl-driver-avatar-img" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cd-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--cd-text-muted)' }}>
              {d.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>Safety score</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--cd-font-display)' }}>{d.score}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                {d.trend === 'up' && <TrendingUp size={14} color="#16a34a" />}
                {d.trend === 'down' && <TrendingDown size={14} color="#CC0000" />}
                {d.trend === 'stable' && <Minus size={14} color="var(--cd-text-muted)" />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
