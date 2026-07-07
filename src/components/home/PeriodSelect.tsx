export type PeriodValue = 'day' | 'week' | 'month' | 'custom';

const PERIOD_LABELS: Record<Exclude<PeriodValue, 'custom'>, string> = {
  day: 'Today',
  week: '7 Days',
  month: '30 Days',
};

interface Props {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  includeCustom?: boolean;
  className?: string;
  'aria-label'?: string;
}

export default function PeriodSelect({
  value,
  onChange,
  includeCustom = false,
  className = 'bpl-status-period-select',
  'aria-label': ariaLabel = 'Time period',
}: Props) {
  return (
    <select
      className={className}
      value={value}
      onChange={e => onChange(e.target.value as PeriodValue)}
      onClick={e => e.stopPropagation()}
      aria-label={ariaLabel}
    >
      {(Object.keys(PERIOD_LABELS) as Array<Exclude<PeriodValue, 'custom'>>).map(p => (
        <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
      ))}
      {includeCustom && <option value="custom">Custom</option>}
    </select>
  );
}

export { PERIOD_LABELS };
