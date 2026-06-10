import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Fuel, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { authFetch } from '../context/FleetContext';

type Period = 'day' | 'week' | 'month';
interface FuelEntry  { time: string; level: number }
interface FuelSeries { assetId: string; regNo: string; assetName: string; zone: string; data: FuelEntry[] }

const PERIOD_LABELS: Record<Period, string> = { day: 'Today', week: '7 Days', month: '30 Days' };
const BUCKET_MIN:    Record<Period, number>  = { day: 5, week: 60, month: 1440 };

const ZONE_COLORS: Record<string, string> = {
  'QUARRY EWEKORO':   '#0078D4',
  'QUARRY MFAMOSING': '#16a34a',
  'LH QUARRY':        '#7C3AED',
};

const QUARRY_ZONES = new Set(Object.keys(ZONE_COLORS));
function zoneColor(zone: string) { return ZONE_COLORS[zone?.toUpperCase()] ?? '#6B7A8D'; }

function formatTime(t: string, p: Period) {
  const d = new Date(t);
  if (p === 'day')  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
  if (p === 'week') return d.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
}

function buildSeries(series: FuelSeries, period: Period) {
  const bucketMs = BUCKET_MIN[period] * 60000;
  const buckets = new Map<number, number[]>();
  series.data.forEach(pt => {
    const b = Math.floor(new Date(pt.time).getTime() / bucketMs) * bucketMs;
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)!.push(Math.max(0, pt.level));
  });
  return [...buckets.entries()].sort(([a], [b]) => a - b).map(([t, vals]) => ({
    time: new Date(t).toISOString(),
    level: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
  }));
}

function latestLevel(s: FuelSeries) { return Math.max(0, s.data[s.data.length - 1]?.level ?? 0); }

