from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_NAME, APP_TAGLINE, OLLAMA_BASE_URL, OLLAMA_MODEL
from app.database import init_db
from app.routes.ollama import router as ollama_router
from app.routes.conversations import router as conversations_router
from app.routes.briefings import router as briefings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables on startup
    await init_db()
    print(f"✨ {APP_NAME} started. {APP_TAGLINE}")
    print(f"📡 Configured Ollama target: {OLLAMA_BASE_URL} (Model: {OLLAMA_MODEL})")
    yield

app = FastAPI(
    title=APP_NAME,
    description=APP_TAGLINE,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(ollama_router)
app.include_router(conversations_router)
app.include_router(briefings_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": APP_NAME,
        "tagline": APP_TAGLINE,
        "ollama_target": OLLAMA_BASE_URL,
        "model": OLLAMA_MODEL,
    }
