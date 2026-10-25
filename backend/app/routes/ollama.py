from fastapi import APIRouter
from app.models import OllamaStatusResponse
from app.ai_service import check_ollama_status

router = APIRouter(prefix="/api/ollama", tags=["ollama"])

@router.get("/status", response_model=OllamaStatusResponse)
async def get_status():
    """Returns local Ollama service connection state, models, and setup instructions."""
    return await check_ollama_status()
