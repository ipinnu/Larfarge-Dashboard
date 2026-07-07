import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';

type DispatchTab = 'all' | 'ongoing' | 'completed';

const TAB_LABELS: Record<DispatchTab, string> = {
  all: 'All',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

const STATUS_STYLE = {
  pending: { label: 'Pending', bg: 'rgba(217,119,6,0.12)', color: '#d97706' },
  assigned: { label: 'Assigned', bg: 'rgba(37,99,235,0.12)', color: '#2563eb' },
  in_transit: { label: 'In transit', bg: 'rgba(22,163,74,0.12)', color: '#16a34a' },
  delivered: { label: 'Delivered', bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
};

const DEMO_JOBS = [
  { id: '1', ref: 'DSP-1042', material: 'Cement', pickup: 'Ewekoro Quarry', drop: 'Central Depot', status: 'in_transit' as const, vehicle: '—' },
  { id: '2', ref: 'DSP-1038', material: 'Clinker', pickup: 'Mfamosing Quarry', drop: 'East Terminal', status: 'assigned' as const, vehicle: '—' },
  { id: '3', ref: 'DSP-1031', material: 'Limestone', pickup: 'LH Quarry', drop: 'South Plant', status: 'pending' as const, vehicle: '—' },
];

function isOngoing(status: keyof typeof STATUS_STYLE) {
  return status === 'pending' || status === 'assigned' || status === 'in_transit';
}

export default function DispatchWidget() {
  const [tab, setTab] = useState<DispatchTab>('ongoing');

  const filtered = useMemo(() => {
    if (tab === 'all') return DEMO_JOBS;
    if (tab === 'ongoing') return DEMO_JOBS.filter(j => isOngoing(j.status));
    return DEMO_JOBS.filter(j => j.status === 'delivered');
  }, [tab]);

  return (
    <div className="bpl-card bpl-home-mid-panel">
      <div className="bpl-card-header bpl-trips-header">
        <span className="bpl-card-title">Dispatch</span>
        <div className="bpl-trips-header-right">
          <div className="bpl-trips-tabs" role="tablist" aria-label="Dispatch filter">
            {(Object.keys(TAB_LABELS) as DispatchTab[]).map(key => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`bpl-trips-tab${tab === key ? ' active' : ''}`}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
          <Link to="/trips/dispatch" className="bpl-card-link">View all</Link>
        </div>
      </div>
      <div className="bpl-card-body bpl-trips-body">
        {filtered.map(job => {
          const st = STATUS_STYLE[job.status];
          return (
            <Link key={job.id} to="/trips/dispatch" className="bpl-dispatch-widget-item bpl-widget-row-link">
              <div className="bpl-dispatch-widget-top">
                <div>
                  <div className="bpl-dispatch-widget-ref">{job.ref}</div>
                  <div className="bpl-dispatch-widget-material">
                    <Package size={11} /> {job.material}
                  </div>
                </div>
                <span className="bpl-trip-status" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              </div>
              <div className="bpl-dispatch-widget-route">
                <MapPin size={11} />
                {job.pickup} → {job.drop}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
