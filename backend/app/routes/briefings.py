from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models import BriefingResponse
from app.database import (
    get_conversation,
    save_briefing,
    get_briefing_by_id,
    list_all_briefings,
    toggle_action_item_completed,
)
from app.ai_service import generate_briefing_with_ollama, OllamaServiceError
from app.config import OLLAMA_MODEL

router = APIRouter(tags=["briefings"])

@router.post("/api/conversations/{conv_id}/generate-briefing", response_model=BriefingResponse)
async def create_briefing_route(conv_id: str):
    """
    Generates a structured briefing using local Ollama model (Qwen2.5 3B).
    Validates output with Pydantic and stores result in local SQLite.
    Never returns mock data. If Ollama or the model is missing, returns actionable setup steps.
    """
    conv = await get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if not conv.messages:
        raise HTTPException(status_code=400, detail="Conversation has no messages to analyze.")

    try:
        payload, raw_response = await generate_briefing_with_ollama(conv.messages)
        briefing_id = await save_briefing(
            conversation_id=conv_id,
            payload=payload,
            model_used=OLLAMA_MODEL,
            raw_response=raw_response,
        )
        briefing = await get_briefing_by_id(briefing_id)
        if not briefing:
            raise HTTPException(status_code=500, detail="Failed to retrieve generated briefing")
        return briefing

    except OllamaServiceError as ose:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": ose.message,
                "setup_commands": ose.setup_commands,
                "model": OLLAMA_MODEL,
            }
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": f"Model output validation failed: {str(ve)}",
                "model": OLLAMA_MODEL,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during briefing generation: {str(e)}"
        )

@router.get("/api/briefings", response_model=List[Dict[str, Any]])
async def get_all_briefings():
    """Lists all saved briefings across conversations for the History view."""
    return await list_all_briefings()

@router.get("/api/briefings/{briefing_id}", response_model=BriefingResponse)
async def get_single_briefing(briefing_id: str):
    """Retrieves a single briefing by ID with populated source citations."""
    briefing = await get_briefing_by_id(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing

@router.patch("/api/briefings/action-items/{item_id}/toggle")
async def toggle_action_item(item_id: str):
    """Toggles completion state of an action item."""
    new_state = await toggle_action_item_completed(item_id)
    if new_state is None:
        raise HTTPException(status_code=404, detail="Action item not found")
    return {"id": item_id, "completed": new_state}
