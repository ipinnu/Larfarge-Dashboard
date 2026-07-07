import { useMemo, useState } from 'react';
import {
  Navigation, MapPin, Truck, Plus, Trash2, Clock, Route,
  ChevronRight, Coffee, Package,
} from 'lucide-react';
import FeatureGate from '../components/FeatureGate';
import { useFleet } from '../context/FleetContext';

interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone?: string;
}

interface DispatchJob {
  id: string;
  ref: string;
  material: string;
  pickup: Site;
  drops: Site[];
  vehicleReg?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  distanceKm?: number;
  etaMinutes?: number;
}

const DEMO_SITES: Site[] = [
  { id: 'north-quarry', name: 'North Quarry', lat: 6.892, lng: 3.214, zone: 'North' },
  { id: 'south-plant', name: 'South Plant', lat: 4.899, lng: 8.326, zone: 'South' },
  { id: 'east-terminal', name: 'East Terminal', lat: 6.448, lng: 3.359, zone: 'East' },
  { id: 'west-depot', name: 'West Depot', lat: 7.160, lng: 3.348, zone: 'West' },
  { id: 'central-hub', name: 'Central Hub', lat: 6.838, lng: 3.648, zone: 'Central' },
];

const MATERIALS = ['Cement', 'Clinker', 'Limestone', 'Aggregates'];

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid var(--cd-border)',
  background: 'var(--cd-surface)',
  color: 'var(--cd-text)',
  fontSize: 12,
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateRouteKm(pickup: Site, drops: Site[]) {
  let total = 0;
  let prev = pickup;
  for (const d of drops) {
    total += haversineKm(prev.lat, prev.lng, d.lat, d.lng);
    prev = d;
  }
  return Math.round(total);
}

function estimateEtaMinutes(km: number) {
  return Math.round((km / 45) * 60);
}

function statusStyle(status: DispatchJob['status']) {
  const map = {
    pending: { label: 'Pending', bg: '#fef3c7', color: '#b45309' },
    assigned: { label: 'Assigned', bg: '#dbeafe', color: '#2563eb' },
    in_transit: { label: 'In transit', bg: '#dcfce7', color: '#16a34a' },
    delivered: { label: 'Delivered', bg: '#f1f5f9', color: '#64748b' },
  };
  return map[status];
}

const DEMO_JOBS: DispatchJob[] = [
  {
    id: 'j1',
    ref: 'DSP-2401',
    material: 'Cement',
    pickup: DEMO_SITES[0],
    drops: [DEMO_SITES[2]],
    vehicleReg: 'FLT-0042',
    status: 'in_transit',
    distanceKm: 68,
    etaMinutes: 92,
  },
  {
    id: 'j2',
    ref: 'DSP-2402',
    material: 'Clinker',
    pickup: DEMO_SITES[1],
    drops: [DEMO_SITES[3]],
    status: 'pending',
    distanceKm: 124,
    etaMinutes: 165,
  },
];

