import React from 'react';
import { ParsedMessage } from '../types';
import { X, MessageSquare, Clock, User, Hash, FileCode } from 'lucide-react';

interface CitationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citedMessageIds: string[];
  citedMessages: Record<string, ParsedMessage>;
  allMessages?: ParsedMessage[];
  onScrollToMessage?: (msgId: string) => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  isOpen,
  onClose,
  citedMessageIds,
  citedMessages,
  allMessages = [],
  onScrollToMessage,
}) => {
  if (!isOpen) return null;

  // Resolve messages in cited list
  const messagesToDisplay: ParsedMessage[] = [];
  const messageMap = new Map<string, ParsedMessage>();

  // Prefer from allMessages if present, else citedMessages
  for (const m of allMessages) {
    messageMap.set(m.id, m);
  }
  for (const [id, m] of Object.entries(citedMessages)) {
    if (!messageMap.has(id)) {
      messageMap.set(id, m);
    }
  }

  for (const id of citedMessageIds) {
    const msg = messageMap.get(id);
    if (msg) {
      messagesToDisplay.push(msg);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: '16px 0 0 16px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: 'none',
          animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <MessageSquare size={18} color="var(--accent-electric)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Source Evidence</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {citedMessageIds.length} original {citedMessageIds.length === 1 ? 'message' : 'messages'} cited
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messagesToDisplay.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No original message data found for cited ID(s): {citedMessageIds.join(', ')}</p>
            </div>
          ) : (
            messagesToDisplay.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.6rem',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--accent-electric)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      #{msg.id}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {msg.sender}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {msg.timestamp}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FileCode size={12} />
                      Line {msg.raw_line_number}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: msg.content.includes('\n') ? 'var(--font-sans)' : 'inherit',
                  }}
                >
                  {msg.content}
                </div>

                {onScrollToMessage && allMessages.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        onScrollToMessage(msg.id);
                        onClose();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-electric)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: '0.2rem 0',
                        textDecoration: 'underline',
                      }}
                    >
                      View in full transcript →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
