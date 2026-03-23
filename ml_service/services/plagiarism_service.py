"""
services/plagiarism_service.py
────────────────────────────────
Pipeline
--------
1. Group submissions by problemId  (only compare within the same problem)
2. Preprocess each code snippet
3. Build TF-IDF matrix over all snippets in the group
4. Compute pairwise cosine similarity
5. Flag pairs above the threshold
6. Return structured PlagiarismResponse
"""

from itertools import combinations
from typing import List, Dict

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from schemas.plagiarism_schema import (
    PlagiarismRequest,
    PlagiarismResponse,
    FlaggedPair,
    Submission,
)
from utils.code_preprocessor import preprocess


class PlagiarismService:
    """
    Stateless service — no model file needed.
    All logic is classical NLP (TF-IDF + cosine similarity).
    """

    # TF-IDF hyper-parameters (tuned for source code)
    _TFIDF_PARAMS = dict(
        analyzer="char_wb",    # character n-grams capture code structure well
        ngram_range=(3, 5),    # trigrams to 5-grams
        min_df=1,
        sublinear_tf=True,     # dampen very frequent tokens
        max_features=5000,
    )

    # ── Public API ────────────────────────────────────────────────────────────

    def detect(self, request: PlagiarismRequest) -> PlagiarismResponse:
        threshold = request.threshold
        submissions = request.submissions

        # Group by problemId
        problem_groups: Dict[str, List[Submission]] = {}
        for sub in submissions:
            problem_groups.setdefault(sub.problemId, []).append(sub)

        flagged: List[FlaggedPair] = []
        total_pairs = 0

        for problem_id, subs in problem_groups.items():
            if len(subs) < 2:
                continue   # need at least 2 to compare

            # Preprocess — group by language first for best normalisation
            processed: List[str] = []
            for sub in subs:
                processed.append(preprocess(sub.code, sub.language))

            # Build TF-IDF matrix
            vectorizer = TfidfVectorizer(**self._TFIDF_PARAMS)
            try:
                tfidf_matrix = vectorizer.fit_transform(processed)
            except ValueError:
                # All documents identical or empty after preprocessing
                continue

            # Pairwise cosine similarity
            sim_matrix = cosine_similarity(tfidf_matrix)

            # Iterate over upper triangle only
            n = len(subs)
            for i, j in combinations(range(n), 2):
                total_pairs += 1
                score = float(sim_matrix[i, j])
                if score >= threshold:
                    flagged.append(
                        FlaggedPair(
                            userA=subs[i].userId,
                            userB=subs[j].userId,
                            problemId=problem_id,
                            similarityScore=round(score, 4),
                            flag=True,
                            language=subs[i].language,
                        )
                    )

        # Sort by highest similarity first
        flagged.sort(key=lambda x: x.similarityScore, reverse=True)

        return PlagiarismResponse(
            contestId=request.contestId,
            totalSubmissionsChecked=len(submissions),
            totalPairsEvaluated=total_pairs,
            flaggedPairs=flagged,
            threshold=threshold,
        )
