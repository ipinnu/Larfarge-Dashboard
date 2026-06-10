import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, User, GraduationCap, Award, BadgeCheck,
  AlertTriangle, Search, ScatterChart, ListChecks,
  Shield, FileText, Wrench, MessageSquare, History,
  FileBarChart2, Calendar, BarChart3, Target, Folder,
  Truck, Percent, Clock, DollarSign, Fuel,
  Settings, ChevronDown, Sun, Moon, LogOut,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

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
  {
    path: '/drivers', icon: Users, label: 'Driver Management',
    children: [
      { path: '/drivers', label: 'Drivers', icon: User },
      { path: '/drivers/coaching', label: 'Coaching', icon: GraduationCap },
      { path: '/drivers/training', label: 'Training', icon: Award },
      { path: '/drivers/certifications', label: 'Certifications', icon: BadgeCheck },
    ],
  },
  {
    path: '/incidents', icon: AlertTriangle, label: 'Incident Intelligence',
    children: [
      { path: '/incidents', label: 'Event Explorer', icon: Search },
      { path: '/incidents/analysis', label: 'Analysis', icon: ScatterChart },
      { path: '/incidents/response', label: 'Response Tracking', icon: ListChecks },
    ],
  },
  { path: '/safety', icon: Shield, label: 'Safety' },
  { path: '/operations/fuel', icon: Fuel, label: 'Fuel Monitoring' },
  {
    path: '/reports', icon: FileBarChart2, label: 'Reports & Reviews',
    children: [
      { path: '/reports/weekly', label: 'Weekly', icon: Calendar },
      { path: '/reports/monthly', label: 'Monthly', icon: Calendar },
      { path: '/reports/quarterly', label: 'Quarterly', icon: BarChart3 },
      { path: '/reports/actions', label: 'Action Tracking', icon: Target },
      { path: '/reports/documents', label: 'Documents', icon: Folder },
    ],
  },
  {
    path: '/operations', icon: Truck, label: 'Operations',
    children: [
      { path: '/operations/utilization', label: 'Utilization', icon: Percent },
      { path: '/operations/productivity', label: 'Productivity', icon: Clock },
      { path: '/operations/economics', label: 'Asset Economics', icon: DollarSign },
    ],
  },
  { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
];

const PINNED: NavGroup = { path: '/settings', icon: Settings, label: 'Settings', pinned: true };

interface Props {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: Props) {
  const { theme, setTheme, redAlertCount, fleetSafetyScore } = useFleet();
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

  const [openGroup, setOpenGroup] = useState<string | null>(() => getParentPath(location.pathname));

  const toggleGroup = (path: string, defaultChild?: string) => {
    if (openGroup === path) {
      setOpenGroup(null);
    } else {
      setOpenGroup(path);
      if (defaultChild) navigate(defaultChild);
    }
  };

  const isSubActive = (child: SubItem) => {
    if (child.path === location.pathname) return true;
    // treat /drivers as active for /drivers (exact) only
    return false;
  };

  const scoreColor = fleetSafetyScore >= 80 ? '#33d38d' : fleetSafetyScore >= 60 ? '#f5b453' : fleetSafetyScore >= 45 ? '#e05c2a' : '#ff6b6b';

  return (
    <aside className={`bpl-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      style={{ background: '#0a1520', width: 220 }}
    >
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#fff',
            borderRadius: 6,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/Lafarge_(Unternehmen)_logo.svg"
              alt="Lafarge"
              style={{ height: 24, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            Fleet Intelligence<br />Platform
          </div>
        </div>

        {/* Score strip */}
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

      {/* Scrollable nav */}
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
              {/* Parent row */}
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

              {/* Sub-items with max-height animation */}
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
      </div>

      {/* Bottom: Settings + ARIA badge */}
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

        {/* ARIA online badge */}
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
          <span style={{ fontSize: 11, color: 'rgba(0,120,212,0.9)', fontWeight: 500 }}>ARIA online</span>
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
