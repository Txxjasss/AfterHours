import json
import logging
from typing import List, Tuple, Dict, Any
import httpx
from pydantic import ValidationError

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL
from app.models import (
    ParsedMessage,
    BriefingPayload,
    OllamaStatusResponse,
)

logger = logging.getLogger("afterhours.ai")

class OllamaServiceError(Exception):
    def __init__(self, message: str, setup_commands: List[str] = None):
        super().__init__(message)
        self.message = message
        self.setup_commands = setup_commands or []

async def check_ollama_status() -> OllamaStatusResponse:
    """
    Checks if Ollama is running at OLLAMA_BASE_URL and whether the configured model is installed.
    """
    commands = [
        "ollama serve",
        f"ollama pull {OLLAMA_MODEL}"
    ]

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code != 200:
                return OllamaStatusResponse(
                    available=False,
                    model_found=False,
                    base_url=OLLAMA_BASE_URL,
                    configured_model=OLLAMA_MODEL,
                    installed_models=[],
                    error_message=f"Ollama server returned HTTP {resp.status_code}",
                    setup_commands=commands,
                )

            data = resp.json()
            models_info = data.get("models", [])
            installed_names = [m.get("name", "") for m in models_info]

            # Check exact match or base name match (e.g. qwen2.5:3b or qwen2.5:3b-instruct-q4_K_M)
            target = OLLAMA_MODEL.lower()
            model_found = any(
                target in name.lower() or name.lower().startswith(target)
                for name in installed_names
            )

            return OllamaStatusResponse(
                available=True,
                model_found=model_found,
                base_url=OLLAMA_BASE_URL,
                configured_model=OLLAMA_MODEL,
                installed_models=installed_names,
                error_message=None if model_found else f"Model '{OLLAMA_MODEL}' is not pulled yet.",
                setup_commands=[] if model_found else [f"ollama pull {OLLAMA_MODEL}"],
            )
    except httpx.ConnectError:
        return OllamaStatusResponse(
            available=False,
            model_found=False,
            base_url=OLLAMA_BASE_URL,
            configured_model=OLLAMA_MODEL,
            installed_models=[],
            error_message=f"Could not connect to Ollama at {OLLAMA_BASE_URL}. Ensure Ollama is running.",
            setup_commands=commands,
        )
    except Exception as e:
        return OllamaStatusResponse(
            available=False,
            model_found=False,
            base_url=OLLAMA_BASE_URL,
            configured_model=OLLAMA_MODEL,
            installed_models=[],
            error_message=str(e),
            setup_commands=commands,
        )

def build_transcript_text(messages: List[ParsedMessage]) -> str:
    """Formats parsed messages into an indexed transcript for the LLM."""
    lines = []
    for msg in messages:
        lines.append(f"[{msg.id}] ({msg.timestamp}) {msg.sender}: {msg.content}")
    return "\n".join(lines)

def build_system_prompt() -> str:
    schema_spec = json.dumps({
        "executive_summary": "<high-level 2-3 sentence overview of this specific conversation>",
        "important_updates": [
            {
                "category": "<category e.g. Infrastructure, Product, Release>",
                "text": "<statement of update from the transcript>",
                "source_message_ids": ["<msg_id>"]
            }
        ],
        "decisions_made": [
            {
                "decision": "<decision explicitly reached in the transcript>",
                "context": "<context if mentioned, or null>",
                "source_message_ids": ["<msg_id>"]
            }
        ],
        "action_items": [
            {
                "task": "<concrete task to be completed>",
                "assignee": "<person explicitly named or null>",
                "deadline": "<date or time explicitly stated or null>",
                "source_message_ids": ["<msg_id>"]
            }
        ],
        "unanswered_questions": [
            {
                "question": "<open question asked in the transcript>",
                "asker": "<name of asker or null>",
                "source_message_ids": ["<msg_id>"]
            }
        ]
    }, indent=2)

    return f"""You are AfterHours, an executive AI assistant specialized in analyzing conversation transcripts and generating accurate, high-fidelity briefings.

CRITICAL FIDELITY RULES:
1. NEVER invent, fabricate, or assume any facts, names, dates, or decisions. Every item must be grounded in the provided conversation transcript.
2. ASSIGNEES: ONLY assign a task if a specific person is explicitly named in the transcript as taking ownership or requested to do so. If no person is explicitly named, set "assignee" to null.
3. DEADLINES: ONLY include a deadline if an explicit date or time is mentioned in the transcript. If not stated, set "deadline" to null.
4. SOURCE CITATIONS: For EVERY item in important_updates, decisions_made, action_items, and unanswered_questions, you MUST include the exact message IDs (e.g. ["msg_1", "msg_4"]) providing direct evidence from the transcript.
5. If there are no items for a category (e.g. no unanswered questions), return an empty array [].
6. Output MUST be valid JSON strictly adhering to this structure:

{schema_spec}
"""

