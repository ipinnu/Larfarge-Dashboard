import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, UserCircle, RotateCcw } from 'lucide-react';
import Sidebar from './Sidebar';
import ARIAChat from '../ARIAChat';
import SafetyToast from '../SafetyToast';
import SafetyIncidentModal from '../SafetyIncidentModal';
import { useFleet, authFetch } from '../../context/FleetContext';

function getPageTitle(pathname: string): { title: string; sub: string } {
  const map: Record<string, { title: string; sub: string }> = {
    '/': { title: 'Dashboard', sub: '— real-time fleet overview' },
    '/drivers': { title: 'Driver Management', sub: '— profiles and safety scores' },
    '/drivers/coaching': { title: 'Driver Management', sub: '— coaching history' },
    '/drivers/training': { title: 'Driver Management', sub: '— training records' },
    '/drivers/certifications': { title: 'Driver Management', sub: '— certifications' },
    '/incidents': { title: 'Incident Intelligence', sub: '— event explorer' },
    '/incidents/analysis': { title: 'Incident Intelligence', sub: '— analysis' },
    '/incidents/response': { title: 'Incident Intelligence', sub: '— response tracking' },
    '/vault': { title: 'Safety Vault', sub: '— incident records' },
    '/vault/investigations': { title: 'Safety Vault', sub: '— investigations' },
    '/vault/actions': { title: 'Safety Vault', sub: '— corrective actions' },
    '/vault/acknowledgements': { title: 'Safety Vault', sub: '— acknowledgements' },
    '/vault/audit': { title: 'Safety Vault', sub: '— audit trail' },
    '/reports/weekly': { title: 'Reports & Reviews', sub: '— weekly report' },
    '/reports/monthly': { title: 'Reports & Reviews', sub: '— monthly report' },
    '/reports/quarterly': { title: 'Reports & Reviews', sub: '— quarterly review' },
    '/reports/actions': { title: 'Reports & Reviews', sub: '— action tracking' },
    '/reports/documents': { title: 'Reports & Reviews', sub: '— documents' },
    '/operations/utilization': { title: 'Operations', sub: '— utilization' },
    '/operations/productivity': { title: 'Operations', sub: '— productivity' },
    '/operations/economics': { title: 'Operations', sub: '— asset economics' },
    '/settings/general': { title: 'Settings', sub: '— general' },
    '/settings/thresholds': { title: 'Settings', sub: '— alert thresholds' },
    '/settings/api': { title: 'Settings', sub: '— API connections' },
    '/settings/roles': { title: 'Settings', sub: '— roles & permissions' },
  };
  return map[pathname] ?? { title: 'BPL Fleet', sub: '' };
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const location = useLocation();
  const {
    notifications, dismissNotification, selectedNotification,
    openNotification, closeNotification,
    isMobile, redAlertCount,
  } = useFleet();

  const { title, sub } = getPageTitle(location.pathname);

  const handleReset = async () => {
    setResetting(true);
    try { await authFetch('/api/reset', { method: 'POST' }); } catch {}
    finally { setResetting(false); }
  };

  return (
    <div className="bpl-app">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="bpl-main">
        {/* Dark topbar matching sidebar */}
        <header style={{
          height: 52,
          minHeight: 52,
          background: '#0a1520',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
                <Menu size={18} />
              </button>
            )}
            <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{title}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{sub}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {redAlertCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 7,
                background: 'rgba(204,0,0,0.18)',
                border: '0.5px solid rgba(204,0,0,0.4)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ff6b6b' }}>
                  {redAlertCount} alert{redAlertCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <button
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              }}
              title="Search"
            >
              <Search size={14} />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                }}
                title="Notifications"
              >
                <Bell size={14} />
                {redAlertCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 7, height: 7, background: '#CC0000',
                    borderRadius: '50%', border: '1.5px solid #0a1520',
                  }} />
                )}
              </button>
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: resetting ? 'not-allowed' : 'pointer',
                color: 'rgba(255,255,255,0.5)',
              }}
              title="Reset dashboard"
            >
              <RotateCcw size={14} />
            </button>
            <button
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              }}
              title="Profile"
            >
              <UserCircle size={14} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div className="bpl-page">
            <Outlet />
          </div>
        </main>
      </div>

      <SafetyToast notifications={notifications} onDismiss={dismissNotification} onOpen={openNotification} />
      {selectedNotification && (
        <SafetyIncidentModal notification={selectedNotification} onClose={closeNotification} />
      )}
      <ARIAChat />
    </div>
  );
}