export default function DispatchPage() {
  const { vehicles, metadata } = useFleet();
  const [jobs, setJobs] = useState<DispatchJob[]>(DEMO_JOBS);
  const [multiDrop, setMultiDrop] = useState(false);
  const [pickupId, setPickupId] = useState(DEMO_SITES[0].id);
  const [dropIds, setDropIds] = useState([DEMO_SITES[2].id]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(DEMO_JOBS[0].id);

  const pickup = DEMO_SITES.find(s => s.id === pickupId) ?? DEMO_SITES[0];
  const drops = dropIds.map(id => DEMO_SITES.find(d => d.id === id)).filter(Boolean) as Site[];
  const routeKm = estimateRouteKm(pickup, drops);
  const etaMin = estimateEtaMinutes(routeKm);
  const hosBreak = etaMin > 180;

  const deployable = useMemo(
    () => vehicles.filter(v => v.status !== 'Offline' && v.status !== 'Inactive'),
    [vehicles],
  );

  const nearest = useMemo(() => {
    if (!pickup) return [];
    return [...deployable]
      .map(v => {
        const lat = 6.5 + Math.random() * 0.5;
        const lng = 3.2 + Math.random() * 0.5;
        const km = haversineKm(pickup.lat, pickup.lng, lat, lng);
        return { vehicle: v, km, eta: estimateEtaMinutes(km) };
      })
      .sort((a, b) => a.km - b.km)
      .slice(0, 5);
  }, [deployable, pickup]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? nearest[0]?.vehicle ?? null;
  const selectedJob = jobs.find(j => j.id === selectedJobId) ?? jobs[0] ?? null;

  const createJob = () => {
    const ref = `DSP-${String(2400 + jobs.length + 1)}`;
    const job: DispatchJob = {
      id: `j${Date.now()}`,
      ref,
      material,
      pickup,
      drops: [...drops],
      status: selectedVehicle ? 'assigned' : 'pending',
      vehicleReg: selectedVehicle?.regNo,
      distanceKm: routeKm,
      etaMinutes: etaMin,
    };
    setJobs(prev => [job, ...prev]);
    setSelectedJobId(job.id);
  };

  return (
    <FeatureGate featureId="dispatch">
      <div className="bpl-page-header bpl-page-header-row">
        <div>
          <h1 className="bpl-page-title">
            <Navigation size={18} color="#0078D4" style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />
            Journey Dispatch
          </h1>
          <p className="bpl-page-subtitle">
            {DEMO_SITES.length} demo sites · assign deliveries and plan routes
          </p>
        </div>
      </div>

      <div className="bpl-kpi-grid">
        {[
          { label: 'Active jobs', value: jobs.filter(j => j.status !== 'delivered').length, sub: `${jobs.filter(j => j.status === 'in_transit').length} in transit`, color: '#0078D4' },
          { label: 'Available trucks', value: deployable.filter(v => v.status === 'Idle' || v.status === 'Parked').length, sub: `${deployable.length} deployable`, color: '#16a34a' },
          { label: 'Fleet moving', value: metadata.moving, sub: 'On road now', color: '#7C3AED' },
          { label: 'Pending dispatch', value: jobs.filter(j => j.status === 'pending').length, sub: 'Awaiting assignment', color: '#d97706' },
        ].map(k => (
          <div key={k.label} className="bpl-kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="bpl-kpi-label">{k.label}</div>
            <div className="bpl-kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="bpl-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="bpl-dispatch-layout">
        <div className="bpl-card bpl-dispatch-panel">
          <div className="bpl-dispatch-panel-title">Create dispatch job</div>

          <div className="bpl-dispatch-mode-row">
            {(['single', 'multi'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                className={`bpl-dispatch-mode-btn${(mode === 'multi') === multiDrop ? ' active' : ''}`}
                onClick={() => {
                  setMultiDrop(mode === 'multi');
                  if (mode === 'single') setDropIds([dropIds[0]]);
                }}
              >
                {mode === 'single' ? 'Single drop' : 'Multi-drop'}
              </button>
            ))}
          </div>

          <label className="bpl-field-label">Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value)} style={{ ...selectStyle, marginBottom: 10 }}>
            {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label className="bpl-field-label">Pickup</label>
          <select value={pickupId} onChange={e => setPickupId(e.target.value)} style={{ ...selectStyle, marginBottom: 10 }}>
            {DEMO_SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label className="bpl-field-label">Delivery stops</label>
          {dropIds.map((id, i) => (
            <div key={`${id}-${i}`} className="bpl-dispatch-drop-row">
              <span className="bpl-drop-num">{i + 1}.</span>
              <select
                value={id}
                onChange={e => setDropIds(prev => prev.map((d, j) => j === i ? e.target.value : d))}
                style={{ ...selectStyle, flex: 1 }}
              >
                {DEMO_SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {multiDrop && dropIds.length > 1 && (
                <button type="button" className="bpl-icon-plain" onClick={() => setDropIds(prev => prev.filter(d => d !== id))}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {multiDrop && dropIds.length < DEMO_SITES.length && (
            <button type="button" className="bpl-link-btn" onClick={() => {
              const next = DEMO_SITES.find(d => !dropIds.includes(d.id));
              if (next) setDropIds(prev => [...prev, next.id]);
            }}>
              <Plus size={13} /> Add stop
            </button>
          )}

          <div className="bpl-dispatch-route-box">
            <div><Route size={11} /> Est. distance <strong>{routeKm} km</strong></div>
            <div><Clock size={11} /> Est. drive <strong>{Math.floor(etaMin / 60)}h {etaMin % 60}m</strong></div>
          </div>

          {hosBreak && (
            <div className="bpl-dispatch-hos">
              <Coffee size={13} />
              HOS advisory: route exceeds 3h — plan a rest stop.
            </div>
          )}

          <div className="bpl-field-label">Assign vehicle</div>
          <div className="bpl-dispatch-vehicles">
            {nearest.map(({ vehicle: v, km }, i) => {
              const active = selectedVehicleId === v.id || (!selectedVehicleId && i === 0);
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`bpl-dispatch-vehicle-btn${active ? ' active' : ''}`}
                  onClick={() => setSelectedVehicleId(v.id)}
                >
                  <Truck size={13} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{v.regNo}</div>
                    <div style={{ fontSize: 10, color: 'var(--cd-text-muted)' }}>{v.status} · {km.toFixed(0)} km</div>
                  </div>
                  {i === 0 && <span className="bpl-nearest-tag">Nearest</span>}
                </button>
              );
            })}
          </div>

          <div className="bpl-dispatch-actions">
            <button type="button" className="bpl-btn-secondary bpl-btn-sm" onClick={() => nearest[0] && setSelectedVehicleId(nearest[0].vehicle.id)}>
              Pick nearest
            </button>
            <button type="button" className="bpl-btn-primary bpl-btn-sm" onClick={createJob}>
              Create job
            </button>
          </div>
        </div>

        <div className="bpl-card bpl-dispatch-map-card">
          <div className="bpl-dispatch-map-header">
            <span>{selectedJob ? `${selectedJob.ref} route` : 'Route preview'}</span>
            {selectedVehicle && <span>Assigned: <strong>{selectedVehicle.regNo}</strong></span>}
          </div>
          <div className="bpl-dispatch-map-placeholder">
            <div className="bpl-dispatch-map-route" />
            <MapPin size={20} style={{ opacity: 0.3 }} />
            <span>{pickup.name} → {drops.map(d => d.name).join(' → ')}</span>
            <span className="bpl-dispatch-map-hint">Map preview</span>
          </div>
        </div>
      </div>

      <div className="bpl-card bpl-dispatch-jobs">
        <div className="bpl-dispatch-jobs-header">
          <Package size={15} color="#0078D4" />
          <span>Active dispatches</span>
        </div>
        <table className="bpl-dispatch-table">
          <thead>
            <tr>
              {['Ref', 'Material', 'Pickup → Delivery', 'Vehicle', 'Distance', 'ETA', 'Status'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => {
              const st = statusStyle(job.status);
              const active = job.id === selectedJobId;
              return (
                <tr key={job.id} className={active ? 'active' : undefined} onClick={() => setSelectedJobId(job.id)}>
                  <td className="ref">{job.ref}</td>
                  <td>{job.material}</td>
                  <td className="route">
                    {job.pickup.name}
                    <ChevronRight size={11} style={{ display: 'inline', margin: '0 3px', verticalAlign: 'middle' }} />
                    {job.drops.map(d => d.name).join(' → ')}
                  </td>
                  <td><strong>{job.vehicleReg ?? '—'}</strong></td>
                  <td>{job.distanceKm ? `${job.distanceKm} km` : '—'}</td>
                  <td>{job.etaMinutes ? `${job.etaMinutes} min` : '—'}</td>
                  <td>
                    <span className="bpl-dispatch-status" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </FeatureGate>
  );
}
