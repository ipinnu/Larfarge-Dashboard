import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, Minus, UserRound } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

function scoreColor(score: number) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  if (score >= 45) return '#e05c2a';
  return '#CC0000';
}

export default function DriverPerformanceWidget() {
  const { drivers } = useFleet();

  return (
    <div className="bpl-card bpl-home-panel-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Driver Performance</span>
        <Link to="/drivers" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-card-body bpl-home-panel-scroll">
        {drivers.length === 0 ? (
          <div style={{ color: 'var(--cd-text-muted)', fontSize: 13 }}>No driver data yet</div>
        ) : drivers.map(d => {
          const color = scoreColor(d.score);
          const detailParts = [
            `${d.incidents} incident${d.incidents === 1 ? '' : 's'} (30d)`,
            d.harshBraking > 0 ? `${d.harshBraking} brake` : null,
            d.overspeeding > 0 ? `${d.overspeeding} speed` : null,
            d.lastEvent ? `last ${d.lastEvent}` : null,
          ].filter(Boolean);

          return (
            <Link key={d.name} to="/drivers" className="bpl-driver-row bpl-widget-row-link">
              <div
                className="bpl-driver-avatar-img"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--cd-surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cd-text-muted)',
                  flexShrink: 0,
                }}
              >
                <UserRound size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text)' }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                  {detailParts.join(' · ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--cd-font-display)', color }}>
                  {d.score}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--cd-text-muted)' }}>score</span>
                  {d.trend === 'up' && <TrendingUp size={13} color="#16a34a" />}
                  {d.trend === 'down' && <TrendingDown size={13} color="#CC0000" />}
                  {d.trend === 'stable' && <Minus size={13} color="var(--cd-text-muted)" />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
