"""
ML Microservice for Coding Platform
====================================
Handles:
  1. Plagiarism / Cheating Detection  →  POST /plagiarism-check
  2. Contest Performance Prediction   →  POST /predict-performance

Run locally:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from schemas.plagiarism_schema import PlagiarismRequest, PlagiarismResponse
from schemas.performance_schema import PerformanceRequest, PerformanceResponse
from services.plagiarism_service import PlagiarismService
from services.performance_service import PerformanceService

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Coding Platform ML Service",
    description="ML microservice for plagiarism detection and performance prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to your Node backend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Service singletons (loaded once at startup) ─────────────────────────────
plagiarism_service = PlagiarismService()
performance_service = PerformanceService()


@app.on_event("startup")
async def startup_event():
    logger.info("ML microservice started. Loading models...")
    performance_service.load_model()
    logger.info("All models ready.")


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "ML Microservice v1.0.0"}


# ─── Route 1: Plagiarism Detection ────────────────────────────────────────────
@app.post(
    "/plagiarism-check",
    response_model=PlagiarismResponse,
    tags=["Plagiarism Detection"],
    summary="Detect plagiarism among contest submissions",
)
def check_plagiarism(request: PlagiarismRequest):
    """
    Accepts a list of code submissions from a contest and returns
    all suspicious pairs whose similarity exceeds the threshold.
    """
    try:
        logger.info(
            f"Plagiarism check | contestId={request.contestId} "
            f"| submissions={len(request.submissions)}"
        )
        result = plagiarism_service.detect(request)
        logger.info(f"Flagged pairs: {len(result.flaggedPairs)}")
        return result
    except Exception as e:
        logger.error(f"Plagiarism check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Route 2: Performance Prediction ─────────────────────────────────────────
@app.post(
    "/predict-performance",
    response_model=PerformanceResponse,
    tags=["Performance Prediction"],
    summary="Predict a user's expected contest performance",
)
def predict_performance(request: PerformanceRequest):
    """
    Accepts a user's historical stats and returns predicted
    rank, solve probability, and difficulty handling score.
    """
    try:
        logger.info(f"Performance prediction | userId={request.userId}")
        result = performance_service.predict(request)
        return result
    except Exception as e:
        logger.error(f"Performance prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
