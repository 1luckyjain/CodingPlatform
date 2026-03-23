/**
 * backend/services/mlService.js
 * ─────────────────────────────
 * Node.js service layer that wraps all calls to the Python ML microservice.
 * Import this wherever you need ML features — never call Axios directly.
 *
 * Usage:
 *   const mlService = require('./services/mlService');
 *   const result = await mlService.checkPlagiarism(contestId, submissions);
 */

const axios = require('axios');

// ── Config ───────────────────────────────────────────────────────────────────
const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || '30000', 10); // 30 s

const mlClient = axios.create({
  baseURL: ML_BASE_URL,
  timeout: ML_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ── Error normaliser ──────────────────────────────────────────────────────────
function handleMLError(error, operation) {
  if (error.response) {
    // ML service returned an error response
    const msg = error.response.data?.detail || error.response.statusText;
    throw new Error(`ML service [${operation}] failed (${error.response.status}): ${msg}`);
  } else if (error.request) {
    throw new Error(`ML service [${operation}] unreachable — is it running at ${ML_BASE_URL}?`);
  }
  throw error;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. PLAGIARISM CHECK
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check a list of submissions for plagiarism.
 *
 * @param {string}   contestId   - MongoDB ObjectId string
 * @param {Array}    submissions - Array of { userId, problemId, code, language, submissionTime }
 * @param {number}   [threshold] - Similarity threshold [0,1], default 0.85
 *
 * @returns {Promise<{
 *   contestId: string,
 *   totalSubmissionsChecked: number,
 *   totalPairsEvaluated: number,
 *   flaggedPairs: Array<{
 *     userA: string, userB: string, problemId: string,
 *     similarityScore: number, flag: boolean, language: string
 *   }>,
 *   threshold: number
 * }>}
 */
async function checkPlagiarism(contestId, submissions, threshold = 0.85) {
  try {
    const { data } = await mlClient.post('/plagiarism-check', {
      contestId,
      submissions,
      threshold,
    });
    return data;
  } catch (err) {
    handleMLError(err, 'checkPlagiarism');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. PERFORMANCE PREDICTION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Predict a user's performance in an upcoming contest.
 *
 * @param {string}   userId
 * @param {object}   stats - {
 *   pastContestRanks: number[],
 *   averageSolveTime: number,       // minutes
 *   accuracyRate: number,           // 0–1
 *   numberOfProblemsSolved: number,
 *   consistencyScore: number,       // 0–1
 *   difficultyPreferenceScore: number, // 0–1
 *   totalContestsParticipated?: number
 * }
 *
 * @returns {Promise<{
 *   userId: string,
 *   expectedRank: number,
 *   solveProbability: number,
 *   difficultyHandlingScore: number,
 *   confidenceLevel: 'LOW'|'MEDIUM'|'HIGH',
 *   insights: string[]
 * }>}
 */
async function predictPerformance(userId, stats) {
  try {
    const { data } = await mlClient.post('/predict-performance', {
      userId,
      ...stats,
    });
    return data;
  } catch (err) {
    handleMLError(err, 'predictPerformance');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 3. HEALTH CHECK
// ────────────────────────────────────────────────────────────────────────────

/**
 * Ping the ML microservice.
 * @returns {Promise<boolean>}
 */
async function isMLServiceHealthy() {
  try {
    const { data } = await mlClient.get('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

module.exports = { checkPlagiarism, predictPerformance, isMLServiceHealthy };
