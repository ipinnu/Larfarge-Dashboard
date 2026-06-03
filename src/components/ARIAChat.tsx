import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are ARIA — Asset and Risk Intelligence Advisor — the embedded fleet intelligence system for a logistics fleet management platform operated by Best Practices Limited (BPL).

You have access to real-time fleet data, driver safety records, incident history, Safety Vault records, and operational metrics. You answer questions from fleet managers, safety officers, operations managers, and executives.

Your tone is professional, direct, and concise. You do not give vague answers. You reference specific data, specific drivers, specific incidents, and specific standards (FMCSA BASICs, Nigeria FRSC guidelines, ISO 39001) when relevant.

You are not a chatbot. You are a senior fleet safety advisor embedded in the platform. Every answer should feel like it came from someone who knows this fleet intimately.

When you flag a risk, cite the standard. When you make a recommendation, make it specific and actionable. When you summarize performance, use numbers.

Never say "I don't have access to that information" — if data is not in context, say "that data is not available in the current view — check [relevant section] for full detail."`;

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/drivers': 'Driver Management',
  '/incidents': 'Incident Intelligence',
  '/vault': 'Safety Vault',
  '/aria': 'ARIA Intelligence',
  '/reports': 'Reports & Reviews',
  '/operations': 'Operations',
  '/settings': 'Settings',
};

const SUGGESTED_PROMPTS = [
  'Which driver needs attention most urgently right now?',
  'What are the top safety risks this week?',
  'Summarise current fleet status.',
  'What actions should I take today?',
];

export default function ARIAChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const { fleetSafetyScore, redAlertCount, vaultRecords, metadata, events } = useFleet();

  const currentPage = PAGE_LABELS[location.pathname] || location.pathname;
  const watTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos', hour12: false });
  const openInvestigations = vaultRecords.filter(r => r.status !== 'resolved').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const buildContext = () => {
    const recentEvents = events.slice(0, 20).map(e =>
      `${e.eventTime ? new Date(e.eventTime).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' }) : 'unknown'} | ${e.label || 'Panic'} | Driver: ${e.driverName || 'Unknown'} | Vehicle: ${e.regNo || e.assetId} | ${e.address || 'No location'}`
    ).join('\n');

    return `Current platform state:
- Fleet safety score: ${fleetSafetyScore}/100
- Active red alerts: ${redAlertCount}
- Open Safety Vault investigations: ${openInvestigations}
- Vehicles currently active (moving): ${metadata.moving}
- Total fleet size: ${metadata.totalVehicles}
- Vehicles parked: ${metadata.parked}
- Vehicles offline: ${metadata.offline}
- User role: Fleet Safety Officer
- Current page: ${currentPage}
- Date/time: ${watTime} (Lagos, WAT)

Recent events (last 20):
${recentEvents || 'No recent events loaded'}`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamingContent('');

    const contextMsg: Message = {
      role: 'user',
      content: `${buildContext()}\n\n---\n\nUser question: ${text.trim()}`,
    };

    const history = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

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
          system: SYSTEM_PROMPT,
          stream: true,
          messages: [
            ...history,
            contextMsg,
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `ARIA encountered an error: ${err || res.statusText}. Please check your API key configuration.`,
        }]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      let fullContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text;
              setStreamingContent(fullContent);
            }
          } catch {}
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
      setStreamingContent('');
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to reach ARIA at this moment. Check network connectivity and API configuration.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <>
      {/* FAB */}
      <button
        className="bpl-aria-fab"
        onClick={() => setOpen(o => !o)}
        title="Open ARIA"
        style={{ bottom: open ? 'calc(100vh - 40px)' : 28 }}
      >
        {open ? <ChevronDown size={22} /> : <Brain size={22} />}
      </button>

      {/* Drawer */}
      <div className={`bpl-aria-drawer${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="bpl-aria-drawer-header">
          <div className="bpl-aria-drawer-title">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(0,120,212,0.3)',
              border: '1px solid rgba(0,120,212,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={16} color="#60b4ff" />
            </div>
            <div>
              <div className="bpl-aria-name">ARIA</div>
              <div className="bpl-aria-tagline">Asset & Risk Intelligence Advisor</div>
            </div>
          </div>
          <button className="bpl-aria-close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Context strip */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--cd-surface-2)',
          borderBottom: '1px solid var(--cd-border)',
          display: 'flex',
          gap: 12,
          fontSize: 11,
          color: 'var(--cd-text-muted)',
        }}>
          <span>Score: <strong style={{ color: fleetSafetyScore >= 80 ? '#16a34a' : fleetSafetyScore >= 60 ? '#d97706' : '#CC0000' }}>{fleetSafetyScore}/100</strong></span>
          <span>Active: <strong style={{ color: 'var(--cd-text)' }}>{metadata.moving}</strong></span>
          {redAlertCount > 0 && <span style={{ color: '#CC0000' }}>Red Alerts: <strong>{redAlertCount}</strong></span>}
          <span style={{ marginLeft: 'auto' }}>{currentPage}</span>
        </div>

        {/* Messages */}
        <div className="bpl-aria-messages">
          {messages.length === 0 && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--bpl-blue-soft)',
                  border: '1px solid rgba(0,120,212,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <Brain size={22} color="var(--bpl-blue)" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text)', marginBottom: 4, fontFamily: 'var(--cd-font-display)' }}>
                  ARIA is ready
                </div>
                <div style={{ fontSize: 12, color: 'var(--cd-text-muted)', lineHeight: 1.5 }}>
                  Ask me anything about the fleet — drivers, incidents, safety, compliance.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    style={{
                      padding: '9px 12px', textAlign: 'left',
                      background: 'var(--cd-surface-2)',
                      border: '1px solid var(--cd-border)',
                      borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, color: 'var(--cd-text)',
                      fontFamily: 'var(--cd-font-body)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bpl-blue-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--cd-surface-2)')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`bpl-aria-msg bpl-aria-msg-${msg.role}`}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginBottom: 3, fontWeight: 600 }}>ARIA</div>
              )}
              <div className={`bpl-aria-bubble bpl-aria-bubble-${msg.role}`}>
                {msg.content.split('\n').map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && streamingContent && (
            <div className="bpl-aria-msg bpl-aria-msg-aria">
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginBottom: 3, fontWeight: 600 }}>ARIA</div>
              <div className="bpl-aria-bubble bpl-aria-bubble-aria">
                {streamingContent.split('\n').map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < streamingContent.split('\n').length - 1 && <br />}
                  </span>
                ))}
                <span style={{ display: 'inline-block', width: 8, height: 12, background: 'var(--bpl-blue)', borderRadius: 2, marginLeft: 2, animation: 'aria-typing 0.8s ease infinite' }} />
              </div>
            </div>
          )}

          {loading && !streamingContent && (
            <div className="bpl-aria-msg bpl-aria-msg-aria">
              <div style={{ fontSize: 10, color: 'var(--cd-text-muted)', marginBottom: 3, fontWeight: 600 }}>ARIA</div>
              <div className="bpl-aria-bubble bpl-aria-bubble-aria bpl-aria-bubble-typing">
                <div className="bpl-aria-typing-dot" />
                <div className="bpl-aria-typing-dot" />
                <div className="bpl-aria-typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bpl-aria-input-area">
          <textarea
            ref={textareaRef}
            className="bpl-aria-input"
            placeholder="Ask ARIA anything about the fleet..."
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: 40 }}
          />
          <button
            className="bpl-aria-send"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
