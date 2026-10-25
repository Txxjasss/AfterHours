import React, { useState, useRef, useEffect } from 'react';
import { ConversationDetail, SampleChat } from '../types';
import { uploadConversationFile, importConversation, fetchSamples, loadSample } from '../api/client';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clipboard,
} from 'lucide-react';

interface ImportViewProps {
  onConversationLoaded: (conv: ConversationDetail) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onConversationLoaded }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paste form state
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');

  // Samples state
  const [samples, setSamples] = useState<SampleChat[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleList();
  }, []);

  const loadSampleList = async () => {
    try {
      setLoadingSamples(true);
      const data = await fetchSamples();
      setSamples(data);
    } catch (err) {
      console.error('Failed to load sample chats:', err);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('Please upload a .txt chat export file.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const conv = await uploadConversationFile(file);
      onConversationLoaded(conv);
    } catch (err: any) {
      setError(err.message || 'Failed to parse chat export file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) {
      setError('Please enter or paste chat transcript text.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const conv = await importConversation(pasteText, pasteTitle.trim() || undefined);
      onConversationLoaded(conv);
    } catch (err: any) {
      setError(err.message || 'Failed to parse conversation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const conv = await loadSample(sampleId);
      onConversationLoaded(conv);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Import Conversation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '580px', margin: '0 auto' }}>
          Drop in a group chat or project export to parse participants, timestamps, and message history for briefing generation.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-card)',
          padding: '0.35rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          onClick={() => { setActiveTab('upload'); setError(null); }}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'upload' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'upload' ? 'var(--accent-electric)' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          Upload .txt File
        </button>
        <button
          onClick={() => { setActiveTab('paste'); setError(null); }}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'paste' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'paste' ? 'var(--accent-electric)' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          Paste Transcript Text
        </button>
        <button
          onClick={() => { setActiveTab('samples'); setError(null); }}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'samples' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'samples' ? 'var(--accent-electric)' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          Try Sample Chats (Instant)
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: 'var(--status-danger-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fb7185',
            fontSize: '0.88rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-electric)' : 'rgba(56, 189, 248, 0.25)'}`,
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: dragOver ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-card)',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              boxShadow: dragOver ? 'var(--shadow-electric)' : 'none',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--accent-electric)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <UploadCloud size={30} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
              {loading ? 'Parsing chat export...' : 'Drag and drop your .txt export here'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Supports WhatsApp, Slack, Discord, and standard timestamped logs.
            </p>
            <button
              className="btn-primary"
              disabled={loading}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <FileText size={16} />
              <span>{loading ? 'Processing...' : 'Browse Local File'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Paste Tab */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePasteSubmit} style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Conversation Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Infrastructure Sprint Review"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Raw Chat Transcript
            </label>
            <textarea
              rows={10}
              placeholder={`[10/24/24, 09:15:00 AM] Alice: We decided to deploy the hotfix today.\n[10/24/24, 09:16:30 AM] Bob: I will test the staging build by 2 PM.`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setPasteText(''); setPasteTitle(''); }}
            >
              Clear
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Parsing Messages...' : 'Parse & Inspect Conversation'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Samples Tab */}
      {activeTab === 'samples' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingSamples ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading sample conversations...
            </div>
          ) : (
            samples.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{s.title}</h3>
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
                      {s.filename}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {s.description}
                  </p>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => handleSelectSample(s.id)}
                  disabled={loading}
                  style={{ flexShrink: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <span>Load Sample</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Format Support Accordion */}
      <div style={{ marginTop: '2.5rem' }}>
        <button
          onClick={() => setShowFormatGuide(!showFormatGuide)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            margin: '0 auto',
          }}
        >
          <HelpCircle size={15} />
          <span>Supported Chat Export Formats Guide</span>
          {showFormatGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showFormatGuide && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1.25rem',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              AfterHours automatically parses common chat formats:
            </div>
            <ul style={{ paddingLeft: '1.2rem', marginBottom: '0.75rem' }}>
              <li>
                <strong>WhatsApp (Bracket):</strong> <code>[10/24/24, 09:15:32 AM] Alice: Message text</code>
              </li>
              <li>
                <strong>WhatsApp (Dash):</strong> <code>10/24/24, 9:15 AM - Alice: Message text</code>
              </li>
              <li>
                <strong>Standard / Slack ISO:</strong> <code>2024-10-24 14:30:00 - Alice: Message text</code>
              </li>
              <li>
                <strong>Bracket Time:</strong> <code>[09:15 AM] Alice: Message text</code>
              </li>
            </ul>
            <p>Multi-line messages (paragraphs, code snippets, stack traces) are safely grouped under the original sender.</p>
          </div>
        )}
      </div>
    </div>
  );
};
