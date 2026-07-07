import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFleet } from '../../context/FleetContext';
import PeriodSelect, { type PeriodValue } from './PeriodSelect';

type FuelPeriod = PeriodValue;

function defaultCustomRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function buildSeries(period: FuelPeriod, customFrom: string, customTo: string) {
  if (period === 'day') {
    return Array.from({ length: 12 }, (_, i) => ({
      label: `${i * 2}:00`,
      liters: 18 + Math.round(Math.sin(i) * 8 + i * 2),
    }));
  }
  if (period === 'week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
      label: day,
      liters: 120 + Math.round(Math.sin(i) * 40 + i * 18),
    }));
  }
  if (period === 'month') {
    return Array.from({ length: 30 }, (_, i) => ({
      label: `${i + 1}`,
      liters: 90 + Math.round(Math.sin(i / 3) * 30 + (i % 5) * 8),
    }));
  }
  const from = new Date(customFrom);
  const to = new Date(customTo);
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  return Array.from({ length: Math.min(days, 31) }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      liters: 80 + Math.round(Math.sin(i) * 25 + i * 6),
    };
  });
}

export default function FuelChartWidget() {
  const { fuelSeries } = useFleet();
  const [period, setPeriod] = useState<FuelPeriod>('week');
  const [customRange, setCustomRange] = useState(defaultCustomRange);

  const chartData = useMemo(() => {
    if (period === 'week') {
      return fuelSeries.map(d => ({ label: d.day, liters: d.liters }));
    }
    return buildSeries(period, customRange.from, customRange.to);
  }, [period, customRange, fuelSeries]);

  const total = chartData.reduce((s, d) => s + d.liters, 0);

  return (
    <div className="bpl-card bpl-home-mid-panel bpl-fuel-widget-card">
      <div className="bpl-card-header">
        <span className="bpl-card-title">Fuel Consumption</span>
        <Link to="/fuel/consumption" className="bpl-card-link">See all</Link>
      </div>
      <div className="bpl-card-body bpl-fuel-widget-body">
        {period === 'custom' && (
          <div className="bpl-fuel-custom-row">
            <input type="date" value={customRange.from} max={customRange.to} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))} />
            <span>to</span>
            <input type="date" value={customRange.to} min={customRange.from} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))} />
          </div>
        )}

        <div className="bpl-fuel-summary">
          <div className="bpl-fuel-summary-meta">
            <div className="bpl-fuel-period-label">
              <PeriodSelect value={period} onChange={setPeriod} includeCustom />
            </div>
            <div className="bpl-fuel-total">{total.toLocaleString()} L</div>
            <div className="bpl-fuel-total-scope">Fleet total</div>
          </div>
        </div>

        <div className="bpl-fuel-chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0078D4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0078D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--cd-text-muted)' }} axisLine={false} tickLine={false} interval={period === 'month' ? 4 : period === 'day' ? 2 : 0} />
              <YAxis tickFormatter={v => `${v}L`} tick={{ fontSize: 10, fill: 'var(--cd-text-muted)' }} tickLine={false} axisLine={false} width={40} allowDecimals={false} tickCount={5} />
              <Tooltip
                contentStyle={{ background: 'var(--cd-surface)', border: '1px solid var(--cd-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`${value.toLocaleString()} L`, 'Consumption']}
              />
              <Area type="monotone" dataKey="liters" stroke="#0078D4" fill="url(#fuelGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
