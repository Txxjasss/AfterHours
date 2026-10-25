import React, { useState, useEffect } from 'react';
import {
  ConversationSummary,
  ConversationDetail,
  BriefingResponse,
  OllamaStatus,
  SampleChat,
} from './types';
import {
  fetchConversations,
  fetchSamples,
  fetchConversation,
  fetchBriefing,
  fetchOllamaStatus,
  deleteConversation,
  generateBriefing,
  loadSample,
} from './api/client';
import { Navbar } from './components/Navbar';
import { OllamaModal } from './components/OllamaModal';
import { DashboardView } from './views/DashboardView';
import { ImportView } from './views/ImportView';
import { HistoryView } from './views/HistoryView';
import { MessageViewer } from './components/MessageViewer';
import { BriefingView } from './views/BriefingView';
import { Sparkles, Terminal, AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'history' | 'conversation' | 'briefing'>('dashboard');

  // Data states
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [samples, setSamples] = useState<SampleChat[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [activeBriefing, setActiveBriefing] = useState<BriefingResponse | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Status & modal states
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [globalError, setGlobalError] = useState<{ message: string; setupCommands?: string[] } | null>(null);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    try {
      const [convs, samps, status] = await Promise.all([
        fetchConversations(),
        fetchSamples(),
        fetchOllamaStatus(),
      ]);
      setConversations(convs);
      setSamples(samps);
      setOllamaStatus(status);
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  const handleRefreshOllama = async () => {
    try {
      const status = await fetchOllamaStatus();
      setOllamaStatus(status);
    } catch (err) {
      console.error('Failed to recheck Ollama:', err);
    }
  };

  const handleOpenConversation = async (convId: string) => {
    try {
      const conv = await fetchConversation(convId);
      setActiveConversation(conv);
      setCurrentView('conversation');
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation and its briefings?')) {
      return;
    }
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setCurrentView('dashboard');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    try {
      const conv = await loadSample(sampleId);
      setActiveConversation(conv);
      const convs = await fetchConversations();
      setConversations(convs);
      setCurrentView('conversation');
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  const handleConversationImported = (conv: ConversationDetail) => {
    setActiveConversation(conv);
    fetchConversations().then(setConversations);
    setCurrentView('conversation');
  };

  const handleGenerateBriefing = async () => {
    if (!activeConversation) return;

    setIsGeneratingBriefing(true);
    setGlobalError(null);
    setGenerationStep('Formatting message transcript...');

    try {
      setTimeout(() => setGenerationStep(`Inference with local Qwen2.5 3B...`), 600);
      setTimeout(() => setGenerationStep('Validating Pydantic schema & citations...'), 3500);

      const briefing = await generateBriefing(activeConversation.id);
      setActiveBriefing(briefing);

      // Refresh conversation to include the new briefing
      const updatedConv = await fetchConversation(activeConversation.id);
      setActiveConversation(updatedConv);
      const updatedList = await fetchConversations();
      setConversations(updatedList);

      setCurrentView('briefing');
    } catch (err: any) {
      console.error('Briefing generation error:', err);
      setGlobalError({
        message: err.message || 'Briefing generation failed.',
        setupCommands: err.setupCommands || [],
      });
      // If error mentions Ollama offline or missing model, offer opening Ollama modal
      if (err.message && (err.message.includes('Ollama') || err.message.includes('unavailable') || err.message.includes('Model'))) {
        setIsOllamaModalOpen(true);
      }
    } finally {
      setIsGeneratingBriefing(false);
      setGenerationStep('');
    }
  };

  const handleSelectBriefingFromHistory = async (briefingId: string, convId: string) => {
    try {
      const [briefing, conv] = await Promise.all([
        fetchBriefing(briefingId),
        fetchConversation(convId),
      ]);
      setActiveBriefing(briefing);
      setActiveConversation(conv);
      setCurrentView('briefing');
    } catch (err) {
      console.error('Failed to load briefing details:', err);
    }
  };

  const handleScrollToMessage = (msgId: string) => {
    setHighlightedMessageId(msgId);
    setCurrentView('conversation');
    setTimeout(() => {
      const el = document.getElementById(`msg-node-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  return (
    <div className="app-container">
      <div className="bg-illumination" />

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setGlobalError(null);
          setCurrentView(view);
        }}
        ollamaStatus={ollamaStatus}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {/* Global Error Banner */}
        {globalError && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              background: 'var(--status-danger-bg)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <AlertTriangle size={22} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#fb7185', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                Generation Failed
              </h4>
              <p style={{ color: '#fecdd3', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {globalError.message}
              </p>
              {globalError.setupCommands && globalError.setupCommands.length > 0 && (
                <div>
                  <button
                    className="btn-secondary"
                    onClick={() => setIsOllamaModalOpen(true)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    <Terminal size={14} />
                    <span>Open Ollama Setup Guide</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setGlobalError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '0.2rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Overlay when generating briefing */}
        {isGeneratingBriefing && (
          <div className="modal-overlay" style={{ zIndex: 60 }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px',
                padding: '2.5rem 3rem',
                textAlign: 'center',
                maxWidth: '460px',
                boxShadow: 'var(--shadow-lg), var(--shadow-electric)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent-electric)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <Sparkles size={32} className="pulse-glow" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                Generating Executive Briefing
              </h3>
              <p style={{ color: 'var(--accent-electric)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {generationStep || 'Processing conversation transcript...'}
              </p>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="pulse-glow"
                  style={{
                    width: '60%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.25rem' }}>
                Running 100% locally via Ollama (Qwen2.5 3B). Your messages never leave this device.
              </p>
            </div>
          </div>
        )}

        {/* Views */}
        {currentView === 'dashboard' && (
          <DashboardView
            conversations={conversations}
            samples={samples}
            onOpenConversation={handleOpenConversation}
            onImportClick={() => setCurrentView('import')}
            onLoadSample={handleLoadSample}
            onDeleteConversation={handleDeleteConversation}
            isLoading={isGeneratingBriefing}
          />
        )}

        {currentView === 'import' && (
          <ImportView onConversationLoaded={handleConversationImported} />
        )}

        {currentView === 'history' && (
          <HistoryView
            onSelectBriefing={handleSelectBriefingFromHistory}
            onImportClick={() => setCurrentView('import')}
          />
        )}

        {currentView === 'conversation' && activeConversation && (
          <MessageViewer
            conversation={activeConversation}
            onGenerateBriefing={handleGenerateBriefing}
            onBack={() => setCurrentView('dashboard')}
            onViewBriefing={async (briefingId) => {
              const b = await fetchBriefing(briefingId);
              setActiveBriefing(b);
              setCurrentView('briefing');
            }}
            isGenerating={isGeneratingBriefing}
            highlightedMessageId={highlightedMessageId}
          />
        )}

        {currentView === 'briefing' && activeBriefing && (
          <BriefingView
            briefing={activeBriefing}
            conversationTitle={activeConversation?.title}
            onBack={() => {
              if (activeConversation) {
                setCurrentView('conversation');
              } else {
                setCurrentView('history');
              }
            }}
            onViewOriginalChat={() => {
              setCurrentView('conversation');
            }}
            allMessages={activeConversation?.messages || []}
            onScrollToMessage={handleScrollToMessage}
          />
        )}
      </main>

      {/* Ollama Diagnostics & Setup Modal */}
      <OllamaModal
        status={ollamaStatus}
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        onRefresh={handleRefreshOllama}
      />
    </div>
  );
};

export default App;
