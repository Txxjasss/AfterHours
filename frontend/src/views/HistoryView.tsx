import React, { useEffect, useState } from 'react';
import { BriefingHistoryItem } from '../types';
import { fetchBriefingsHistory } from '../api/client';
import { History, FileText, CheckCircle2, Calendar, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';

interface HistoryViewProps {
  onSelectBriefing: (briefingId: string, convId: string) => void;
  onImportClick: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectBriefing, onImportClick }) => {
  const [history, setHistory] = useState<BriefingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchBriefingsHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load briefings history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>
            Saved Briefings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Browse and review your past executive intelligence summaries and task statuses.
          </p>
        </div>

        <button className="btn-primary" onClick={onImportClick}>
          <Sparkles size={16} />
          <span>New Briefing</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="pulse-glow" style={{ fontSize: '1rem' }}>Loading briefing records...</div>
        </div>
      ) : history.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <History size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
            No briefings generated yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Import a chat export or try one of our realistic sample conversations to generate your first AI briefing.
          </p>
          <button className="btn-primary" onClick={onImportClick}>
            <span>Import Your First Chat</span>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((item) => {
            const hasTasks = item.total_tasks > 0;
            const taskPct = hasTasks ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectBriefing(item.id, item.conversation_id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-electric)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--accent-electric)',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                      }}
                    >
                      {item.conversation_filename}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      • {item.model_used}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.45rem' }}>
                    {item.conversation_title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.executive_summary}
                  </p>
                </div>

                {/* Right side stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                  {hasTasks ? (
                    <div style={{ textAlign: 'right', minWidth: '130px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.completed_tasks === item.total_tasks ? '#10b981' : 'var(--text-primary)', marginBottom: '0.3rem' }}>
                        {item.completed_tasks} / {item.total_tasks} Tasks
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${taskPct}%`,
                            height: '100%',
                            background: item.completed_tasks === item.total_tasks ? '#10b981' : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No open tasks
                    </div>
                  )}

                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