async def generate_briefing_with_ollama(messages: List[ParsedMessage]) -> Tuple[BriefingPayload, str]:
    """
    Sends conversation transcript to local Ollama instance and validates output with Pydantic.
    Never presents mock data as real AI output.
    """
    if not messages:
        raise ValueError("Cannot generate briefing for empty conversation.")

    # Check status first
    status = await check_ollama_status()
    if not status.available:
        raise OllamaServiceError(
            f"Ollama local AI server is unavailable at {OLLAMA_BASE_URL}. "
            "AfterHours runs AI locally to preserve your chat privacy.",
            setup_commands=status.setup_commands,
        )
    if not status.model_found:
        raise OllamaServiceError(
            f"Model '{OLLAMA_MODEL}' was not found in local Ollama repository. "
            f"Installed models: {', '.join(status.installed_models) if status.installed_models else 'None'}.",
            setup_commands=status.setup_commands,
        )

    transcript = build_transcript_text(messages)
    valid_ids = {msg.id for msg in messages}

    system_prompt = build_system_prompt()
    user_prompt = f"""Here is the conversation transcript to analyze. Generate a faithful executive briefing in valid JSON:

--- START TRANSCRIPT ---
{transcript}
--- END TRANSCRIPT ---
"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            if resp.status_code != 200:
                raise OllamaServiceError(
                    f"Ollama returned HTTP error {resp.status_code}: {resp.text}",
                    setup_commands=[f"ollama run {OLLAMA_MODEL}"]
                )

            resp_data = resp.json()
            raw_content = resp_data.get("message", {}).get("content", "").strip()

    except httpx.TimeoutException:
        raise OllamaServiceError(
            f"Ollama request timed out after 180 seconds. The model '{OLLAMA_MODEL}' might be busy or loaded on a slower device.",
            setup_commands=[f"ollama run {OLLAMA_MODEL}"]
        )
    except httpx.RequestError as e:
        raise OllamaServiceError(
            f"Failed communicating with Ollama: {str(e)}",
            setup_commands=status.setup_commands
        )

    # Validate JSON structure
    try:
        parsed_json = json.loads(raw_content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON output: {raw_content}")
        raise ValueError(f"Ollama output was not valid JSON: {str(e)}")

    # Validate with Pydantic
    try:
        validated_payload = BriefingPayload.model_validate(parsed_json)
    except ValidationError as ve:
        logger.error(f"Pydantic validation failed: {ve.json()}")
        raise ValueError(f"LLM output failed strict schema validation: {ve}")

    # Post-process: Filter out any hallucinated citation IDs that do not exist in transcript
    for item in validated_payload.important_updates:
        item.source_message_ids = [mid for mid in item.source_message_ids if mid in valid_ids]
    for item in validated_payload.decisions_made:
        item.source_message_ids = [mid for mid in item.source_message_ids if mid in valid_ids]
    for item in validated_payload.action_items:
        item.source_message_ids = [mid for mid in item.source_message_ids if mid in valid_ids]
    for item in validated_payload.unanswered_questions:
        item.source_message_ids = [mid for mid in item.source_message_ids if mid in valid_ids]

    return validated_payload, raw_content
