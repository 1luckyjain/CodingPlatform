"""
Pydantic schemas for the /predict-performance endpoint.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class PerformanceRequest(BaseModel):
    userId: str = Field(..., description="MongoDB ObjectId of the user")

    # Historical stats — all required for prediction
    pastContestRanks: List[int] = Field(
        ...,
        description="List of ranks in past contests (e.g. [3, 7, 2, 15]). "
                    "Send at least 1 value; use [0] for new users.",
    )
    averageSolveTime: float = Field(
        ...,
        ge=0,
        description="Average time (in minutes) to solve a problem",
    )
    accuracyRate: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Ratio of accepted submissions to total submissions",
    )
    numberOfProblemsSolved: int = Field(
        ..., ge=0, description="Total problems solved on the platform"
    )
    consistencyScore: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Fraction of days active in the last 30 days",
    )
    difficultyPreferenceScore: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="0 = mostly Easy, 0.5 = Medium, 1 = mostly Hard",
    )
    totalContestsParticipated: Optional[int] = Field(
        default=0, ge=0
    )


class PerformanceResponse(BaseModel):
    userId: str
    expectedRank: int = Field(..., description="Predicted percentile rank (1 = best)")
    solveProbability: float = Field(
        ..., description="Probability [0,1] of solving at least one problem"
    )
    difficultyHandlingScore: float = Field(
        ..., description="Score [0,1] representing ability to handle hard problems"
    )
    confidenceLevel: str = Field(
        ..., description="LOW | MEDIUM | HIGH based on data availability"
    )
    insights: List[str] = Field(
        default_factory=list,
        description="Human-readable performance insights",
    )
