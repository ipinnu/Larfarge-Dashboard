import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export default function FleetSafetyScore() {
  const { safetyScore, safetyDelta, events, metadata } = useFleet();

  const color = safetyScore >= 80 ? '#16a34a' : safetyScore >= 60 ? '#d97706' : safetyScore >= 45 ? '#e05c2a' : '#CC0000';
  const label = safetyScore >= 80 ? 'Good Standing' : safetyScore >= 60 ? 'Needs Attention' : safetyScore >= 45 ? 'Below Average' : 'Poor Performance';

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);
  const totalIncidents = recent.length;
  const rate = metadata.totalVehicles > 0
    ? ((totalIncidents / metadata.totalVehicles) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bpl-card bpl-safety-score-card bpl-safety-score-card--home">
      <div className="bpl-safety-score-home-head">
        <span className="bpl-safety-score-label">Fleet Safety Score</span>
        <Link to="/safety" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-safety-score-home-body">
        <div className="bpl-safety-gauge bpl-safety-gauge-compact bpl-safety-gauge--home">
          <svg width="72" height="72" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--cd-border)" strokeWidth="5" />
            <circle
              cx="30" cy="30" r="24" fill="none"
              stroke={color} strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - safetyScore / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="bpl-safety-gauge-center">
            <span className="bpl-safety-gauge-score" style={{ color }}>{safetyScore}</span>
            <span className="bpl-safety-gauge-denom">/100</span>
          </div>
        </div>
        <div className="bpl-safety-score-home-meta">
          <div className="bpl-safety-score-home-status" style={{ color }}>{label}</div>
          <div className="bpl-safety-score-home-delta">
            {safetyDelta > 0 ? (
              <><TrendingUp size={13} color="#16a34a" /><span className="bpl-kpi-delta-up">+{safetyDelta} pts</span></>
            ) : safetyDelta < 0 ? (
              <><TrendingDown size={13} color="#CC0000" /><span className="bpl-kpi-delta-down">{safetyDelta} pts</span></>
            ) : (
              <><Minus size={13} color="var(--cd-text-muted)" /><span className="bpl-safety-score-home-nochange">No change</span></>
            )}
          </div>
          <div className="bpl-safety-score-home-stats">
            <span><strong>{totalIncidents}</strong> incidents</span>
            <span className="bpl-safety-score-home-dot" />
            <span><strong>{rate}</strong> /100 veh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
