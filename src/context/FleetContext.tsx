import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SafetyNotification, SafeIQAnalysis } from '../hooks/useSafeIQ';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function generateSafeIQAnalysis(
  e: { label?: string; type: string; driverName?: string; regNo?: string; assetId: string; address?: string; eventTime: string },
  driverIncidents30Days: number,
  driverTrend: 'improving' | 'stable' | 'declining'
): Promise<SafeIQAnalysis | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const eventType = e.type === 'panic' ? 'Panic Alert' : (e.label || 'Unknown');
  const driver = e.driverName || 'Unknown Driver';
  const vehicle = e.regNo || e.assetId;
  const location = e.address || 'Unknown location';
  const time = new Date(e.eventTime).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' });

  const prompt = `You are SafeIQ, the fleet safety analysis engine for BPL Fleet Intelligence Platform (Lafarge Nigeria).

Analyse this safety event and return a JSON object with exactly these fields:
- severity: "RED", "YELLOW", or "GREEN"
- severity_reason: one sentence explaining the severity rating
- root_cause: 2-3 detailed paragraphs analysing the root cause, driver behaviour, road conditions, and systemic factors
- industry_reference: 1-2 sentences citing relevant FMCSA BASIC categories and FRSC Nigeria guidelines with specific thresholds
- coaching_recommendation: 2-3 specific, actionable coaching steps for this driver and vehicle
- ops_flag: true or false (true if immediate supervisor action is required)
- ops_flag_reason: if ops_flag is true, one paragraph explaining what the operations team must do immediately. Empty string if false.

Event details:
- Type: ${eventType}
- Driver: ${driver}
- Vehicle: ${vehicle}
- Location: ${location}
- Time (WAT): ${time}
- Driver incidents last 30 days: ${driverIncidents30Days}
- Driver trend: ${driverTrend}

Return only valid JSON, no markdown, no explanation outside the JSON object.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    return JSON.parse(json) as SafeIQAnalysis;
  } catch {
    return null;
  }
}

const API_SECRET = import.meta.env.VITE_API_SECRET;

export const authFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, { ...options, headers: { ...options.headers, 'x-api-secret': API_SECRET } });

export interface Metadata {
  totalVehicles: number;
  moving: number;
  idle: number;
  excessiveIdle: number;
  stationary: number;
  parked: number;
  inactive: number;
  offline: number;
  lastUpdate: string;
}

export interface LogEntry {
  timestamp: string;
  assetId: string;
  regNo?: string;
  assetName?: string;
  transporter?: string;
  driverName?: string;
  driverPhone?: string;
  address?: string;
  eventId: string;
  eventType?: string;
  label?: string;
  eventTime: string;
  type: 'panic' | 'warning';
}

export interface Vehicle {
  id: string;
  regNo: string;
  transporter: string;
  assetName: string;
  status: string;
  date: string;
  panic: boolean;
  warnings?: { label: string; timestamp: string }[];
  position?: { latitude: number; longitude: number; address?: string };
}

export interface VaultRecord {
  id: string;
  incidentId: string;
  type: string;
  driverName: string;
  vehicleId: string;
  location: string;
  timestamp: string;
  severity: 'RED' | 'YELLOW' | 'GREEN';
  status: 'open' | 'in_review' | 'resolved';
  description: string;
  actions: string[];
  supervisorResponse: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

function computeFleetScore(events: LogEntry[], vehicleCount: number): { score: number; delta: number } {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

  // Normalize deductions by fleet size so score reflects incidents-per-vehicle.
  // Reference fleet of 50 vehicles: each event costs the same as before.
  // Larger fleets require proportionally more events to move the score.
  const REFERENCE_FLEET = 50;

  const score = (evts: LogEntry[]) => {
    const scale = REFERENCE_FLEET / Math.max(vehicleCount, 1);
    let deduction = 0;
    evts.forEach(e => {
      if (e.label === 'Harsh Braking') deduction += 2;
      else if (e.label === 'Harsh Acceleration') deduction += 1.5;
      else if (e.label === 'Overspeeding' || e.label === 'Overspeed Tiered') deduction += 1.5;
      else if (e.label === 'Harsh Cornering') deduction += 1;
      else if (e.type === 'panic') deduction += 5;
    });
    return Math.max(0, Math.min(100, Math.round(100 - deduction * scale)));
  };

  const recent = events.filter(e => new Date(e.eventTime || e.timestamp).getTime() >= thirtyDaysAgo);
  const prev = events.filter(e => {
    const t = new Date(e.eventTime || e.timestamp).getTime();
    return t >= sixtyDaysAgo && t < thirtyDaysAgo;
  });

  const current = score(recent);
  const previous = score(prev);
  return { score: current, delta: current - previous };
}

interface FleetContextType {
  authFetch: typeof authFetch;
  metadata: Metadata;
  vehicles: Vehicle[];
  events: LogEntry[];
  fleetSafetyScore: number;
  fleetScoreDelta: number;
  redAlertCount: number;
  notifications: SafetyNotification[];
  dismissNotification: (id: string) => void;
  selectedNotification: SafetyNotification | null;
  openNotification: (n: SafetyNotification) => void;
  closeNotification: () => void;
  vaultRecords: VaultRecord[];
  addVaultRecord: (r: VaultRecord) => void;
  updateVaultRecord: (id: string, updates: Partial<VaultRecord>) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  isMobile: boolean;
  reloadEvents: () => void;
}

const defaultMeta: Metadata = {
  totalVehicles: 0, moving: 0, idle: 0, excessiveIdle: 0,
  stationary: 0, parked: 0, inactive: 0, offline: 0, lastUpdate: '',
};

const FleetContext = createContext<FleetContextType>({} as FleetContextType);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [metadata, setMetadata] = useState<Metadata>(defaultMeta);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [events, setEvents] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<SafetyNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<SafetyNotification | null>(null);
  const [vaultRecords, setVaultRecords] = useState<VaultRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('bpl_vault') || '[]'); } catch { return []; }
  });
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cd-theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const seenEventIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cd-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: 'light' | 'dark') => setThemeState(t), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadMetadata = useCallback(async () => {
    try {
      const res = await authFetch('/api/metadata');
      if (res.ok) setMetadata(await res.json());
    } catch {}
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const res = await authFetch('/api/data');
      if (res.ok) setVehicles(await res.json());
    } catch {}
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const res = await authFetch('/api/events/log');
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        setEvents(data);

        // Surface new safety events as notifications
        const SAFEIQ_LABELS = ['Harsh Braking', 'Harsh Acceleration', 'Overspeeding', 'Overspeed Tiered'];
        const newOnes = data.filter(e => {
          if (!e.eventId || seenEventIds.current.has(e.eventId)) return false;
          const isRelevant = e.type === 'panic' || SAFEIQ_LABELS.includes(e.label || '');
          if (!isRelevant) return false;
          const age = Date.now() - new Date(e.eventTime || e.timestamp).getTime();
          return age < 10 * 60 * 1000; // only events in last 10 min
        });

        if (newOnes.length > 0) {
          newOnes.forEach(e => seenEventIds.current.add(e.eventId));

          // Compute driver stats from the full event set
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const getDriverStats = (driverName: string | undefined) => {
            if (!driverName || driverName === 'N/A') return { incidents: 0, trend: 'stable' as const };
            const driverEvents = data.filter(ev =>
              ev.driverName === driverName &&
              new Date(ev.eventTime || ev.timestamp).getTime() >= thirtyDaysAgo
            );
            const prevEvents = data.filter(ev => {
              const t = new Date(ev.eventTime || ev.timestamp).getTime();
              return ev.driverName === driverName && t >= thirtyDaysAgo - 30 * 24 * 60 * 60 * 1000 && t < thirtyDaysAgo;
            });
            const trend = driverEvents.length < prevEvents.length ? 'improving'
              : driverEvents.length > prevEvents.length ? 'declining' : 'stable';
            return { incidents: driverEvents.length, trend: trend as 'improving' | 'stable' | 'declining' };
          };

          const notifs: SafetyNotification[] = newOnes.map(e => {
            const stats = getDriverStats(e.driverName);
            const scoreBaseline = Math.max(0, Math.min(100, 100 - stats.incidents * 3));
            return {
              id: e.eventId,
              type: e.type === 'panic' ? 'harsh_braking' :
                e.label === 'Overspeeding' || e.label === 'Overspeed Tiered' ? 'speeding' :
                e.label === 'Harsh Acceleration' ? 'harsh_acceleration' : 'harsh_braking',
              magnitude: e.label || 'Panic',
              timestamp: e.eventTime || e.timestamp,
              location: e.address || 'Unknown location',
              driver: {
                id: e.assetId,
                name: e.driverName || 'Unknown Driver',
                safety_score_baseline: scoreBaseline,
                incidents_last_30_days: stats.incidents,
                improvement_trend: stats.trend,
              },
              vehicle: {
                id: e.regNo || e.assetId,
                type: 'truck',
                last_maintenance: 'Check vehicle records',
              },
              environment: {
                weather: 'Lagos conditions',
                traffic_density: 'moderate',
                road_type: 'highway',
              },
              analysis: null,
              analysisLoading: true,
            };
          });

          setNotifications(prev => [...notifs, ...prev].slice(0, 10));

          // Fire Claude analysis for each new notification
          newOnes.forEach(async (e, i) => {
            const stats = getDriverStats(e.driverName);
            const analysis = await generateSafeIQAnalysis(e, stats.incidents, stats.trend);
            setNotifications(prev =>
              prev.map(n => n.id === e.eventId ? { ...n, analysis, analysisLoading: false } : n)
            );
          });
        }
      }
    } catch {}
  }, []);

  const reloadEvents = useCallback(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    loadMetadata();
    loadVehicles();
    loadEvents();
    const metaInterval = setInterval(loadMetadata, 10_000);
    const vehicleInterval = setInterval(loadVehicles, 10_000);
    const eventInterval = setInterval(loadEvents, 15_000);
    return () => {
      clearInterval(metaInterval);
      clearInterval(vehicleInterval);
      clearInterval(eventInterval);
    };
  }, [loadMetadata, loadVehicles, loadEvents]);

  const { score: fleetSafetyScore, delta: fleetScoreDelta } = computeFleetScore(events, vehicles.length);

  const redAlertCount = notifications.filter(n => n.analysis?.severity === 'RED' || n.type === 'harsh_braking').length;

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedNotification(prev => prev?.id === id ? null : prev);
  }, []);

  const openNotification = useCallback((n: SafetyNotification) => setSelectedNotification(n), []);
  const closeNotification = useCallback(() => setSelectedNotification(null), []);

  const addVaultRecord = useCallback((r: VaultRecord) => {
    setVaultRecords(prev => {
      const next = [r, ...prev];
      localStorage.setItem('bpl_vault', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateVaultRecord = useCallback((id: string, updates: Partial<VaultRecord>) => {
    setVaultRecords(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      localStorage.setItem('bpl_vault', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <FleetContext.Provider value={{
      authFetch, metadata, vehicles, events,
      fleetSafetyScore, fleetScoreDelta, redAlertCount,
      notifications, dismissNotification, selectedNotification,
      openNotification, closeNotification,
      vaultRecords, addVaultRecord, updateVaultRecord,
      theme, setTheme, isMobile, reloadEvents,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  return useContext(FleetContext);
}
