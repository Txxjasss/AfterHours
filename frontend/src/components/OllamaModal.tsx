import React, { useState } from 'react';
import { OllamaStatus } from '../types';
import { Terminal, Copy, Check, RefreshCw, X, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OllamaModalProps {
  status: OllamaStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export const OllamaModal: React.FC<OllamaModalProps> = ({
  status,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const isReady = status?.available && status?.model_found;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Terminal size={20} color="var(--accent-electric)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Local AI Engine (Ollama)</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Indicator Banner */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              background: isReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${isReady ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            }}
          >
            {isReady ? (
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isReady ? '#34d399' : '#fbbf24', marginBottom: '0.2rem' }}>
                {isReady
                  ? `Connected & Ready (${status?.configured_model})`
                  : !status?.available
                  ? 'Ollama Server Not Reachable'
                  : `Model ${status?.configured_model} Not Found`}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isReady
                  ? 'All briefing generations run entirely offline on your local machine using Qwen2.5 3B.'
                  : status?.error_message ||
                    `Target model '${status?.configured_model}' is not pulled in your local Ollama store.`}
              </p>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '0.8rem',
              color: 'var(--accent-electric)',
              marginBottom: '1.5rem',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Zero-Cloud Privacy:</strong> Conversations are parsed and summarized locally. No messages leave your computer.
            </span>
          </div>

          {/* Setup Instructions */}
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Terminal Commands
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Run these commands in your macOS terminal to start Ollama and ensure the model is pulled:
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>1. Start Ollama local daemon:</span>
            <div className="code-box">
              <code>ollama serve</code>
              <button
                className="code-copy-btn"
                onClick={() => copyToClipboard('ollama serve')}
                title="Copy command"
              >
                {copiedCmd === 'ollama serve' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>2. Download the Qwen2.5 3B model (approx 2GB):</span>
            <div className="code-box">
              <code>ollama pull {status?.configured_model || 'qwen2.5:3b'}</code>
              <button
                className="code-copy-btn"
                onClick={() => copyToClipboard(`ollama pull ${status?.configured_model || 'qwen2.5:3b'}`)}
                title="Copy command"
              >
                {copiedCmd === `ollama pull ${status?.configured_model || 'qwen2.5:3b'}` ? (
                  <Check size={16} color="#10b981" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          {status?.installed_models && status.installed_models.length > 0 && (
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Installed Local Models:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {status.installed_models.map((m) => (
                  <span
                    key={m}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'pulse-glow' : ''} />
            <span>{refreshing ? 'Checking...' : 'Recheck Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
