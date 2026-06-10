import { Truck, Activity, Clock, TrendingUp, DollarSign, AlertCircle, Fuel, Wifi, WifiOff } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import FuelChart from '../components/FuelChart';

const QUARRY_ZONES = ['lh quarry', 'quarry ewekoro', 'quarry mfamosing'];

const STATUS_COLOR: Record<string, string> = {
  Moving: '#16a34a',
  Idle: '#d97706',
  'Excessive Idle': '#CC0000',
  Stationary: '#0d9488',
  Parked: '#7C3AED',
  Offline: '#6B7A8D',
  Inactive: '#6878A0',
};

function FuelMonitorSection() {
  const { vehicles } = useFleet();

  const quarryVehicles = vehicles.filter(v =>
    QUARRY_ZONES.some(z => v.zone?.toLowerCase().includes(z))
  );

  const byZone: Record<string, typeof quarryVehicles> = {};
  quarryVehicles.forEach(v => {
    const z = v.zone || 'Unknown Zone';
    if (!byZone[z]) byZone[z] = [];
    byZone[z].push(v);
  });

  const online = quarryVehicles.filter(v => v.status !== 'Offline' && v.status !== 'Inactive').length;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Fuel size={18} color="#0078D4" />
        Quarry Fuel Monitoring
      </div>
      <div style={{ fontSize: 13, color: 'var(--cd-text-muted)', marginBottom: 20 }}>
        Fuel probe monitors are fitted to quarry assets only. Live fuel level data streams via the MiX Fuel Probe 1min Ticker event.
      </div>

      {/* KPI row */}
      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <KPICard label="Quarry Assets" value={quarryVehicles.length} icon={Truck} color="#0078D4" sub="Fuel probe fitted" />
        <KPICard label="Online Now" value={online} color="#16a34a" icon={Activity} sub="Reporting to MiX" />
        <KPICard label="Temp Inactive" value={quarryVehicles.length - online} color="#6B7A8D" sub="No recent signal" />
        <KPICard label="Quarry Zones" value={Object.keys(byZone).length} color="#7C3AED" sub="LH · Ewekoro · Mfamosing" />
      </div>

      <FuelChart />

      {/* Per-zone tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignItems: 'start' }}>
      {Object.entries(byZone).sort(([a], [b]) => a.localeCompare(b)).map(([zone, zVehicles]) => {
        const zOnline = zVehicles.filter(v => v.status !== 'Offline' && v.status !== 'Inactive').length;
        return (
          <div key={zone} className="bpl-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--cd-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
                {zone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--cd-text-muted)' }}>
                <span>{zVehicles.length} assets</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{zOnline} online</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--cd-surface-2)' }}>
                  {['Reg No', 'Asset', 'Status', 'Signal', 'Fuel Level'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cd-text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zVehicles.sort((a, b) => a.regNo.localeCompare(b.regNo)).map((v, i) => {
                  const isOnline = v.status !== 'Offline' && v.status !== 'Inactive';
                  return (
                    <tr key={v.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--cd-border)', background: i % 2 === 0 ? 'transparent' : 'var(--cd-surface-2)' }}>
                      <td style={{ padding: '11px 20px', fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>{v.regNo}</td>
                      <td style={{ padding: '11px 20px', color: 'var(--cd-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.assetName}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11,
                          fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                          background: `${STATUS_COLOR[v.status] ?? '#6B7A8D'}18`,
                          color: STATUS_COLOR[v.status] ?? '#6B7A8D',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px' }}>
                        {isOnline
                          ? <Wifi size={14} color="#16a34a" />
                          : <WifiOff size={14} color="#6B7A8D" />}
                      </td>
                      <td style={{ padding: '11px 20px' }}>
                        {(v as any).fuelLevel != null ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cd-text)' }}>
                            {(v as any).fuelLevel.level.toFixed(0)}
                            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 3 }}>L</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--cd-text-muted)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      </div>
    </div>
  );
}

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
  const { metadata, vehicles } = useFleet();
  const total = vehicles.length || 1;
  const deployable = total - metadata.offline - metadata.inactive;
  const utilizationPct = Math.round((metadata.moving / Math.max(deployable, 1)) * 100);
  const availabilityPct = Math.round((deployable / total) * 100);

  const bars = [
    { label: 'Moving', value: metadata.moving, color: '#16a34a', pct: (metadata.moving / total) * 100 },
    { label: 'Parked', value: metadata.parked, color: '#7C3AED', pct: (metadata.parked / total) * 100 },
    { label: 'Idle', value: metadata.idle + metadata.excessiveIdle, color: '#d97706', pct: ((metadata.idle + metadata.excessiveIdle) / total) * 100 },
    { label: 'Stationary', value: metadata.stationary, color: '#0d9488', pct: (metadata.stationary / total) * 100 },
    { label: 'Temp Inactive', value: metadata.offline, color: '#6B7A8D', pct: (metadata.offline / total) * 100 },
    { label: 'Inactive', value: metadata.inactive, color: '#6878A0', pct: (metadata.inactive / total) * 100 },
  ];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', marginBottom: 14 }}>
        Fleet Utilisation
      </div>
      <div className="bpl-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <KPICard label="Total Fleet" value={vehicles.length} icon={Truck} color="#0078D4" />
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

export default function Operations({ tab }: { tab: 'utilization' | 'productivity' | 'economics' | 'fuel' }) {
  const TAB_TITLES = { utilization: 'Utilisation', productivity: 'Productivity', economics: 'Asset Economics', fuel: 'Fuel Monitoring' };
  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Operations — {TAB_TITLES[tab]}</h1>
        <p className="bpl-page-subtitle">Fleet utilisation, productivity, asset economics, and fuel monitoring</p>
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
      {tab === 'fuel' && <FuelMonitorSection />}
    </div>
  );
}
