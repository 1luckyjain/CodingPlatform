"""
scripts/train_performance_model.py
────────────────────────────────────
Offline training script.

Usage
-----
1. Export user stats from MongoDB as CSV (see schema below).
2. Run:
       python scripts/train_performance_model.py --data path/to/users.csv

CSV Schema expected
-------------------
avg_rank, rank_trend, rank_std, solve_time_norm, accuracy_rate,
problems_solved_norm, consistency_score, difficulty_pref, contests_norm,
expected_rank_norm, solve_probability, difficulty_handling_score

If no --data flag is provided, the synthetic dataset is used.
"""

import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler

# Make project root importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from data.synthetic_data import generate_synthetic_dataset

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

MODEL_SAVE_PATH = Path(__file__).parent.parent / "models" / "performance_model.joblib"

FEATURE_COLS = [
    "avg_rank_norm", "rank_trend", "rank_std_norm", "solve_time_norm",
    "accuracy_rate", "problems_solved_norm", "consistency_score",
    "difficulty_pref", "contests_norm",
]
TARGET_COLS = ["expected_rank_norm", "solve_probability", "difficulty_handling_score"]


def load_data(csv_path: str | None):
    if csv_path:
        logger.info(f"Loading real data from {csv_path}")
        df = pd.read_csv(csv_path)
        X = df[FEATURE_COLS].values
        y = df[TARGET_COLS].values
    else:
        logger.info("No CSV provided — using synthetic dataset (300 samples).")
        X, y = generate_synthetic_dataset(n_samples=300)
    return X, y


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("scaler", MinMaxScaler()),
        ("regressor", MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                min_samples_split=5,
                random_state=42,
            )
        )),
    ])


def evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    target_names = ["ExpectedRank", "SolveProbability", "DifficultyScore"]
    for i, name in enumerate(target_names):
        mae  = mean_absolute_error(y_test[:, i], y_pred[:, i])
        r2   = r2_score(y_test[:, i], y_pred[:, i])
        logger.info(f"  {name:25s}  MAE={mae:.4f}  R²={r2:.4f}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default=None, help="Path to CSV training data")
    args = parser.parse_args()

    X, y = load_data(args.data)
    logger.info(f"Dataset shape: X={X.shape}  y={y.shape}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = build_pipeline()
    logger.info("Training model...")
    model.fit(X_train, y_train)

    logger.info("Evaluation on held-out test set:")
    evaluate(model, X_test, y_test)

    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_SAVE_PATH)
    logger.info(f"Model saved to {MODEL_SAVE_PATH}")


if __name__ == "__main__":
    main()
