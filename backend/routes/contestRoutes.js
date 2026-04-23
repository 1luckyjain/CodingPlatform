const express = require('express');
const {
    createContest,
    getContests,
    getContest,
    joinContest,
    getLeaderboard,
    updateContest,
    deleteContest,
    getMyContests,
    runPlagiarismCheck,
} = require('../controllers/contestController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getContests);

// Protected routes (host only) — static paths MUST come before /:id
router.get('/host/my-contests', protect, authorize('host'), getMyContests);
router.post('/', protect, authorize('host'), createContest);

// Parameterized routes
router.get('/:id', getContest);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/:id/join', protect, joinContest);
router.put('/:id', protect, authorize('host'), updateContest);
router.delete('/:id', protect, authorize('host'), deleteContest);
router.post('/:id/run-plagiarism-check', protect, authorize('host'), runPlagiarismCheck);

module.exports = router;