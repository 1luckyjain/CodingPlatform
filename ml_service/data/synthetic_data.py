"""
data/synthetic_data.py
───────────────────────
Generates a synthetic training dataset so the model can be trained
without real contest data at startup.

Feature vector layout (9 features) — matches feature_engineering.py:
  [0] avg_rank_normalized
  [1] rank_trend
  [2] rank_std_normalized
  [3] average_solve_time_norm
  [4] accuracy_rate
  [5] problems_solved_norm
  [6] consistency_score
  [7] difficulty_preference
  [8] contests_participated_norm

Target vector (3 outputs):
  [0] expected_rank_normalized     (0=best, 1=worst)
  [1] solve_probability            [0,1]
  [2] difficulty_handling_score    [0,1]
"""

import numpy as np
from typing import Tuple


def generate_synthetic_dataset(
    n_samples: int = 300,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns (X, y) where:
        X  — shape (n_samples, 9)  feature matrix
        y  — shape (n_samples, 3)  target matrix
    """
    rng = np.random.RandomState(seed)

    # ── Features ─────────────────────────────────────────────────────────────
    avg_rank_norm         = rng.beta(2, 3, n_samples)          # skewed toward mid-low
    rank_trend            = rng.uniform(-0.3, 0.3, n_samples)
    rank_std_norm         = rng.beta(2, 5, n_samples)
    solve_time_norm       = rng.beta(3, 2, n_samples)          # skewed toward mid-high
    accuracy_rate         = rng.beta(4, 2, n_samples)          # most users fairly accurate
    problems_solved_norm  = rng.beta(2, 4, n_samples)
    consistency_score     = rng.beta(3, 3, n_samples)
    difficulty_pref       = rng.beta(2, 3, n_samples)
    contests_norm         = rng.beta(2, 5, n_samples)

    X = np.column_stack([
        avg_rank_norm,
        rank_trend,
        rank_std_norm,
        solve_time_norm,
        accuracy_rate,
        problems_solved_norm,
        consistency_score,
        difficulty_pref,
        contests_norm,
    ])

    # ── Targets (simulated via domain logic + noise) ──────────────────────────

    # expected_rank_norm:
    #   Lower is better → high accuracy, fast solve, lots of problems = low rank norm
    expected_rank_norm = (
        0.35 * avg_rank_norm
        + 0.20 * solve_time_norm
        - 0.20 * accuracy_rate
        - 0.15 * problems_solved_norm
        - 0.10 * consistency_score
        + rng.normal(0, 0.05, n_samples)
    )

    # solve_probability:
    #   High accuracy + consistency + some problems solved = high prob
    solve_prob = (
        0.40 * accuracy_rate
        + 0.25 * consistency_score
        + 0.20 * problems_solved_norm
        - 0.15 * solve_time_norm
        + rng.normal(0, 0.05, n_samples)
    )

    # difficulty_handling_score:
    #   Prefers hard, high accuracy, more contests = better at difficulty
    diff_score = (
        0.35 * difficulty_pref
        + 0.30 * accuracy_rate
        + 0.20 * problems_solved_norm
        - 0.15 * avg_rank_norm
        + rng.normal(0, 0.05, n_samples)
    )

    y = np.column_stack([
        np.clip(expected_rank_norm, 0.0, 1.0),
        np.clip(solve_prob,         0.0, 1.0),
        np.clip(diff_score,         0.0, 1.0),
    ])

    return X.astype(np.float32), y.astype(np.float32)
