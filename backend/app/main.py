import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers import documents, chat, summary, quiz

# Konfigurasi Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("konco-sinauku")

# Inisialisasi Database
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Memulai Konco-Sinauku Backend Server...")
    yield
    logger.info("Mematikan Konco-Sinauku Backend Server...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API untuk platform belajar cerdas Konco-Sinauku (True RAG + LLM).",
    lifespan=lifespan
)

# CORS Middleware (mengizinkan frontend Vite React di port 5173 atau custom port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(summary.router)
app.include_router(quiz.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint untuk verifikasi status backend."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }

# Sajikan Frontend build jika tersedia (production mode)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
