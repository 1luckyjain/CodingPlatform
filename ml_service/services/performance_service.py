"""
services/performance_service.py
────────────────────────────────
Loads (or trains) a RandomForest model and exposes a predict() method.

Model targets (all regression):
  • expectedRank            — normalised [0,1], scaled to integer rank at response time
  • solveProbability        — [0,1]
  • difficultyHandlingScore — [0,1]
"""

import os
import logging
import joblib
import numpy as np
from pathlib import Path

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.pipeline import Pipeline

from schemas.performance_schema import PerformanceRequest, PerformanceResponse
from utils.feature_engineering import (
    build_feature_vector,
    confidence_level,
    generate_insights,
    _rank_trend,
)

logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────
_MODEL_DIR = Path(__file__).parent.parent / "models"
_MODEL_PATH = _MODEL_DIR / "performance_model.joblib"
_MAX_RANK = 500   # must match feature_engineering.py


class PerformanceService:
    def __init__(self):
        self.model: Pipeline | None = None

    # ── Model lifecycle ───────────────────────────────────────────────────────

    def load_model(self):
        """Load pre-trained model, or train a seed model if none exists."""
        if _MODEL_PATH.exists():
            self.model = joblib.load(_MODEL_PATH)
            logger.info(f"Performance model loaded from {_MODEL_PATH}")
        else:
            logger.warning("No saved model found — training seed model from synthetic data.")
            self._train_and_save_seed_model()

    def _train_and_save_seed_model(self):
        """
        Train on a small synthetic dataset so the service works out-of-the-box.
        Replace / augment with real data from your MongoDB for production.
        """
        from data.synthetic_data import generate_synthetic_dataset
        X, y = generate_synthetic_dataset(n_samples=300)

        self.model = Pipeline([
            ("scaler", MinMaxScaler()),
            ("regressor", MultiOutputRegressor(
                GradientBoostingRegressor(
                    n_estimators=150,
                    max_depth=4,
                    learning_rate=0.05,
                    subsample=0.8,
                    random_state=42,
                )
            )),
        ])
        self.model.fit(X, y)

        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, _MODEL_PATH)
        logger.info(f"Seed model trained and saved to {_MODEL_PATH}")

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict(self, request: PerformanceRequest) -> PerformanceResponse:
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        features = build_feature_vector(
            past_contest_ranks=request.pastContestRanks,
            average_solve_time=request.averageSolveTime,
            accuracy_rate=request.accuracyRate,
            number_of_problems_solved=request.numberOfProblemsSolved,
            consistency_score=request.consistencyScore,
            difficulty_preference_score=request.difficultyPreferenceScore,
            total_contests_participated=request.totalContestsParticipated or 0,
        )

        raw_predictions = self.model.predict(features)[0]

        # Clamp all outputs to [0, 1]
        rank_norm, solve_prob, diff_score = np.clip(raw_predictions, 0.0, 1.0)

        # Convert normalised rank back to an integer (1 = best)
        expected_rank = max(1, int(round(rank_norm * _MAX_RANK)))
        solve_prob = round(float(solve_prob), 3)
        diff_score = round(float(diff_score), 3)

        # Insights
        trend = _rank_trend(request.pastContestRanks)
        insights = generate_insights(
            avg_rank_norm=rank_norm,
            accuracy_rate=request.accuracyRate,
            consistency_score=request.consistencyScore,
            difficulty_preference=request.difficultyPreferenceScore,
            avg_solve_time=request.averageSolveTime,
            rank_trend=trend,
        )

        confidence = confidence_level(
            total_contests=request.totalContestsParticipated or 0,
            problems_solved=request.numberOfProblemsSolved,
        )

        return PerformanceResponse(
            userId=request.userId,
            expectedRank=expected_rank,
            solveProbability=solve_prob,
            difficultyHandlingScore=diff_score,
            confidenceLevel=confidence,
            insights=insights,
        )
