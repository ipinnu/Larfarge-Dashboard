import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users,
  AlertTriangle, Search, ListChecks,
  Shield, Wrench, FileBarChart2, Folder, BarChart3, Fuel,
  Truck, Map, Navigation, Route, Brain, Lock, Sparkles, Gauge,
  Settings, ChevronDown, Sun, Moon, LogOut,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { UPCOMING_FEATURES } from '../../config/lockedFeatures';

interface SubItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  path: string;
  icon: React.ElementType;
  label: string;
  children?: SubItem[];
  pinned?: boolean;
}

const NAV: NavGroup[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/fleet', icon: Map, label: 'Fleet' },
  { path: '/drivers', icon: Users, label: 'Driver Management' },
  {
    path: '/incidents', icon: AlertTriangle, label: 'Incident Intelligence',
    children: [
      { path: '/incidents', label: 'Event Explorer', icon: Search },
      { path: '/incidents/response', label: 'Response Tracking', icon: ListChecks },
    ],
  },
  { path: '/tankers', icon: Truck, label: 'Bulk Tankers' },
  { path: '/safety', icon: Shield, label: 'Safety' },
  { path: '/kpi', icon: Gauge, label: 'Utilization & KPIs' },
  {
    path: '/fuel', icon: Fuel, label: 'Fuel',
    children: [
      { path: '/fuel/monitoring', label: 'Monitoring', icon: Fuel },
      { path: '/fuel/consumption', label: 'Consumption', icon: BarChart3 },
    ],
  },
];

const UPCOMING_ICONS: Record<string, React.ElementType> = {
  '/trips': Route,
  '/trips/dispatch': Navigation,
  '/reports': FileBarChart2,
  '/reports/documents': Folder,
  '/maintenance': Wrench,
  '/aria': Brain,
};

interface Props {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: Props) {
  const { theme, setTheme, redAlertCount, fleetSafetyScore, scoreConfig } = useFleet();
  const location = useLocation();
  const navigate = useNavigate();

  const getParentPath = (pathname: string) => {
    const match = NAV.find(g =>
      g.children
        ? g.children.some(c => c.path === pathname) || pathname.startsWith(g.path + '/')
        : g.path === pathname
    );
    return match?.path ?? null;
  };

  const upcomingActive = UPCOMING_FEATURES.some(
    f => location.pathname === f.path || location.pathname.startsWith(f.path + '/'),
  );

  const [openGroup, setOpenGroup] = useState<string | null>(() => getParentPath(location.pathname));
  const [upcomingOpen, setUpcomingOpen] = useState(() => upcomingActive);

  const toggleGroup = (path: string, defaultChild?: string) => {
    if (openGroup === path) {
      setOpenGroup(null);
    } else {
      setOpenGroup(path);
      if (defaultChild) navigate(defaultChild);
    }
  };

  const scoreColor = fleetSafetyScore >= scoreConfig.bandGood
    ? '#33d38d'
    : fleetSafetyScore >= scoreConfig.bandAttention
    ? '#f5b453'
    : fleetSafetyScore >= scoreConfig.bandBelow
    ? '#e05c2a'
    : '#ff6b6b';

