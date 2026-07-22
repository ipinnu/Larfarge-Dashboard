import type { CSSProperties, MouseEvent } from 'react';
import { Info } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
  size?: number;
  style?: CSSProperties;
}

/** Small (i) icon with native tooltip; stops click so parent buttons still work. */
export default function InfoTip({ text, label, size = 12, style }: Props) {
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span
      role="img"
      title={text}
      aria-label={label ? `${label}: ${text}` : text}
      onClick={stop}
      onMouseDown={stop}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        color: 'var(--cd-text-muted)',
        cursor: 'help',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      <Info size={size} strokeWidth={2.25} />
    </span>
  );
}
