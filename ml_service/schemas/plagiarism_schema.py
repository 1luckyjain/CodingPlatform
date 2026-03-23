"""
Pydantic schemas for the /plagiarism-check endpoint.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class Submission(BaseModel):
    userId: str = Field(..., description="MongoDB ObjectId of the submitting user")
    problemId: str = Field(..., description="MongoDB ObjectId of the problem")
    code: str = Field(..., description="Raw source code submitted by the user")
    language: str = Field(..., description="Programming language: python | cpp | java | js")
    submissionTime: Optional[str] = Field(
        None, description="ISO 8601 timestamp of submission"
    )


class PlagiarismRequest(BaseModel):
    contestId: str = Field(..., description="MongoDB ObjectId of the contest")
    submissions: List[Submission] = Field(
        ..., min_items=2, description="All submissions to compare"
    )
    threshold: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Similarity threshold above which a pair is flagged",
    )


# ─── Response ─────────────────────────────────────────────────────────────────

class FlaggedPair(BaseModel):
    userA: str
    userB: str
    problemId: str
    similarityScore: float = Field(..., description="Cosine similarity [0, 1]")
    flag: bool = Field(default=True)
    language: str


class PlagiarismResponse(BaseModel):
    contestId: str
    totalSubmissionsChecked: int
    totalPairsEvaluated: int
    flaggedPairs: List[FlaggedPair]
    threshold: float
