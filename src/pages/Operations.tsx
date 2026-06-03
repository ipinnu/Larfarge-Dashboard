import { Truck, Activity, Clock, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bpl-coming-soon-section">
      <div className="bpl-coming-soon-label">Coming Soon</div>
      <div className="bpl-coming-soon-title">{title}</div>
      <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginTop: 6 }}>{desc}</div>
    </div>
  );
}

function KPICard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: any;
}) {
  return (
    <div className="bpl-kpi-card" style={color ? { borderTop: `3px solid ${color}` } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div className="bpl-kpi-label">{label}</div>
        {Icon && <Icon size={15} style={{ color: color || 'var(--cd-text-muted)', opacity: 0.6 }} />}
      </div>
      <div className="bpl-kpi-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="bpl-kpi-sub">{sub}</div>}
    </div>
  );
}

function UtilizationSection() {
  const { metadata } = useFleet();
  const total = metadata.totalVehicles || 1;
  const deployable = total - metadata.offline - metadata.inactive;
  const utilizationPct = Math.round((metadata.moving / Math.max(deployable, 1)) * 100);
  const availabilityPct = Math.round((deployable / total) * 100);

  const bars = [
    { label: 'Moving', value: metadata.moving, color: '#16a34a', pct: (metadata.moving / total) * 100 },
    { label: 'Parked', value: metadata.parked, color: '#7C3AED', pct: (metadata.parked / total) * 100 },
    { label: 'Idle', value: metadata.idle + metadata.excessiveIdle, color: '#d97706', pct: ((metadata.idle + metadata.excessiveIdle) / total) * 100 },
    { label: 'Stationary', value: metadata.stationary, color: '#0d9488', pct: (metadata.stationary / total) * 100 },
    { label: 'Offline', value: metadata.offline, color: '#6B7A8D', pct: (metadata.offline / total) * 100 },
    { label: 'Inactive', value: metadata.inactive, color: '#6878A0', pct: (metadata.inactive / total) * 100 },
  ];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 14 }}>
        Fleet Utilisation
      </div>
      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <KPICard label="Total Fleet" value={metadata.totalVehicles} icon={Truck} color="#0078D4" />
        <KPICard label="Asset Availability" value={`${availabilityPct}%`} sub={`${deployable} of ${total} deployable`} color="#16a34a" icon={Activity} />
        <KPICard label="Active Utilisation" value={`${utilizationPct}%`} sub="Moving / deployable fleet" color={utilizationPct > 50 ? '#16a34a' : '#d97706'} />
        <KPICard label="Vehicles Moving" value={metadata.moving} sub="Currently on road" color="#16a34a" icon={TrendingUp} />
      </div>

      <div className="bpl-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 20, fontFamily: 'var(--cd-font-display)' }}>
          Fleet Status Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bars.map(b => (
            <div key={b.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                <span style={{ fontWeight: 500, color: 'var(--cd-text)' }}>{b.label}</span>
                <span style={{ color: b.color, fontWeight: 700 }}>{b.value} <span style={{ color: 'var(--cd-text-muted)', fontWeight: 400 }}>({Math.round(b.pct)}%)</span></span>
              </div>
              <div style={{ height: 8, background: 'var(--cd-border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssetEconomics() {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        Asset Economics
        <span className="bpl-badge-blue">Management View</span>
      </div>

      <div style={{
        padding: '16px 20px', marginBottom: 20, borderRadius: 10,
        background: 'rgba(100,116,139,0.07)', border: '1px dashed var(--cd-border)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertCircle size={16} color="var(--cd-text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', lineHeight: 1.5 }}>
          Asset economics data (revenue per vehicle, cost per km, ROI) requires integration with your logistics management system. Connect your ERP or revenue data source in Settings to populate this section.
        </div>
      </div>

      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Revenue / Vehicle', value: '—', sub: 'ERP data required', icon: DollarSign },
          { label: 'Cost / Kilometre', value: '—', sub: 'Fuel + maintenance data required' },
          { label: 'Fleet ROI vs Target', value: '—', sub: 'Configure targets in Settings' },
        ].map(k => (
          <div key={k.label} className="bpl-kpi-card" style={{ opacity: 0.6 }}>
            <div className="bpl-kpi-label">{k.label}</div>
            <div className="bpl-kpi-value" style={{ fontSize: 28, color: 'var(--cd-text-muted)' }}>{k.value}</div>
            <div className="bpl-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Operations({ tab }: { tab: 'utilization' | 'productivity' | 'economics' }) {
  const TAB_TITLES = { utilization: 'Utilisation', productivity: 'Productivity', economics: 'Asset Economics' };
  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Operations — {TAB_TITLES[tab]}</h1>
        <p className="bpl-page-subtitle">Fleet utilisation, productivity, and asset economics</p>
      </div>

      {tab === 'utilization' && <UtilizationSection />}

      {tab === 'productivity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <ComingSoon title="Turnaround Time Analysis" desc="Average trip duration, loading and offloading delays, route efficiency scores." />
          <ComingSoon title="Route Performance" desc="Distance covered, on-time delivery rate, route deviation alerts." />
          <ComingSoon title="Driver Productivity Score" desc="Trips completed per driver, time-on-road vs idle ratio, delivery compliance rate." />
        </div>
      )}

      {tab === 'economics' && <AssetEconomics />}
    </div>
  );
}
