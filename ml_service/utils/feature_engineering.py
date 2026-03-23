"""
utils/feature_engineering.py
──────────────────────────────
Converts raw user stats (from PerformanceRequest) into a
numpy feature vector for the prediction model.

Feature vector layout (9 features):
  [0]  avg_rank_normalized      — lower is better, normalised to [0,1]
  [1]  rank_trend               — improving (+) or worsening (-) over last 5
  [2]  rank_std_normalized      — consistency of rankings
  [3]  average_solve_time_norm  — normalised solve time (faster = lower)
  [4]  accuracy_rate            — already [0,1]
  [5]  problems_solved_norm     — log-normalised problem count
  [6]  consistency_score        — already [0,1]
  [7]  difficulty_preference    — already [0,1]
  [8]  contests_participated    — log-normalised
"""

import math
import numpy as np
from typing import List


# ─── Normalisation constants (calibrate to your platform's data) ───────────────
_MAX_RANK = 500          # expected max participants
_MAX_SOLVE_TIME = 120.0  # minutes — cap at 2 hours
_MAX_PROBLEMS = 500      # cap for log-norm
_MAX_CONTESTS = 100


def _safe_log_norm(value: float, max_value: float) -> float:
    """log1p normalisation: compresses large values, handles 0 gracefully."""
    return math.log1p(min(value, max_value)) / math.log1p(max_value)


def _rank_trend(ranks: List[int]) -> float:
    """
    Returns a slope in [-1, +1].
    Negative slope → improving ranks (getting lower numbers) → good.
    We invert so that positive = improving for the model.
    """
    if len(ranks) < 2:
        return 0.0
    recent = ranks[-5:]          # use last 5 contests
    n = len(recent)
    x = np.arange(n, dtype=float)
    y = np.array(recent, dtype=float)
    # simple linear regression slope
    slope = np.polyfit(x, y, 1)[0]
    # normalise: rank drops (negative slope) = improving
    norm_slope = -slope / _MAX_RANK
    return float(np.clip(norm_slope, -1.0, 1.0))


def _rank_std(ranks: List[int]) -> float:
    """Normalised standard deviation of ranks — measures consistency."""
    if len(ranks) < 2:
        return 0.0
    std = float(np.std(ranks))
    return min(std / _MAX_RANK, 1.0)


def build_feature_vector(
    past_contest_ranks: List[int],
    average_solve_time: float,
    accuracy_rate: float,
    number_of_problems_solved: int,
    consistency_score: float,
    difficulty_preference_score: float,
    total_contests_participated: int = 0,
) -> np.ndarray:
    """
    Convert raw user stats into a fixed-length feature vector.

    Returns
    -------
    np.ndarray of shape (1, 9) — ready to pass to model.predict()
    """
    ranks = past_contest_ranks if past_contest_ranks else [_MAX_RANK]

    avg_rank = float(np.mean(ranks))

    features = [
        avg_rank / _MAX_RANK,                                   # [0]
        _rank_trend(ranks),                                     # [1]
        _rank_std(ranks),                                       # [2]
        min(average_solve_time, _MAX_SOLVE_TIME) / _MAX_SOLVE_TIME,  # [3]
        float(np.clip(accuracy_rate, 0.0, 1.0)),                # [4]
        _safe_log_norm(number_of_problems_solved, _MAX_PROBLEMS),  # [5]
        float(np.clip(consistency_score, 0.0, 1.0)),            # [6]
        float(np.clip(difficulty_preference_score, 0.0, 1.0)),  # [7]
        _safe_log_norm(total_contests_participated, _MAX_CONTESTS),  # [8]
    ]

    return np.array(features, dtype=float).reshape(1, -1)


def confidence_level(total_contests: int, problems_solved: int) -> str:
    """
    Simple heuristic: more data → more confidence.
    """
    score = total_contests * 2 + problems_solved
    if score >= 30:
        return "HIGH"
    elif score >= 10:
        return "MEDIUM"
    return "LOW"


def generate_insights(
    avg_rank_norm: float,
    accuracy_rate: float,
    consistency_score: float,
    difficulty_preference: float,
    avg_solve_time: float,
    rank_trend: float,
) -> list:
    """
    Generate 2–4 human-readable bullet insights about the user's profile.
    """
    insights = []

    if rank_trend > 0.05:
        insights.append("📈 Your ranks are improving — you're on an upward trajectory.")
    elif rank_trend < -0.05:
        insights.append("📉 Your recent ranks have been declining. Focus on timed practice.")

    if accuracy_rate >= 0.75:
        insights.append("✅ High accuracy rate — your submissions are well thought out.")
    elif accuracy_rate < 0.4:
        insights.append("⚠️ Low accuracy rate — try solving on paper before submitting.")

    if consistency_score >= 0.7:
        insights.append("🔥 Great consistency! Regular practice is your biggest strength.")
    elif consistency_score < 0.3:
        insights.append("📅 Practice more regularly — even 30 min daily helps a lot.")

    if difficulty_preference >= 0.65:
        insights.append("💪 You attempt hard problems — great for long-term growth.")
    elif difficulty_preference <= 0.3:
        insights.append("🧩 Try medium/hard problems to push your skill ceiling.")

    if avg_solve_time <= 15:
        insights.append("⚡ Impressive solve speed — keep optimising.")
    elif avg_solve_time >= 60:
        insights.append("⏱️ Work on speed — practice common patterns to reduce solve time.")

    return insights[:4]   # cap at 4
