import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Check, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import {
  DEFAULT_FLEET_SCORE_CONFIG,
  type FleetScoreConfig,
} from '../lib/fleetSafetyScore';
import {
  loadConsequenceConfig,
  saveConsequenceConfig,
  DEFAULT_CONSEQUENCE_CONFIG,
  type ConsequenceScoreConfig,
} from '../lib/consequenceScore';

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
  const { scoreConfig, updateScoreConfig } = useFleet();
  const [form, setForm] = useState<FleetScoreConfig>(scoreConfig);
  const [consequenceForm, setConsequenceForm] = useState<ConsequenceScoreConfig>(() => loadConsequenceConfig());
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(scoreConfig); }, [scoreConfig]);

  const setWeight = (key: keyof FleetScoreConfig['weights'], value: number) => {
    setForm(p => ({ ...p, weights: { ...p.weights, [key]: value } }));
  };

  const save = () => {
    updateScoreConfig(form);
    saveConsequenceConfig(consequenceForm);
    setConsequenceForm(loadConsequenceConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDefaults = () => {
    setForm({
      ...DEFAULT_FLEET_SCORE_CONFIG,
      weights: { ...DEFAULT_FLEET_SCORE_CONFIG.weights },
    });
    setConsequenceForm({ ...DEFAULT_CONSEQUENCE_CONFIG });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
          Leading fleets target (Nigeria-calibrated)
        </div>
        <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 12, lineHeight: 1.55 }}>
          Your Fleet Safety Score is <strong style={{ color: 'var(--cd-text)' }}>how close you are to leading fleets in similar conditions</strong>.
          Match or beat this rate → score 100. Double the rate → score 50.
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Leading fleets aim for (per 100 vehicles / 30 days)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              step={1}
              min={0.1}
              max={2000}
              style={{ ...fieldStyle, width: 100 }}
              value={form.leadingRatePer100}
              onChange={e => setForm(p => ({ ...p, leadingRatePer100: Number(e.target.value) }))}
            />
            <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>weighted IVMS points</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 6, lineHeight: 1.45 }}>
            Default <strong>240</strong> — best / leading for Nigerian quarry & heavy-haul (road quality, mixed traffic,
            Africa mining mobile-equipment risk). Stricter EU/US award rates (~8) made live MiX scores look like ~2%;
            this scale keeps a healthy fleet around <strong>60+</strong> while still rewarding improvement toward leading.
          </div>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--cd-text-muted)', lineHeight: 1.5,
          background: 'var(--cd-surface-2)', border: '1px solid var(--cd-border)', borderRadius: 8, padding: '10px 12px',
        }}>
          Example: leading target <strong style={{ color: 'var(--cd-text)' }}>240</strong>, your rate is <strong style={{ color: 'var(--cd-text)' }}>400</strong>
          → score = 100 × 240 ÷ 400 = <strong style={{ color: 'var(--cd-text)' }}>60</strong>.
        </div>
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
          Fleet Safety Score — event weights
        </div>
        <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 16, lineHeight: 1.55 }}>
          Each incident adds these points, then we convert the total to a rate per 100 vehicles and compare it to the leading target above.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Harsh Braking', key: 'harshBraking' as const, desc: 'Default 2.0' },
            { label: 'Harsh Acceleration', key: 'harshAcceleration' as const, desc: 'Default 1.5' },
            { label: 'Overspeeding', key: 'overspeeding' as const, desc: 'Default 1.5 — includes Overspeed Tiered' },
            { label: 'Harsh Cornering', key: 'harshCornering' as const, desc: 'Default 1.0' },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={20}
                style={{ ...fieldStyle, width: 100 }}
                value={form.weights[f.key]}
                onChange={e => setWeight(f.key, Number(e.target.value))}
              />
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
          Extra fleet score options
        </div>
        <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 16 }}>
          Optional knobs. Most sites only change the leading target and weights above.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Lowest score allowed', key: 'scoreFloor' as const, unit: '/100', desc: 'Gauge never drops below this (default 0)' },
            { label: 'Home driver card penalty / event', key: 'driverPenaltyPerEvent' as const, unit: 'pts', desc: 'Home Driver Performance strip only (default 3)' },
            { label: 'Fleet score warning', key: 'fleetScoreWarning' as const, unit: '/100', desc: 'Amber alert threshold (default 70)' },
            { label: 'Fleet score critical', key: 'fleetScoreCritical' as const, unit: '/100', desc: 'Red alert threshold (default 50)' },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  step={f.key === 'driverPenaltyPerEvent' ? 0.5 : 1}
                  style={{ ...fieldStyle, width: 80, flexShrink: 0 }}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                />
                <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>{f.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
          Fleet status bands
        </div>
        <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 16 }}>
          Colour / label cutoffs for your % of the leading fleets target. Score at or above each value uses that band.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Good Standing ≥', key: 'bandGood' as const, color: '#16a34a' },
            { label: 'Needs Attention ≥', key: 'bandAttention' as const, color: '#d97706' },
            { label: 'Below Average ≥', key: 'bandBelow' as const, color: '#e05c2a' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ ...labelStyle, color: f.color }}>{f.label}</label>
              <input
                type="number"
                min={1}
                max={100}
                style={{ ...fieldStyle, width: 80 }}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 12 }}>
          Below “Below Average” → Poor Performance
        </div>
      </div>

      <div className="bpl-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
          Driver discipline bands (Consequence Management)
        </div>
        <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginBottom: 12, lineHeight: 1.55 }}>
          This is <strong style={{ color: 'var(--cd-text)' }}>not</strong> the Fleet Safety Score on Home.
          It grades each driver after IVMS violations (harsh brake, overspeed, etc.) and decides Green → Amber → Yellow → Red.
        </div>
        <div style={{
          fontSize: 12, color: 'var(--cd-text)', lineHeight: 1.55, marginBottom: 16,
          background: 'var(--cd-surface-2)', border: '1px solid var(--cd-border)', borderRadius: 8, padding: '10px 12px',
        }}>
          <strong>How it works:</strong> every scored event costs points. Those points are divided by how far the driver drove
          (per 100 km), so a driver with 1 event in 50 km looks worse than 1 event in 500 km.
          <div style={{ marginTop: 8, color: 'var(--cd-text-muted)' }}>
            Example with default 2: 34 events × −2 = −68 points. Drove 600 km → that’s 600÷100 = <strong>6</strong> blocks of 100 km → −68 ÷ 6 = <strong style={{ color: '#d97706' }}>−11.3 → Yellow</strong>.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Points lost per violation</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={20}
                style={{ ...fieldStyle, width: 80 }}
                value={consequenceForm.penaltyPerEvent}
                onChange={e => setConsequenceForm(p => ({ ...p, penaltyPerEvent: Number(e.target.value) }))}
              />
              <span style={{ fontSize: 12, color: 'var(--cd-text-muted)' }}>points deducted each time</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4 }}>
              Raise this to punish violations harder. Lafarge policy default is 2.
            </div>
          </div>
          <div>
            <label style={{ ...labelStyle, color: '#f59e0b' }}>Warning band starts at</label>
            <input
              type="number"
              step={0.1}
              style={{ ...fieldStyle, width: 80 }}
              value={consequenceForm.amberStart}
              onChange={e => setConsequenceForm(p => ({ ...p, amberStart: Number(e.target.value) }))}
            />
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              Driver score ≤ this → <strong style={{ color: '#f59e0b' }}>Amber</strong> (written warning / retraining).
              Above this (and still negative) stays Green-ish / mild. Default −2.
            </div>
          </div>
          <div>
            <label style={{ ...labelStyle, color: '#d97706' }}>Suspension band starts at</label>
            <input
              type="number"
              step={0.1}
              style={{ ...fieldStyle, width: 80 }}
              value={consequenceForm.yellowStart}
              onChange={e => setConsequenceForm(p => ({ ...p, yellowStart: Number(e.target.value) }))}
            />
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              Score ≤ this → <strong style={{ color: '#d97706' }}>Yellow</strong> (3-day → 1-week suspension). Default −6.
            </div>
          </div>
          <div>
            <label style={{ ...labelStyle, color: '#CC0000' }}>Severe band starts at</label>
            <input
              type="number"
              step={0.1}
              style={{ ...fieldStyle, width: 80 }}
              value={consequenceForm.redStart}
              onChange={e => setConsequenceForm(p => ({ ...p, redStart: Number(e.target.value) }))}
            />
            <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              Score ≤ this → <strong style={{ color: '#CC0000' }}>Red</strong> (2-week suspension → termination). Default −12.
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 14, lineHeight: 1.45 }}>
          Scores are negative numbers: 0 is perfect, −12 is much worse than −2.
          Move a band number closer to 0 (e.g. −4 instead of −6) to make that tier kick in sooner.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={resetDefaults}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            border: '1px solid var(--cd-border)', background: 'var(--cd-surface)', color: 'var(--cd-text-muted)',
          }}
        >
          Reset defaults
        </button>
        <button className="bpl-btn-primary" onClick={save}>
          {saved ? <><Check size={14} /> Saved — scores updated</> : 'Save Thresholds'}
        </button>
      </div>
    </div>
  );
}

