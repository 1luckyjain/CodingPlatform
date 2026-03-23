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
router.get('/:id', getContest);
router.get('/:id/leaderboard', getLeaderboard);

// Protected routes (user)
router.post('/:id/join', protect, joinContest);

// Protected routes (host only)
router.get('/host/my-contests', protect, authorize('host'), getMyContests);
router.post('/', protect, authorize('host'), createContest);
router.put('/:id', protect, authorize('host'), updateContest);
router.delete('/:id', protect, authorize('host'), deleteContest);
router.post('/:id/run-plagiarism-check', protect, authorize('host'), runPlagiarismCheck);

module.exports = router;