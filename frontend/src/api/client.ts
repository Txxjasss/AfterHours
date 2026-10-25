import {
  ConversationSummary,
  ConversationDetail,
  BriefingResponse,
  BriefingHistoryItem,
  OllamaStatus,
  SampleChat,
} from '../types';

const API_BASE = '/api';

export async function fetchOllamaStatus(): Promise<OllamaStatus> {
  const res = await fetch(`${API_BASE}/ollama/status`);
  if (!res.ok) throw new Error('Failed to fetch Ollama status');
  return res.json();
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function fetchSamples(): Promise<SampleChat[]> {
  const res = await fetch(`${API_BASE}/conversations/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample chats');
  return res.json();
}

export async function loadSample(sampleId: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE}/conversations/load-sample/${sampleId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to load sample' }));
    throw new Error(err.detail || 'Failed to load sample');
  }
  return res.json();
}

export async function importConversation(
  rawText: string,
  title?: string,
  filename?: string
): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE}/conversations/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, title, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to import conversation' }));
    throw new Error(err.detail || 'Failed to import conversation');
  }
  return res.json();
}

export async function uploadConversationFile(
  file: File,
  title?: string
): Promise<ConversationDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);

  const res = await fetch(`${API_BASE}/conversations/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload chat file' }));
    throw new Error(err.detail || 'Failed to upload chat file');
  }
  return res.json();
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function generateBriefing(convId: string): Promise<BriefingResponse> {
  const res = await fetch(`${API_BASE}/conversations/${convId}/generate-briefing`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate briefing' }));
    const detail = typeof err.detail === 'object' ? err.detail.message : err.detail;
    const setupCommands = typeof err.detail === 'object' ? err.detail.setup_commands : [];
    const errorObj = new Error(detail || 'Briefing generation failed');
    (errorObj as any).setupCommands = setupCommands;
    throw errorObj;
  }
  return res.json();
}

export async function fetchBriefingsHistory(): Promise<BriefingHistoryItem[]> {
  const res = await fetch(`${API_BASE}/briefings`);
  if (!res.ok) throw new Error('Failed to fetch briefings history');
  return res.json();
}

export async function fetchBriefing(briefingId: string): Promise<BriefingResponse> {
  const res = await fetch(`${API_BASE}/briefings/${briefingId}`);
  if (!res.ok) throw new Error('Failed to fetch briefing');
  return res.json();
}

export async function toggleActionItem(itemId: string): Promise<{ id: string; completed: boolean }> {
  const res = await fetch(`${API_BASE}/briefings/action-items/${itemId}/toggle`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to toggle task state');
  return res.json();
}