  return (
    <aside className={`bpl-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      style={{ background: '#0a1520', width: 220 }}
    >
      <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#fff',
            borderRadius: 6,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/HBM-logo.jpeg"
              alt="HBM Nigeria"
              style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            Fleet Intelligence<br />Platform
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, padding: '8px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>
              Safety Score
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor, lineHeight: 1, fontFamily: 'var(--cd-font-display)' }}>
              {fleetSafetyScore}
              <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 1 }}>/100</span>
            </div>
          </div>
          {redAlertCount > 0 && (
            <div style={{
              background: '#CC0000', color: '#fff', borderRadius: 6,
              padding: '3px 7px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{redAlertCount}</div>
              <div style={{ fontSize: 8, letterSpacing: '0.04em' }}>RED</div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 0',
        scrollbarWidth: 'none',
      }}>
        {NAV.map(group => {
          const Icon = group.icon;
          const isOpen = openGroup === group.path;
          const isActive = group.path === '/'
            ? location.pathname === '/'
            : location.pathname === group.path || location.pathname.startsWith(group.path + '/');

          if (!group.children) {
            return (
              <NavLink
                key={group.path}
                to={group.path}
                end
                onClick={onCloseMobile}
                style={({ isActive: navActive }) => ({
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', cursor: 'pointer',
                  color: navActive ? '#0078D4' : 'rgba(255,255,255,0.55)',
                  background: navActive ? 'rgba(0,120,212,0.18)' : 'transparent',
                  fontSize: 12.5, textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                })}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon size={15} />
                  {group.label}
                </div>
                {group.path === '/' && redAlertCount > 0 && (
                  <span style={{ background: '#CC0000', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 9999 }}>
                    {redAlertCount}
                  </span>
                )}
              </NavLink>
            );
          }

          return (
            <div key={group.path} style={{ marginBottom: 2 }}>
              <div
                onClick={() => toggleGroup(group.path, group.children![0].path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', cursor: 'pointer',
                  color: isActive ? '#0078D4' : 'rgba(255,255,255,0.55)',
                  background: isActive && !isOpen ? 'rgba(0,120,212,0.18)' : 'transparent',
                  fontSize: 12.5,
                  transition: 'background 0.15s, color 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive || isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon size={15} />
                  {group.label}
                </div>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    transition: 'transform 0.2s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                />
              </div>

              <div style={{
                overflow: 'hidden',
                maxHeight: isOpen ? `${group.children!.length * 34}px` : '0',
                transition: 'max-height 0.25s ease',
              }}>
                {group.children!.map(child => {
                  const SubIcon = child.icon;
                  const childActive = location.pathname === child.path;
                  return (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end
                      onClick={onCloseMobile}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px 6px 38px',
                        fontSize: 12,
                        color: childActive ? '#0078D4' : 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        transition: 'background 0.15s, color 0.15s',
                        background: childActive ? 'rgba(0,120,212,0.1)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <SubIcon size={13} style={{ flexShrink: 0 }} />
                      {child.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
          <div
            onClick={() => setUpcomingOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', cursor: 'pointer',
              color: upcomingActive ? '#0078D4' : 'rgba(255,255,255,0.45)',
              fontSize: 12.5,
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Sparkles size={15} />
              Upcoming features
            </div>
            <ChevronDown
              size={13}
              style={{
                color: 'rgba(255,255,255,0.25)',
                transition: 'transform 0.2s ease',
                transform: upcomingOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
              }}
            />
          </div>
          <div style={{
            overflow: 'hidden',
            maxHeight: upcomingOpen ? `${UPCOMING_FEATURES.length * 34}px` : '0',
            transition: 'max-height 0.25s ease',
          }}>
            {UPCOMING_FEATURES.map(item => {
              const Icon = UPCOMING_ICONS[item.path] ?? Lock;
              const active = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={onCloseMobile}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 38px',
                    fontSize: 12,
                    color: active ? '#0078D4' : 'rgba(255,255,255,0.35)',
                    textDecoration: 'none',
                    background: active ? 'rgba(0,120,212,0.1)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <Icon size={13} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <Lock size={11} style={{ opacity: 0.45, flexShrink: 0 }} />
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <NavLink
          to="/settings/general"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 14px', fontSize: 12.5,
            color: isActive ? '#0078D4' : 'rgba(255,255,255,0.55)',
            background: isActive ? 'rgba(0,120,212,0.18)' : 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => {
            const active = location.pathname.startsWith('/settings');
            (e.currentTarget as HTMLElement).style.background = active ? 'rgba(0,120,212,0.18)' : 'transparent';
          }}
        >
          <Settings size={15} />
          Settings
        </NavLink>

        <div style={{
          margin: '8px 10px 0',
          background: 'rgba(0,120,212,0.12)',
          border: '0.5px solid rgba(0,120,212,0.3)',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 6, height: 6, background: '#0078D4', borderRadius: '50%',
            animation: 'aria-pulse 2s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: 'rgba(0,120,212,0.9)', fontWeight: 500 }}>BPL Analyst online</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2,
              display: 'flex', alignItems: 'center',
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', padding: 2,
              display: 'flex', alignItems: 'center',
            }}
            title="Log out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
