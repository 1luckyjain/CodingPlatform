const express = require('express');
const {
    getOverview,
    getDailySubmissions,
    getDifficultyDistribution,
    getHostAnalytics,
    getGlobalLeaderboard,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route
router.get('/leaderboard', getGlobalLeaderboard);

// Host protected routes
router.get('/overview', protect, authorize('host'), getOverview);
router.get('/submissions/daily', protect, authorize('host'), getDailySubmissions);
router.get('/problems/difficulty', protect, authorize('host'), getDifficultyDistribution);
router.get('/host', protect, authorize('host'), getHostAnalytics);

module.exports = router;
