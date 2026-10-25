from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Chat & Parser Schemas ---

class ParsedMessage(BaseModel):
    id: str = Field(..., description="Stable message identifier (e.g. msg_1)")
    sender: str = Field(..., description="Sender display name")
    timestamp: str = Field(..., description="Parsed timestamp string")
    content: str = Field(..., description="Message text content")
    raw_line_number: int = Field(1, description="Original 1-indexed line number")

class ConversationImportRequest(BaseModel):
    title: Optional[str] = None
    filename: Optional[str] = "chat_export.txt"
    raw_text: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    filename: str
    message_count: int
    briefing_count: int
    created_at: str

# --- Structured AI Output Schemas ---
# Validated strictly against Ollama local model output.
# Rule: Never invent assignees, deadlines, decisions, or source references.

class UpdateItem(BaseModel):
    category: str = Field(..., description="Category like 'Engineering', 'Release', 'Deployment', 'Design', 'General'")
    text: str = Field(..., description="Concise statement of the update")
    source_message_ids: List[str] = Field(default_factory=list, description="List of message IDs (e.g. ['msg_1', 'msg_3']) providing evidence")

class DecisionItem(BaseModel):
    decision: str = Field(..., description="Clear statement of what was decided")
    context: Optional[str] = Field(None, description="Context or reasoning behind the decision if mentioned")
    source_message_ids: List[str] = Field(default_factory=list, description="List of message IDs supporting this decision")

class ActionItem(BaseModel):
    task: str = Field(..., description="Actionable task to be done")
    assignee: Optional[str] = Field(None, description="Explicitly mentioned assignee name, or None if unassigned")
    deadline: Optional[str] = Field(None, description="Explicitly mentioned deadline or date, or None if not stated")
    source_message_ids: List[str] = Field(default_factory=list, description="List of message IDs where task is mentioned")

class QuestionItem(BaseModel):
    question: str = Field(..., description="Open question left unresolved or pending feedback")
    asker: Optional[str] = Field(None, description="Sender who asked the question if known")
    source_message_ids: List[str] = Field(default_factory=list, description="List of message IDs where question was posed")

class BriefingPayload(BaseModel):
    executive_summary: str = Field(..., description="High-level 2-4 sentence executive overview of the conversation")
    important_updates: List[UpdateItem] = Field(default_factory=list, description="Key status changes and progress reports")
    decisions_made: List[DecisionItem] = Field(default_factory=list, description="Agreements or chosen directions")
    action_items: List[ActionItem] = Field(default_factory=list, description="Concrete next steps with explicit owners/deadlines")
    unanswered_questions: List[QuestionItem] = Field(default_factory=list, description="Unresolved queries needing follow-up")

# --- Full Briefing & DB Representation Schemas ---

class ActionItemResponse(BaseModel):
    id: str
    briefing_id: str
    task: str
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    completed: bool = False
    source_message_ids: List[str] = Field(default_factory=list)

class UpdateItemResponse(BaseModel):
    id: str
    briefing_id: str
    category: str
    text: str
    source_message_ids: List[str] = Field(default_factory=list)

class DecisionItemResponse(BaseModel):
    id: str
    briefing_id: str
    decision: str
    context: Optional[str] = None
    source_message_ids: List[str] = Field(default_factory=list)

class QuestionItemResponse(BaseModel):
    id: str
    briefing_id: str
    question: str
    asker: Optional[str] = None
    source_message_ids: List[str] = Field(default_factory=list)

class BriefingResponse(BaseModel):
    id: str
    conversation_id: str
    executive_summary: str
    created_at: str
    model_used: str
    updates: List[UpdateItemResponse] = Field(default_factory=list)
    decisions: List[DecisionItemResponse] = Field(default_factory=list)
    action_items: List[ActionItemResponse] = Field(default_factory=list)
    questions: List[QuestionItemResponse] = Field(default_factory=list)
    # Map of cited message id -> ParsedMessage for instant citation rendering in frontend
    cited_messages: Dict[str, ParsedMessage] = Field(default_factory=dict)

class ConversationDetail(BaseModel):
    id: str
    title: str
    filename: str
    created_at: str
    messages: List[ParsedMessage]
    briefings: List[BriefingResponse]

# --- Ollama Status Schema ---

class OllamaStatusResponse(BaseModel):
    available: bool
    model_found: bool
    base_url: str
    configured_model: str
    installed_models: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None
    setup_commands: List[str] = Field(default_factory=list)
