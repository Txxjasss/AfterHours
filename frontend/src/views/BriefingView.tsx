import React, { useState } from 'react';
import { BriefingResponse, ParsedMessage } from '../types';
import { toggleActionItem } from '../api/client';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  User,
  HelpCircle,
  Share2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CitationDrawer } from '../components/CitationDrawer';

interface BriefingViewProps {
  briefing: BriefingResponse;
  conversationTitle?: string;
  onBack: () => void;
  onViewOriginalChat: () => void;
  allMessages?: ParsedMessage[];
  onScrollToMessage?: (msgId: string) => void;
}

export const BriefingView: React.FC<BriefingViewProps> = ({
  briefing,
  conversationTitle,
  onBack,
  onViewOriginalChat,
  allMessages = [],
  onScrollToMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'updates' | 'decisions' | 'tasks' | 'questions'>('all');
  const [actionItems, setActionItems] = useState(briefing.action_items);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Toggle completion
  const handleToggleTask = async (itemId: string) => {
    // Optimistic update
    setActionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    );

    try {
      const res = await toggleActionItem(itemId);
      setActionItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, completed: res.completed } : item))
      );
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert optimistic update
      setActionItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
      );
    }
  };

  const handleOpenCitations = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setSelectedCitationIds(ids);
    setIsCitationDrawerOpen(true);
  };

  const completedCount = actionItems.filter((i) => i.completed).length;
  const totalTasks = actionItems.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Top Bar Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onViewOriginalChat}>
            <Layers size={16} />
            <span>View Full Transcript ({allMessages.length > 0 ? allMessages.length : 'Chat'})</span>
          </button>
        </div>
      </div>

      {/* Briefing Header Hero Card */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.9) 0%, rgba(13, 18, 28, 0.8) 100%)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '2rem',
          position: 'relative',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-electric)',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <Sparkles size={13} />
            Executive Briefing
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            Model: {briefing.model_used}
          </span>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Generated {new Date(briefing.created_at).toLocaleString()}
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: '0.75rem',
          }}
        >
          {conversationTitle ? `Briefing: ${conversationTitle}` : 'Executive Conversation Briefing'}
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#cbd5e1',
            lineHeight: 1.65,
            maxWidth: '900px',
          }}
        >
          {briefing.executive_summary}
        </p>

        {/* Task progress bar if there are tasks */}
        {totalTasks > 0 && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Action Items Progress:
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-electric)', fontWeight: 600 }}>
                {completedCount} of {totalTasks} completed ({progressPercent}%)
              </span>
            </div>

            <div
              style={{
                width: '200px',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'all' ? 'var(--accent-electric)' : 'var(--text-secondary)',
          }}
        >
          All Sections
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'updates' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'updates' ? 'var(--accent-electric)' : 'var(--text-secondary)',
          }}
        >
          Important Updates ({briefing.updates.length})
        </button>
        <button
          onClick={() => setActiveTab('decisions')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'decisions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'decisions' ? 'var(--accent-electric)' : 'var(--text-secondary)',
          }}
        >
          Decisions Made ({briefing.decisions.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'tasks' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'tasks' ? 'var(--accent-electric)' : 'var(--text-secondary)',
          }}
        >
          Action Items ({actionItems.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'questions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'questions' ? 'var(--accent-electric)' : 'var(--text-secondary)',
          }}
        >
          Unanswered Questions ({briefing.questions.length})
        </button>
      </div>

      {/* Grid of Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 1. Important Updates */}
        {(activeTab === 'all' || activeTab === 'updates') && (
          <section>
            <div className="section-heading">
              <span style={{ color: 'var(--accent-electric)' }}>📌</span>
              <span>Important Updates</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({briefing.updates.length})
              </span>
            </div>

            {briefing.updates.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                No explicit status updates extracted from this conversation.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {briefing.updates.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: 'var(--accent-electric)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {u.category}
                      </span>
                      <p style={{ fontSize: '0.92rem', color: '#f1f5f9', lineHeight: 1.6 }}>{u.text}</p>
                    </div>

                    {u.source_message_ids && u.source_message_ids.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Source:</span>
                        {u.source_message_ids.map((id) => (
                          <button
                            key={id}
                            className="citation-pill"
                            onClick={() => handleOpenCitations([id])}
                            title="Click to view original message context"
                          >
                            #{id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. Decisions Made */}
        {(activeTab === 'all' || activeTab === 'decisions') && (
          <section>
            <div className="section-heading">
              <span style={{ color: '#fbbf24' }}>⚖️</span>
              <span>Decisions Made</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({briefing.decisions.length})
              </span>
            </div>

            {briefing.decisions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                No explicit architectural or strategic decisions recorded in this conversation.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {briefing.decisions.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem', lineHeight: 1.5 }}>
                        {d.decision}
                      </h4>
                      {d.context && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          {d.context}
                        </p>
                      )}
                    </div>

                    {d.source_message_ids && d.source_message_ids.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Source:</span>
                        {d.source_message_ids.map((id) => (
                          <button
                            key={id}
                            className="citation-pill"
                            onClick={() => handleOpenCitations([id])}
                            title="Click to view original message context"
                          >
                            #{id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Action Items */}
        {(activeTab === 'all' || activeTab === 'tasks') && (
          <section>
            <div className="section-heading">
              <span style={{ color: '#34d399' }}>✅</span>
              <span>Action Items & Tasks</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({actionItems.length})
              </span>
            </div>

            {actionItems.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                No explicit action items assigned in this conversation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: item.completed ? 'rgba(18, 24, 38, 0.5)' : 'var(--bg-card)',
                      border: `1px solid ${item.completed ? 'rgba(255, 255, 255, 0.05)' : 'var(--border-card)'}`,
                      borderRadius: '10px',
                      padding: '0.9rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1 }}>
                      <button
                        onClick={() => handleToggleTask(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.completed ? '#10b981' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0,
                        }}
                        title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {item.completed ? (
                          <CheckCircle2 size={22} color="#10b981" />
                        ) : (
                          <Circle size={22} color="var(--text-muted)" />
                        )}
                      </button>

                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: '0.92rem',
                            color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            lineHeight: 1.5,
                          }}
                        >
                          {item.task}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          {item.assignee ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                color: 'var(--accent-electric)',
                                background: 'rgba(56, 189, 248, 0.08)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(56, 189, 248, 0.15)',
                              }}
                            >
                              <User size={12} />
                              {item.assignee}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Unassigned</span>
                          )}

                          {item.deadline && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                color: '#fbbf24',
                                background: 'rgba(245, 158, 11, 0.08)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.15)',
                              }}
                            >
                              <Clock size={12} />
                              {item.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.source_message_ids && item.source_message_ids.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {item.source_message_ids.map((id) => (
                          <button
                            key={id}
                            className="citation-pill"
                            onClick={() => handleOpenCitations([id])}
                            title="Click to view original message context"
                          >
                            #{id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. Unanswered Questions */}
        {(activeTab === 'all' || activeTab === 'questions') && (
          <section>
            <div className="section-heading">
              <span style={{ color: '#a78bfa' }}>❓</span>
              <span>Unanswered Questions</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({briefing.questions.length})
              </span>
            </div>

            {briefing.questions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                All questions asked during the conversation were resolved or none were left open.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {briefing.questions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(167, 139, 250, 0.2)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <HelpCircle size={15} color="#a78bfa" />
                        <span style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600 }}>
                          Asked by {q.asker || 'Participant'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.92rem', color: '#f1f5f9', lineHeight: 1.6 }}>{q.question}</p>
                    </div>

                    {q.source_message_ids && q.source_message_ids.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Source:</span>
                        {q.source_message_ids.map((id) => (
                          <button
                            key={id}
                            className="citation-pill"
                            onClick={() => handleOpenCitations([id])}
                            title="Click to view original message context"
                          >
                            #{id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Citation Slide-Over Drawer */}
      <CitationDrawer
        isOpen={isCitationDrawerOpen}
        onClose={() => setIsCitationDrawerOpen(false)}
        citedMessageIds={selectedCitationIds}
        citedMessages={briefing.cited_messages}
        allMessages={allMessages}
        onScrollToMessage={onScrollToMessage}
      />
    </div>
  );
};
