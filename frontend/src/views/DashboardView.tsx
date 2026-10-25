import React from 'react';
import { ConversationSummary, SampleChat } from '../types';
import {
  Sparkles,
  Upload,
  MessageSquare,
  FileText,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  conversations: ConversationSummary[];
  samples: SampleChat[];
  onOpenConversation: (id: string) => void;
  onImportClick: () => void;
  onLoadSample: (sampleId: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  conversations,
  samples,
  onOpenConversation,
  onImportClick,
  onLoadSample,
  onDeleteConversation,
  isLoading,
}) => {
  const totalMessages = conversations.reduce((acc, c) => acc + c.message_count, 0);
  const totalBriefings = conversations.reduce((acc, c) => acc + c.briefing_count, 0);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-tag">
          <Cpu size={14} />
          <span>Local-First Private Intelligence</span>
        </div>
        <h1 className="hero-title">
          Your conversations. <br />
          <span>One useful briefing.</span>
        </h1>
        <p className="hero-subtitle">
          Catch up on group chats, incident postmortems, and sprint channels without reading hundreds of messages.
          All parsing and AI analysis runs 100% locally on your machine with Qwen2.5 3B.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={onImportClick}>
            <Upload size={17} />
            <span>Import Chat Export</span>
          </button>
          <button className="btn-secondary" onClick={() => samples.length > 0 && onLoadSample(samples[0].id)}>
            <Sparkles size={17} color="var(--accent-electric)" />
            <span>Try Incident Postmortem Sample</span>
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="stat-label">Conversations</div>
            <div className="stat-value">{conversations.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="stat-label">Parsed Messages</div>
            <div className="stat-value">{totalMessages}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="stat-label">AI Briefings</div>
            <div className="stat-value">{totalBriefings}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="stat-label">Privacy Mode</div>
            <div className="stat-value" style={{ fontSize: '1.15rem' }}>100% Local</div>
          </div>
        </div>
      </div>

      {/* Instant Test Drive / Sample Chats Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="section-heading" style={{ marginBottom: '0.2rem' }}>
              <Sparkles size={20} color="var(--accent-electric)" />
              <span>Instant Test Drive</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Load realistic fictional team chat exports with one click to test parsing and briefings immediately.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {samples.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--accent-electric)',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '0.75rem',
                  }}
                >
                  {s.filename}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  {s.description}
                </p>
              </div>

              <button
                className="btn-secondary"
                onClick={() => onLoadSample(s.id)}
                disabled={isLoading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Load & Inspect</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Conversations List Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="section-heading" style={{ marginBottom: 0 }}>
            <Layers size={20} color="var(--accent-electric)" />
            <span>Active Conversations</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({conversations.length})
            </span>
          </h2>

          <button className="btn-secondary" onClick={onImportClick} style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
            <Upload size={15} />
            <span>Import New</span>
          </button>
        </div>

        {conversations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <MessageSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
              No conversations imported yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              Upload your own group chat export file, or load one of the instant sample chats above.
            </p>
            <button className="btn-primary" onClick={onImportClick}>
              <Upload size={16} />
              <span>Import Chat Export</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {conversations.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  padding: '1.15rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div
                  onClick={() => onOpenConversation(c.id)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      {c.title}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--accent-electric)',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {c.filename}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <span>{c.message_count} messages</span>
                    <span>•</span>
                    <span style={{ color: c.briefing_count > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {c.briefing_count} {c.briefing_count === 1 ? 'briefing' : 'briefings'}
                    </span>
                    <span>•</span>
                    <span>Imported {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => onOpenConversation(c.id)}
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <span>View Messages</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => onDeleteConversation(c.id)}
                    title="Delete conversation"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