function APISettings() {
  const apiKeys = [
    { name: 'MiX Telematics', key: 'VITE_API_SECRET', status: 'connected', desc: 'Live vehicle telemetry and event data' },
    { name: 'Claude (BPL Analyst)', key: 'VITE_ANTHROPIC_API_KEY', status: import.meta.env.VITE_ANTHROPIC_API_KEY ? 'connected' : 'not_configured', desc: 'AI analysis and BPL Analyst chat intelligence' },
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

    </div>
  );
}

function RoleSettings() {
  const roles = [
    { role: 'Admin', desc: 'Full platform access, user management, API configuration', permissions: ['All sections', 'User management', 'Settings', 'Reset'] },
    { role: 'HSE Officer', desc: 'Safety Vault, BPL Analyst Intelligence, Driver Management, Incident Intelligence', permissions: ['Safety Vault', 'BPL Analyst Intelligence', 'Driver Management', 'Incidents', 'Reports'] },
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
    thresholds: 'Safety Score',
    api: 'API Connections',
    roles: 'Roles & Permissions',
  };

  const tabs: { id: Tab; path: string; label: string }[] = [
    { id: 'general', path: '/settings/general', label: 'General' },
    { id: 'thresholds', path: '/settings/thresholds', label: 'Safety Score' },
    { id: 'api', path: '/settings/api', label: 'API' },
    { id: 'roles', path: '/settings/roles', label: 'Roles' },
  ];

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Settings — {TAB_TITLES[tab]}</h1>
        <p className="bpl-page-subtitle">Platform configuration, API connections, and user management</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <Link
            key={t.id}
            to={t.path}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              textDecoration: 'none',
              border: '1px solid',
              borderColor: tab === t.id ? 'var(--bpl-blue)' : 'var(--cd-border)',
              background: tab === t.id ? 'var(--bpl-blue-soft)' : 'var(--cd-surface)',
              color: tab === t.id ? 'var(--bpl-blue)' : 'var(--cd-text-muted)',
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'general' && <GeneralSettings />}
      {tab === 'thresholds' && <ThresholdSettings />}
      {tab === 'api' && <APISettings />}
      {tab === 'roles' && <RoleSettings />}
    </div>
  );
}
