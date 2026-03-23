/**
 * backend/controllers/contestController.js  (ML-integrated sections)
 * ──────────────────────────────────────────────────────────────────
 * Example controller methods showing how to plug ML results into
 * your existing Express + MongoDB backend.
 */

const Contest      = require('../models/Contest');
const Submission   = require('../models/Submission');
const User         = require('../models/User');
const PlagiarismFlag = require('../models/PlagiarismFlag'); // new model — see below
const mlService    = require('../services/mlService');

// ────────────────────────────────────────────────────────────────────────────
// POST /api/contests/:contestId/run-plagiarism-check
// Admin-only — run after contest ends
// ────────────────────────────────────────────────────────────────────────────
exports.runPlagiarismCheck = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { threshold = 0.85 } = req.body;

    // 1. Fetch all submissions for this contest
    const submissions = await Submission.find({ contestId })
      .select('userId problemId code language submittedAt')
      .lean();

    if (submissions.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 submissions to compare.' });
    }

    // 2. Map to ML service schema
    const mlSubmissions = submissions.map(s => ({
      userId:         s.userId.toString(),
      problemId:      s.problemId.toString(),
      code:           s.code,
      language:       s.language,
      submissionTime: s.submittedAt?.toISOString(),
    }));

    // 3. Call ML service
    const result = await mlService.checkPlagiarism(contestId, mlSubmissions, threshold);

    // 4. Persist flagged pairs in MongoDB
    if (result.flaggedPairs.length > 0) {
      const docs = result.flaggedPairs.map(pair => ({
        contestId,
        problemId:       pair.problemId,
        userA:           pair.userA,
        userB:           pair.userB,
        similarityScore: pair.similarityScore,
        language:        pair.language,
        checkedAt:       new Date(),
        reviewed:        false,
      }));
      await PlagiarismFlag.insertMany(docs, { ordered: false });
    }

    return res.status(200).json({
      message: `Plagiarism check complete. ${result.flaggedPairs.length} pair(s) flagged.`,
      ...result,
    });
  } catch (err) {
    console.error('runPlagiarismCheck error:', err);
    return res.status(500).json({ message: err.message });
  }
};


// ────────────────────────────────────────────────────────────────────────────
// GET /api/users/:userId/performance-prediction
// User-facing — predict before a contest
// ────────────────────────────────────────────────────────────────────────────
exports.getPerformancePrediction = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Fetch user analytics from MongoDB
    const user = await User.findById(userId)
      .select('analytics')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const a = user.analytics || {};

    // 2. Map to ML service schema
    //    Adjust field names to match your actual User model
    const stats = {
      pastContestRanks:          a.pastContestRanks          ?? [100],
      averageSolveTime:          a.averageSolveTime          ?? 30,
      accuracyRate:              a.accuracyRate              ?? 0.5,
      numberOfProblemsSolved:    a.numberOfProblemsSolved    ?? 0,
      consistencyScore:          a.consistencyScore          ?? 0.3,
      difficultyPreferenceScore: a.difficultyPreferenceScore ?? 0.3,
      totalContestsParticipated: a.totalContestsParticipated ?? 0,
    };

    // 3. Call ML service
    const prediction = await mlService.predictPerformance(userId, stats);

    return res.status(200).json(prediction);
  } catch (err) {
    console.error('getPerformancePrediction error:', err);
    return res.status(500).json({ message: err.message });
  }
};
