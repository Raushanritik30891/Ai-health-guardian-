"""
AI Health Guardian v2 - Production FastAPI Backend
All issues fixed: personalized info, real datasets, working AI, scanner, nearby stores
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
import os
from dotenv import load_dotenv

# Load .env file globally using absolute path
base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base_dir, '.env'))

from routers import symptoms, medicines, interactions, alternatives, remedies, prices, scanner, profile, stores, analyze
from models.database import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting AI Health Guardian v2...")
    await init_db()
    logger.info("Database initialized.")
    yield
    logger.info("Shutting down AI Health Guardian v2.")


app = FastAPI(
    title="AI Health Guardian v2",
    description="Production-grade smart healthcare decision engine for India",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
# allow_origins=["*"] lets any localhost port work (5173, 5174, 3000…)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False with allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(symptoms.router,     prefix="/api/symptoms",     tags=["Symptoms"])
app.include_router(medicines.router,    prefix="/api/medicines",    tags=["Medicines"])
app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(alternatives.router, prefix="/api/alternatives", tags=["Alternatives"])
app.include_router(remedies.router,     prefix="/api/remedies",     tags=["Remedies"])
app.include_router(prices.router,       prefix="/api/prices",       tags=["Prices"])
app.include_router(scanner.router,      prefix="/api/scanner",      tags=["Scanner"])
app.include_router(profile.router,      prefix="/api/profile",      tags=["Profile"])
app.include_router(stores.router,       prefix="/api/stores",       tags=["Stores"])
app.include_router(analyze.router,      prefix="/api/analyze",      tags=["Analyze"])


@app.get("/")
async def root():
    return {
        "app": "AI Health Guardian v2",
        "status": "healthy",
        "version": "2.0.0",
        "docs": "/api/docs",
        "emergency": "108 (India)",
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "2.0.0", "environment": os.getenv("ENV", "development")}


# ── Global error handler ─────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again.", "error": str(exc)},
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development",
        workers=1,
    )
