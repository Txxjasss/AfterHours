import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

# Database settings
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "afterhours.db"))

# Application
APP_NAME = "AfterHours"
APP_TAGLINE = "Your conversations. One useful briefing."
