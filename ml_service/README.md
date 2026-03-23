# 🧠 Coding Platform — ML Microservice

A production-quality Python FastAPI microservice that adds two ML capabilities
to your MERN coding platform:

| Endpoint | Purpose |
|---|---|
| `POST /plagiarism-check` | Detect code similarity across contest submissions |
| `POST /predict-performance` | Predict a user's expected contest performance |

---

## 📁 Folder Structure

```
ml_service/
├── main.py                          # FastAPI app entry point
├── requirements.txt
├── Dockerfile
│
├── schemas/
│   ├── plagiarism_schema.py         # Request / Response models for plagiarism
│   └── performance_schema.py        # Request / Response models for prediction
│
├── services/
│   ├── plagiarism_service.py        # TF-IDF + cosine similarity pipeline
│   └── performance_service.py       # GradientBoosting model + prediction logic
│
├── utils/
│   ├── code_preprocessor.py         # Comment stripping, identifier renaming
│   └── feature_engineering.py       # Feature vector builder + insight generator
│
├── data/
│   └── synthetic_data.py            # Synthetic training data (bootstraps model)
│
├── models/
│   └── performance_model.joblib     # ← auto-generated on first run
│
├── scripts/
│   └── train_performance_model.py   # Offline training CLI
│
└── node_integration/
    ├── mlService.js                  # Drop-in Node.js Axios wrapper
    ├── contestController_ml_example.js
    └── PlagiarismFlag.js             # Mongoose model for flagged pairs
```

---

## ⚙️ Local Setup

```bash
# 1. Create a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Pre-train the model from real data
python scripts/train_performance_model.py --data path/to/users.csv

# 4. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

---

## 🔌 Node.js Integration

### 1. Add env variable to your backend `.env`
```
ML_SERVICE_URL=http://localhost:8000
ML_TIMEOUT_MS=30000
```

### 2. Copy `node_integration/mlService.js` → `backend/services/mlService.js`

### 3. Use in your controllers

```js
const mlService = require('./services/mlService');

// Plagiarism check (after contest ends)
const result = await mlService.checkPlagiarism(contestId, submissions, 0.85);

// Performance prediction (before contest)
const prediction = await mlService.predictPerformance(userId, userStats);
```

---

## 📡 API Reference

### POST `/plagiarism-check`

**Request**
```json
{
  "contestId": "665abc123",
  "threshold": 0.85,
  "submissions": [
    {
      "userId": "u001",
      "problemId": "p001",
      "language": "python",
      "code": "def solve(n):\n    return n * 2",
      "submissionTime": "2024-06-01T10:00:00Z"
    }
  ]
}
```

**Response**
```json
{
  "contestId": "665abc123",
  "totalSubmissionsChecked": 40,
  "totalPairsEvaluated": 780,
  "threshold": 0.85,
  "flaggedPairs": [
    {
      "userA": "u001",
      "userB": "u007",
      "problemId": "p001",
      "similarityScore": 0.9312,
      "flag": true,
      "language": "python"
    }
  ]
}
```

---

### POST `/predict-performance`

**Request**
```json
{
  "userId": "u001",
  "pastContestRanks": [5, 3, 8, 2, 6],
  "averageSolveTime": 18.5,
  "accuracyRate": 0.74,
  "numberOfProblemsSolved": 87,
  "consistencyScore": 0.8,
  "difficultyPreferenceScore": 0.6,
  "totalContestsParticipated": 12
}
```

**Response**
```json
{
  "userId": "u001",
  "expectedRank": 4,
  "solveProbability": 0.891,
  "difficultyHandlingScore": 0.712,
  "confidenceLevel": "HIGH",
  "insights": [
    "📈 Your ranks are improving — you're on an upward trajectory.",
    "✅ High accuracy rate — your submissions are well thought out.",
    "🔥 Great consistency! Regular practice is your biggest strength.",
    "⚡ Impressive solve speed — keep optimising."
  ]
}
```

---

## 🤖 ML Architecture

### Task 1 — Plagiarism Detection

```
Submissions
    │
    ▼
Group by problemId
    │
    ▼  (per group)
Preprocess each code
  • Strip comments
  • Lowercase + whitespace collapse
  • Rename identifiers → var0, var1 ...
    │
    ▼
TF-IDF Vectorisation
  • char_wb n-grams (3–5)
  • 5000 max features
    │
    ▼
Pairwise Cosine Similarity matrix
    │
    ▼
Filter pairs ≥ threshold → FlaggedPairs[]
```

**Why TF-IDF + char n-grams?**
- Captures structural patterns regardless of variable names
- Doesn't require a pre-trained model (no cold-start problem)
- Runs in O(n²) per problem — fast enough for typical contest sizes (< 200 submissions)

---

### Task 2 — Performance Prediction

```
User Stats (MongoDB)
    │
    ▼
Feature Engineering (9 features)
  avg_rank_norm, rank_trend, rank_std,
  solve_time_norm, accuracy_rate,
  problems_solved_norm, consistency,
  difficulty_pref, contests_norm
    │
    ▼
GradientBoostingRegressor (MultiOutput)
  + MinMaxScaler Pipeline
    │
    ▼
3 Outputs:
  expectedRank (int)
  solveProbability (float)
  difficultyHandlingScore (float)
    │
    ▼
+ Insights (rule-based text from features)
+ ConfidenceLevel (LOW / MEDIUM / HIGH)
```

---

## 🐳 Docker Deployment

```bash
# Build image (auto-trains seed model)
docker build -t coding-platform-ml .

# Run container
docker run -p 8000:8000 coding-platform-ml

# With docker-compose (add to your existing compose file):
```

```yaml
# docker-compose.yml excerpt
services:
  ml-service:
    build: ./ml_service
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      - ML_SERVICE_URL=http://ml-service:8000
    depends_on:
      - ml-service
```

---

## 📈 Scalability Notes

| Concern | Solution |
|---|---|
| Plagiarism for 1000+ submissions | Batch by problem + run async in background job |
| Model retraining | Use `scripts/train_performance_model.py` nightly via cron |
| High traffic | Add `--workers 4` to uvicorn, or put behind gunicorn |
| Real embeddings | Swap TF-IDF for `codebert-base` embeddings (HuggingFace) |
| Production secrets | Use `python-dotenv` + environment variables |

---

## 🗃️ MongoDB — Storing Plagiarism Flags

Add the `PlagiarismFlag` Mongoose model from `node_integration/PlagiarismFlag.js`.

Key fields: `contestId`, `problemId`, `userA`, `userB`, `similarityScore`,
`verdict` (pending / confirmed / dismissed), `reviewed`.

Admin dashboard can then query:
```js
PlagiarismFlag.find({ contestId, verdict: 'pending' })
```
