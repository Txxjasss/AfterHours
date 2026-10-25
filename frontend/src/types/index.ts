export interface ParsedMessage {
  id: string;
  sender: string;
  timestamp: string;
  content: string;
  raw_line_number: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  filename: string;
  message_count: number;
  briefing_count: number;
  created_at: string;
}

export interface UpdateItem {
  id: string;
  briefing_id: string;
  category: string;
  text: string;
  source_message_ids: string[];
}

export interface DecisionItem {
  id: string;
  briefing_id: string;
  decision: string;
  context?: string | null;
  source_message_ids: string[];
}

export interface ActionItem {
  id: string;
  briefing_id: string;
  task: string;
  assignee?: string | null;
  deadline?: string | null;
  completed: boolean;
  source_message_ids: string[];
}

export interface QuestionItem {
  id: string;
  briefing_id: string;
  question: string;
  asker?: string | null;
  source_message_ids: string[];
}

export interface BriefingResponse {
  id: string;
  conversation_id: string;
  executive_summary: string;
  created_at: string;
  model_used: string;
  updates: UpdateItem[];
  decisions: DecisionItem[];
  action_items: ActionItem[];
  questions: QuestionItem[];
  cited_messages: Record<string, ParsedMessage>;
}

export interface ConversationDetail {
  id: string;
  title: string;
  filename: string;
  created_at: string;
  messages: ParsedMessage[];
  briefings: BriefingResponse[];
}

export interface OllamaStatus {
  available: boolean;
  model_found: boolean;
  base_url: string;
  configured_model: string;
  installed_models: string[];
  error_message?: string | null;
  setup_commands: string[];
}

export interface BriefingHistoryItem {
  id: string;
  conversation_id: string;
  conversation_title: string;
  conversation_filename: string;
  executive_summary: string;
  model_used: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
}

export interface SampleChat {
  id: string;
  title: string;
  filename: string;
  description: string;
  preview_length: number;
}
