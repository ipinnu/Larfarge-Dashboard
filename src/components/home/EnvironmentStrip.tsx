import { useFleet } from '../../context/FleetContext';

export function EnvironmentStrip() {
  const { environment } = useFleet();

  return (
    <div className="bpl-home-footer bpl-home-footer--duo">
      <div className="bpl-card">
        <div className="bpl-card-body" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text-muted)', marginBottom: 6 }}>Weather</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{environment.weather}</div>
          <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginTop: 4 }}>{environment.temp}</div>
        </div>
      </div>
      <div className="bpl-card">
        <div className="bpl-card-body" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cd-text-muted)', marginBottom: 6 }}>Traffic</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{environment.traffic}</div>
          <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginTop: 4 }}>Fleet corridor avg.</div>
        </div>
      </div>
    </div>
  );
}
