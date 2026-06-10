import type { EnvironmentContext } from '../hooks/useSafeIQ';

const TRAFFIC_COLORS = {
  light: '#16a34a',
  moderate: '#d97706',
  heavy: '#CC0000',
} as const;

export function formatEnvironmentLine(env: EnvironmentContext): string {
  const traffic = env.traffic_description || `${env.traffic_density.charAt(0).toUpperCase() + env.traffic_density.slice(1)} traffic`;
  const road = env.road_type.charAt(0).toUpperCase() + env.road_type.slice(1);
  return `${env.weather} · ${traffic} · ${road}`;
}

export default function EnvironmentBadge({ environment, compact }: { environment: EnvironmentContext; compact?: boolean }) {
  const trafficColor = TRAFFIC_COLORS[environment.traffic_density];

  if (compact) {
    return (
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 1.4 }}>
        {formatEnvironmentLine(environment)}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      <div style={{ padding: '10px 12px', background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', marginBottom: 4 }}>Weather</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text)' }}>{environment.weather}</div>
      </div>
      <div style={{ padding: '10px 12px', background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', marginBottom: 4 }}>Traffic</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: trafficColor }}>{environment.traffic_description || `${environment.traffic_density} traffic`}</div>
      </div>
      <div style={{ padding: '10px 12px', background: 'var(--cd-surface-2, #f8fafc)', border: '1px solid var(--cd-border)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', marginBottom: 4 }}>Road Type</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text)', textTransform: 'capitalize' }}>{environment.road_type}</div>
      </div>
    </div>
  );
}