function trend(s: FuelSeries): 'up' | 'down' | 'flat' {
  if (s.data.length < 4) return 'flat';
  const sorted = [...s.data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const first = sorted.slice(0, 3).reduce((a, b) => a + b.level, 0) / 3;
  const last  = sorted.slice(-3).reduce((a, b) => a + b.level, 0) / 3;
  if (last < first - 2) return 'down';
  if (last > first + 2) return 'up';
  return 'flat';
}

export default function FuelChart() {
  const [period, setPeriod]       = useState<Period>('day');
  const [allSeries, setAllSeries] = useState<FuelSeries[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/fuel/history?period=${p}`);
      if (res.ok) {
        const data: FuelSeries[] = await res.json();
        // clamp negatives
        data.forEach(s => { s.data = s.data.map(pt => ({ ...pt, level: Math.max(0, pt.level) })); });
        setAllSeries(data);
        setLastFetch(new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos' }));
        const quarry = data.filter(s => QUARRY_ZONES.has(s.zone?.toUpperCase()));
        setSelected(prev => prev ?? (quarry[0]?.regNo || null));
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const quarrySeries = allSeries.filter(s => QUARRY_ZONES.has(s.zone?.toUpperCase()));
  const byZone: Record<string, FuelSeries[]> = {};
  quarrySeries.forEach(s => {
    const z = s.zone || 'Unknown'; if (!byZone[z]) byZone[z] = []; byZone[z].push(s);
  });

  const activeSeries = quarrySeries.find(s => s.regNo === selected);
  const chartData    = activeSeries ? buildSeries(activeSeries, period) : [];
  const color        = activeSeries ? zoneColor(activeSeries.zone) : '#0078D4';
  const currentLevel = activeSeries ? latestLevel(activeSeries) : 0;
  const noData = !loading && quarrySeries.length === 0;

  return (
    <div className="bpl-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
      {/* Top bar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Fuel size={16} color="#0078D4" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
            Fuel Level Trends
          </span>
          {lastFetch && <span style={{ fontSize: 11, color: 'var(--cd-text-muted)' }}>· updated {lastFetch}</span>}
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'var(--cd-surface-2)', padding: 3, borderRadius: 8 }}>
          {(['day','week','month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: period === p ? 'var(--cd-surface)' : 'transparent',
              color: period === p ? 'var(--cd-text)' : 'var(--cd-text-muted)',
              boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s',
            }}>{PERIOD_LABELS[p]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', minHeight: 380 }}>
        {/* LEFT — chart */}
        <div style={{ padding: '20px 20px 16px', borderRight: '1px solid var(--cd-border)' }}>
          {noData ? (
            <div style={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Fuel size={36} color="var(--cd-border)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cd-text-muted)' }}>No fuel probe data yet</div>
              <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', textAlign: 'center', maxWidth: 260 }}>
                Data streams in automatically every 5 minutes from MiX when quarry vehicles are active
              </div>
            </div>
          ) : loading ? (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>Loading...</div>
          ) : activeSeries ? (
            <>
              {/* Selected vehicle header */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--cd-font-display)' }}>{activeSeries.regNo}</span>
                  <span style={{ fontSize: 12, color: 'var(--cd-text-muted)', marginLeft: 8 }}>{activeSeries.assetName}</span>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)', lineHeight: 1 }}>
                    {currentLevel.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--cd-text-muted)', marginLeft: 3 }}>L</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cd-text-muted)', marginTop: 2 }}>current level</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fuel-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cd-border)" />
                  <XAxis dataKey="time" tickFormatter={t => formatTime(t, period)} tick={{ fontSize: 11, fill: 'var(--cd-text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={v => `${v}L`} tick={{ fontSize: 11, fill: 'var(--cd-text-muted)' }} tickLine={false} axisLine={false} width={46} />
                  <Tooltip
                    contentStyle={{ background: 'var(--cd-surface)', border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={t => formatTime(t, period)}
                    formatter={(v: any) => [`${parseFloat(v).toFixed(0)}L`, 'Fuel Level']}
                  />
                  <Area type="monotone" dataKey="level" stroke={color} strokeWidth={2} fill="url(#fuel-grad)" dot={false} activeDot={{ r: 4 }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cd-text-muted)', fontSize: 13 }}>
              Select a vehicle from the list
            </div>
          )}
        </div>

        {/* RIGHT — scrollable vehicle list */}
        <div style={{ overflowY: 'auto', maxHeight: 420 }}>
          {Object.entries(byZone).sort(([a],[b]) => a.localeCompare(b)).map(([zone, vehicles]) => (
            <div key={zone}>
              <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: zoneColor(zone), borderBottom: '1px solid var(--cd-border)', position: 'sticky', top: 0, background: 'var(--cd-surface)', zIndex: 1 }}>
                {zone} <span style={{ color: 'var(--cd-text-muted)', fontWeight: 400 }}>· {vehicles.length}</span>
              </div>
              {vehicles.sort((a,b) => a.regNo.localeCompare(b.regNo)).map(s => {
                const level = latestLevel(s);
                const t = trend(s);
                const isSelected = selected === s.regNo;
                return (
                  <button
                    key={s.regNo}
                    onClick={() => setSelected(s.regNo)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isSelected ? `${zoneColor(zone)}12` : 'transparent',
                      borderLeft: isSelected ? `3px solid ${zoneColor(zone)}` : '3px solid transparent',
                      borderBottom: '1px solid var(--cd-border)',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? zoneColor(zone) : 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
                        {s.regNo}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.assetName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cd-text)', fontFamily: 'var(--cd-font-display)' }}>
                        {level.toFixed(0)}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--cd-text-muted)' }}>L</span>
                      </div>
                      <div style={{ marginTop: 1 }}>
                        {t === 'down' && <TrendingDown size={11} color="#CC0000" />}
                        {t === 'up'   && <TrendingUp   size={11} color="#16a34a" />}
                        {t === 'flat' && <Minus        size={11} color="var(--cd-text-muted)" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
