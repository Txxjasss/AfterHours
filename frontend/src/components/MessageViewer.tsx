import React, { useState, useMemo } from 'react';
import { ConversationDetail, ParsedMessage } from '../types';
import { Search, Filter, Sparkles, MessageSquare, ArrowLeft, Clock, Calendar, FileText, ChevronRight } from 'lucide-react';

interface MessageViewerProps {
  conversation: ConversationDetail;
  onGenerateBriefing: () => void;
  onBack: () => void;
  onViewBriefing?: (briefingId: string) => void;
  isGenerating: boolean;
  highlightedMessageId?: string | null;
}

// Generate consistent avatar color based on sender name
const getAvatarColor = (name: string) => {
  const colors = [
    '#38bdf8', // electric blue
    '#818cf8', // indigo
    '#34d399', // emerald
    '#f472b6', // pink
    '#fbbf24', // amber
    '#a78bfa', // purple
    '#22d3ee', // cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const MessageViewer: React.FC<MessageViewerProps> = ({
  conversation,
  onGenerateBriefing,
  onBack,
  onViewBriefing,
  isGenerating,
  highlightedMessageId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSender, setSelectedSender] = useState<string>('ALL');

  // Extract unique senders
  const senders = useMemo(() => {
    const s = new Set<string>();
    for (const msg of conversation.messages) {
      if (msg.sender) s.add(msg.sender);
    }
    return Array.from(s).sort();
  }, [conversation.messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return conversation.messages.filter((msg) => {
      const matchesSender = selectedSender === 'ALL' || msg.sender === selectedSender;
      const matchesSearch =
        searchQuery === '' ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSender && matchesSearch;
    });
  }, [conversation.messages, selectedSender, searchQuery]);

  return (
    <div>
      {/* Top action / navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {conversation.briefings && conversation.briefings.length > 0 && onViewBriefing && (
            <button
              className="btn-secondary"
              onClick={() => onViewBriefing(conversation.briefings[0].id)}
            >
              <FileText size={16} color="var(--accent-electric)" />
              <span>View Latest Briefing ({conversation.briefings.length})</span>
            </button>
          )}

          <button
            className="btn-primary"
            onClick={onGenerateBriefing}
            disabled={isGenerating}
          >
            <Sparkles size={16} className={isGenerating ? 'pulse-glow' : ''} />
            <span>{isGenerating ? 'Analyzing with Qwen2.5 3B...' : 'Generate AI Briefing'}</span>
          </button>
        </div>
      </div>

      {/* Conversation Info Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--accent-electric)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}
            >
              {conversation.filename}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Imported {new Date(conversation.created_at).toLocaleString()}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {conversation.title}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-electric)' }}>
              {conversation.messages.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Parsed Messages</div>
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
              {senders.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Participants</div>
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
              {conversation.briefings ? conversation.briefings.length : 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Briefings</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search messages, senders, or message IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
          />
        </div>

        {/* Sender filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setSelectedSender('ALL')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid',
              background: selectedSender === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
              borderColor: selectedSender === 'ALL' ? 'var(--accent-electric)' : 'var(--border-subtle)',
              color: selectedSender === 'ALL' ? 'var(--accent-electric)' : 'var(--text-secondary)',
            }}
          >
            All ({conversation.messages.length})
          </button>
          {senders.map((sender) => (
            <button
              key={sender}
              onClick={() => setSelectedSender(sender)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                whiteSpace: 'nowrap',
                background: selectedSender === sender ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                borderColor: selectedSender === sender ? 'var(--accent-electric)' : 'var(--border-subtle)',
                color: selectedSender === sender ? 'var(--accent-electric)' : 'var(--text-secondary)',
              }}
            >
              {sender}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredMessages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No messages match your filter</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Try adjusting your search query or selecting 'All' senders.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isHighlighted = highlightedMessageId === msg.id;
            const avatarColor = getAvatarColor(msg.sender);

            return (
              <div
                key={msg.id}
                id={`msg-node-${msg.id}`}
                style={{
                  background: isHighlighted ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-card)',
                  border: `1px solid ${isHighlighted ? 'var(--accent-electric)' : 'var(--border-subtle)'}`,
                  borderRadius: '10px',
                  padding: '0.9rem 1.15rem',
                  transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {/* Deterministic sender avatar */}
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: `${avatarColor}20`,
                        border: `1px solid ${avatarColor}50`,
                        color: avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {msg.sender.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {msg.sender}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      #{msg.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} />
                      {msg.timestamp}
                    </span>
                    <span>Line {msg.raw_line_number}</span>
                  </div>
                </div>

                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    paddingLeft: '2.1rem',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
