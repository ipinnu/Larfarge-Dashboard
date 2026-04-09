import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  assetId: string;
  regNo?: string;
  assetName?: string;
  transporter?: string;
  driverName?: string;
  driverPhone?: string;
  address?: string;
  eventId: string;
  label?: string;
  eventTime: string;
  type: 'panic' | 'warning';
  rawEvent?: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isMobile: boolean;
}

type DateRange = 'today' | '7days' | '30days' | 'alltime' | 'custom';

const EVENT_FILTERS = ['All', 'Panic', 'Harsh Braking', 'Harsh Acceleration', 'Overspeeding', 'Overspeed Tiered', 'Harsh Cornering'];
const HIDDEN_LABELS = ['Possible Power Tamper', 'Battery Disconnection', 'Battery Disconnected', 'Front Panel Tamper', 'Back Panel Tamper', 'No Blue Key'];

export default function EventLogPanel({ open, onClose, authFetch, isMobile }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/events/log');
        if (res.ok) {
          const data = await res.json();
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const getDateFilter = (entry: LogEntry): boolean => {
    const ts = new Date(entry.timestamp).getTime();
    const now = Date.now();
    if (dateRange === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return ts >= start.getTime();
    }
    if (dateRange === '7days') return ts >= now - 7 * 24 * 60 * 60 * 1000;
    if (dateRange === '30days') return ts >= now - 30 * 24 * 60 * 60 * 1000;
    if (dateRange === 'custom' && fromDate && toDate) {
      const from = new Date(fromDate).getTime();
      const to = new Date(toDate).getTime() + 86400000;
      return ts >= from && ts <= to;
    }
    return true;
  };

  const filtered = entries.filter(e => {
    const label = e.label || 'Panic';
    if (HIDDEN_LABELS.includes(label)) return false;
    const matchesFilter = activeFilter === 'All' || label === activeFilter || (activeFilter === 'Panic' && e.type === 'panic');
    const matchesSearch = searchTerm === '' ||
      (e.regNo && e.regNo !== 'N/A' && e.regNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.assetName && e.assetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.assetId && e.assetId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch && getDateFilter(e);
  });

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const panelStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', inset: 0, zIndex: 1001,
    backgroundColor: 'var(--cd-surface)',
    display: 'flex', flexDirection: 'column',
  } : {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: expanded ? '640px' : '380px',
    zIndex: 1001,
    backgroundColor: 'var(--cd-surface)',
    borderLeft: '1px solid var(--cd-border)',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.2s ease',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000 }} />

      <div style={panelStyle}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--cd-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cd-text)' }}>Event Log</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isMobile && (
              <button
                onClick={() => setExpanded(prev => !prev)}
                title={expanded ? 'Collapse panel' : 'Expand panel'}
                style={{ background: 'none', border: '0.5px solid var(--cd-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--cd-text-muted)', padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {expanded ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    Expand
                  </>
                )}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cd-text-muted)', padding: '4px' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--cd-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: dateRange === 'custom' ? '8px' : '0' }}>
            {(['today', '7days', '30days', 'alltime', 'custom'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  padding: '4px 10px', borderRadius: '9999px', fontSize: '11px',
                  fontWeight: dateRange === r ? '500' : '400', cursor: 'pointer',
                  border: dateRange === r ? '0.5px solid var(--cd-accent-2)' : '0.5px solid var(--cd-border)',
                  background: dateRange === r ? '#eff6ff' : 'var(--cd-surface-2)',
                  color: dateRange === r ? '#2563eb' : 'var(--cd-text-muted)',
                }}
              >
                {r === 'today' ? 'Today' : r === '7days' ? '7 days' : r === '30days' ? '30 days' : r === 'alltime' ? 'All time' : 'Custom'}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--cd-text-muted)', display: 'block', marginBottom: '3px' }}>From</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--cd-border)', borderRadius: '8px', fontSize: '12px', backgroundColor: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--cd-text-muted)', display: 'block', marginBottom: '3px' }}>To</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--cd-border)', borderRadius: '8px', fontSize: '12px', backgroundColor: 'var(--cd-surface-2)', color: 'var(--cd-text)', outline: 'none' }} />
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--cd-border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--cd-text-soft)' }} />
            <input
              type="text"
              placeholder="Search reg no or asset name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', border: '1px solid var(--cd-border)', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: 'var(--cd-surface-2)', color: 'var(--cd-text)' }}
            />
          </div>
        </div>

        {/* Event Type Filters */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--cd-border)', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
          {EVENT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: '9999px', fontSize: '11px',
                fontWeight: '500', cursor: 'pointer',
                border: activeFilter === f
                  ? f === 'Panic' ? '0.5px solid #fecdd3' : '0.5px solid #fde68a'
                  : '0.5px solid var(--cd-border)',
                background: activeFilter === f
                  ? f === 'Panic' ? '#fff1f2' : '#fef3c7'
                  : 'var(--cd-surface-2)',
                color: activeFilter === f
                  ? f === 'Panic' ? '#c8102e' : '#854F0B'
                  : 'var(--cd-text-muted)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading && entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--cd-text-muted)', fontSize: '13px' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--cd-text-muted)', fontSize: '13px' }}>No events found</div>
          ) : filtered.map((entry, i) => {
            const isPanic = entry.type === 'panic';
            const label = entry.label || 'Panic';
            const address = entry.address && entry.address !== 'null'
              ? entry.address
              : entry.rawEvent?.Position?.FormattedAddress || '';
            const displayName = entry.regNo && entry.regNo !== 'N/A' ? entry.regNo : entry.assetId;
            const hasDriver = entry.driverName && entry.driverName !== 'N/A' && entry.driverName !== 'No Driver Assigned';
            return (
              <div
                key={`${entry.eventId}-${i}`}
                style={{
                  padding: '10px 12px', borderRadius: '8px',
                  border: `0.5px solid ${isPanic ? '#fecdd3' : '#fde68a'}`,
                  backgroundColor: isPanic ? '#fff1f2' : '#fffbeb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: isPanic ? '#c8102e' : '#854F0B' }}>
                    {isPanic ? '🚨' : '⚠'} {label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--cd-text-soft)' }}>{formatTime(entry.timestamp)}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--cd-text)', marginBottom: '2px' }}>
                  {displayName}
                </div>
                {entry.assetName && entry.assetName !== 'Unknown Vehicle' && (
                  <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', marginBottom: '2px' }}>
                    {entry.assetName}
                  </div>
                )}
                {entry.transporter && entry.transporter !== 'N/A' && (
                  <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', marginBottom: '2px' }}>
                    {entry.transporter}
                  </div>
                )}
                {hasDriver && (
                  <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)', marginBottom: address ? '2px' : '0' }}>
                    👤 {entry.driverName}{entry.driverPhone && entry.driverPhone !== 'N/A' ? ` · ${entry.driverPhone}` : ''}
                  </div>
                )}
                {address && (
                  <div style={{ fontSize: '11px', color: 'var(--cd-text-muted)' }}>{address}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--cd-border)', fontSize: '11px', color: 'var(--cd-text-muted)', textAlign: 'center', flexShrink: 0 }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''} • auto-refreshes every 10s
        </div>
      </div>
    </>
  );
}