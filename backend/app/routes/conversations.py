from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models import (
    ConversationSummary,
    ConversationDetail,
    ConversationImportRequest,
)
from app.parser import parse_chat_text
from app.database import (
    create_conversation,
    list_conversations,
    get_conversation,
    delete_conversation,
)
from app.sample_data import SAMPLE_CONVERSATIONS

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("", response_model=List[ConversationSummary])
async def get_all_conversations():
    """Lists all stored conversations."""
    return await list_conversations()

@router.get("/samples")
async def get_sample_list():
    """Returns metadata for built-in fictional sample chats for zero-friction testing."""
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "filename": s["filename"],
            "description": s["description"],
            "preview_length": len(s["content"].splitlines()),
        }
        for s in SAMPLE_CONVERSATIONS
    ]

@router.post("/load-sample/{sample_id}", response_model=ConversationDetail)
async def load_sample_conversation(sample_id: str):
    """Loads a built-in fictional sample conversation directly into the database."""
    sample = next((s for s in SAMPLE_CONVERSATIONS if s["id"] == sample_id), None)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample conversation not found")

    parsed = parse_chat_text(sample["content"])
    conv_id = await create_conversation(
        title=sample["title"],
        filename=sample["filename"],
        raw_text=sample["content"],
        messages=parsed,
    )
    detail = await get_conversation(conv_id)
    return detail

@router.post("/import", response_model=ConversationDetail)
async def import_conversation(payload: ConversationImportRequest):
    """Imports conversation from raw text payload."""
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Conversation text cannot be empty.")

    messages = parse_chat_text(payload.raw_text)
    if not messages:
        raise HTTPException(
            status_code=400,
            detail="Could not detect valid chat messages. Please ensure timestamps and senders follow a supported format."
        )

    title = payload.title or (f"Chat with {messages[0].sender}" if messages else "Imported Conversation")
    filename = payload.filename or "export.txt"

    conv_id = await create_conversation(
        title=title,
        filename=filename,
        raw_text=payload.raw_text,
        messages=messages,
    )
    detail = await get_conversation(conv_id)
    return detail

@router.post("/upload", response_model=ConversationDetail)
async def upload_chat_file(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    """Uploads a .txt chat export file."""
    if not file.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported currently.")

    content_bytes = await file.read()
    try:
        raw_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raw_text = content_bytes.decode("latin-1", errors="replace")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    messages = parse_chat_text(raw_text)
    if not messages:
        raise HTTPException(
            status_code=400,
            detail="No valid chat messages could be parsed from the file. Check that it contains timestamps and sender headers."
        )

    conv_title = title if title and title.strip() else file.filename.rsplit(".", 1)[0].replace("_", " ").title()

    conv_id = await create_conversation(
        title=conv_title,
        filename=file.filename,
        raw_text=raw_text,
        messages=messages,
    )
    detail = await get_conversation(conv_id)
    return detail

@router.get("/{conv_id}", response_model=ConversationDetail)
async def get_conversation_detail(conv_id: str):
    """Retrieves single conversation with all parsed messages and existing briefings."""
    conv = await get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/{conv_id}")
async def delete_conversation_route(conv_id: str):
    """Deletes conversation and its briefings from database."""
    success = await delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "id": conv_id}
