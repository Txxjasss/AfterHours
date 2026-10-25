import React from 'react';
import { OllamaStatus } from '../types';
import { Sparkles, Terminal, Activity, FileText, Upload, History } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'import' | 'history' | 'conversation' | 'briefing';
  onNavigate: (view: 'dashboard' | 'import' | 'history') => void;
  ollamaStatus: OllamaStatus | null;
  onOpenOllamaModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  ollamaStatus,
  onOpenOllamaModal,
}) => {
  const getStatusBadge = () => {
    if (!ollamaStatus) {
      return (
        <button className="status-pill warning" onClick={onOpenOllamaModal} title="Checking Ollama...">
          <span className="status-indicator-dot" />
          <span>Connecting...</span>
        </button>
      );
    }

    if (ollamaStatus.available && ollamaStatus.model_found) {
      return (
        <button
          className="status-pill online"
          onClick={onOpenOllamaModal}
          title={`Connected to Ollama (${ollamaStatus.configured_model})`}
        >
          <span className="status-indicator-dot" />
          <span>Ollama: {ollamaStatus.configured_model}</span>
        </button>
      );
    }

    if (ollamaStatus.available && !ollamaStatus.model_found) {
      return (
        <button
          className="status-pill warning"
          onClick={onOpenOllamaModal}
          title={`Model ${ollamaStatus.configured_model} missing. Click for setup guide.`}
        >
          <span className="status-indicator-dot" />
          <span>Model Missing</span>
        </button>
      );
    }

    return (
      <button
        className="status-pill offline"
        onClick={onOpenOllamaModal}
        title="Ollama is offline. Click for instructions."
      >
        <span className="status-indicator-dot" />
        <span>Ollama Offline</span>
      </button>
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => onNavigate('dashboard')}>
          <div className="brand-icon">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">AfterHours</span>
              <span className="brand-badge">Local AI</span>
            </div>
          </div>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            <Activity size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'import' ? 'active' : ''}`}
            onClick={() => onNavigate('import')}
          >
            <Upload size={16} />
            <span>Import Chat</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            <History size={16} />
            <span>Saved Briefings</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {getStatusBadge()}
        </div>
      </div>
    </nav>
  );
};
