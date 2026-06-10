import { useState } from 'react';
import { Settings as SettingsIcon, Check, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

type Tab = 'general' | 'thresholds' | 'api' | 'roles';

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 13,
  background: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none',
  fontFamily: 'var(--cd-font-body)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--cd-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
  display: 'block',
};

function GeneralSettings() {
  const { theme, setTheme } = useFleet();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    clientName: 'Lafarge Nigeria',
    platform: 'BPL Fleet Intelligence Platform',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
  });

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 20, fontFamily: 'var(--cd-font-display)' }}>
          Platform Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Client Name</label>
            <input style={fieldStyle} value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Platform Name</label>
            <input style={fieldStyle} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select style={fieldStyle} value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
              <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select style={fieldStyle} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 16, fontFamily: 'var(--cd-font-display)' }}>
          Display
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cd-text)' }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>Switch between light and dark mode</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: theme === t ? 'var(--bpl-blue)' : 'var(--cd-border)',
                  background: theme === t ? 'var(--bpl-blue-soft)' : 'var(--cd-surface)',
                  color: theme === t ? 'var(--bpl-blue)' : 'var(--cd-text-muted)',
                  fontWeight: theme === t ? 600 : 400,
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="bpl-btn-primary" onClick={save}>
          {saved ? <><Check size={14} /> Saved</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function ThresholdSettings() {
  const [thresholds, setThresholds] = useState({
    harshBrakingIntervention: 8,
    overspeedAlert: 1,
    fleetScoreWarning: 70,
    fleetScoreCritical: 50,
    panicAutoAlert: true,
    staleDataThreshold: 60,
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bpl-card" style={{ padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
        Safety Thresholds
      </div>
      <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 20 }}>
        These thresholds control when alerts are triggered and when intervention is required.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Harsh Braking Intervention Threshold', key: 'harshBrakingIntervention', unit: 'events/30 days', desc: 'FMCSA BASIC requires formal review above this threshold' },
          { label: 'Fleet Score Warning Level', key: 'fleetScoreWarning', unit: '/100', desc: 'Amber alert when score drops below this' },
          { label: 'Fleet Score Critical Level', key: 'fleetScoreCritical', unit: '/100', desc: 'Red alert when score drops below this' },
          { label: 'Stale Data Threshold', key: 'staleDataThreshold', unit: 'seconds', desc: 'Show data warning if feed is older than this' },
        ].map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                style={{ ...fieldStyle, width: 80, flexShrink: 0 }}
                value={(thresholds as any)[f.key]}
                onChange={e => setThresholds(p => ({ ...p, [f.key]: Number(e.target.value) }))}
              />
              <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>{f.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="panicAutoAlert"
            checked={thresholds.panicAutoAlert}
            onChange={e => setThresholds(p => ({ ...p, panicAutoAlert: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="panicAutoAlert" style={{ fontSize: 13, color: 'var(--cd-text)', cursor: 'pointer', fontWeight: 500 }}>
            Auto-surface panic alerts to all active users immediately
          </label>
        </div>
      </div>
      <button className="bpl-btn-primary" onClick={save}>
        {saved ? <><Check size={14} /> Saved</> : 'Save Thresholds'}
      </button>
    </div>
  );
}

function APISettings() {
  const apiKeys = [
    { name: 'MiX Telematics', key: 'VITE_API_SECRET', status: 'connected', desc: 'Live vehicle telemetry and event data' },
    { name: 'Claude (ARIA)', key: 'VITE_ANTHROPIC_API_KEY', status: import.meta.env.VITE_ANTHROPIC_API_KEY ? 'connected' : 'not_configured', desc: 'AI analysis and ARIA chat intelligence' },
    { name: 'Open-Meteo', key: 'None required', status: 'connected', desc: 'Live weather at incident coordinates via /api/environment' },
    { name: 'TomTom Traffic', key: 'TOMTOM_API_KEY', status: 'server_side', desc: 'Recommended live traffic provider for Lagos/Nigeria — Traffic Flow API' },
    { name: 'Google Maps Traffic', key: 'GOOGLE_MAPS_API_KEY', status: 'server_side', desc: 'Backup live traffic provider — falls back to heuristic without key' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {apiKeys.map(api => (
        <div key={api.name} className="bpl-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 2 }}>{api.name}</div>
            <div style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>{api.desc}</div>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 3 }}>
              Env key: <code style={{ fontFamily: 'monospace', background: 'var(--cd-surface-2)', padding: '1px 5px', borderRadius: 3 }}>{api.key}</code>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {api.status === 'connected' ? (
              <><CheckCircle size={16} color="#16a34a" /><span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Connected</span></>
            ) : api.status === 'server_side' ? (
              <><AlertCircle size={16} color="#0078D4" /><span style={{ fontSize: 12, color: '#0078D4', fontWeight: 600 }}>Server-side</span></>
            ) : (
              <><XCircle size={16} color="#d97706" /><span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Not configured</span></>
            )}
          </div>
        </div>
      ))}

      <div style={{ padding: '12px 16px', background: 'var(--bpl-blue-soft)', border: '1px solid rgba(0,120,212,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--cd-text-muted)' }}>
        <AlertCircle size={13} style={{ display: 'inline', marginRight: 6, color: 'var(--bpl-blue)' }} />
        API keys are stored as environment variables (.env). Edit the .env file in your project root and restart the server to update keys.
      </div>
    </div>
  );
}

function RoleSettings() {
  const roles = [
    { role: 'Admin', desc: 'Full platform access, user management, API configuration', permissions: ['All sections', 'User management', 'Settings', 'Reset'] },
    { role: 'HSE Officer', desc: 'Safety Vault, ARIA Intelligence, Driver Management, Incident Intelligence', permissions: ['Safety Vault', 'ARIA Intelligence', 'Driver Management', 'Incidents', 'Reports'] },
    { role: 'Operations Manager', desc: 'Dashboard, Fleet view, Operations, limited Safety access', permissions: ['Dashboard', 'Operations', 'Driver Management (read)', 'Incidents (read)'] },
    { role: 'View Only', desc: 'Read-only access to Dashboard and Reports', permissions: ['Dashboard (read)', 'Reports (read)'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {roles.map(r => (
        <div key={r.role} className="bpl-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontSize: 14 }}>{r.role}</div>
          <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 10 }}>{r.desc}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {r.permissions.map(p => (
              <span key={p} style={{
                padding: '2px 8px', borderRadius: 9999, fontSize: 11,
                background: 'var(--cd-surface-2)', color: 'var(--cd-text-muted)',
                border: '1px solid var(--cd-border)',
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: '12px 16px', background: 'var(--cd-surface-2)', border: '1px solid var(--cd-border)', borderRadius: 10, fontSize: 12, color: 'var(--cd-text-muted)' }}>
        Role-based access control requires Clerk authentication integration. Configure user roles in your Clerk dashboard.
      </div>
    </div>
  );
}

export default function Settings({ tab }: { tab: Tab }) {
  const TAB_TITLES: Record<Tab, string> = {
    general: 'General',
    thresholds: 'Alert Thresholds',
    api: 'API Connections',
    roles: 'Roles & Permissions',
  };

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Settings — {TAB_TITLES[tab]}</h1>
        <p className="bpl-page-subtitle">Platform configuration, API connections, and user management</p>
      </div>

      {tab === 'general' && <GeneralSettings />}
      {tab === 'thresholds' && <ThresholdSettings />}
      {tab === 'api' && <APISettings />}
      {tab === 'roles' && <RoleSettings />}
    </div>
  );
}
