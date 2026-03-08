const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');

/**
 * @desc    Get platform-wide analytics
 * @route   GET /api/analytics/overview
 * @access  Private (Host)
 */
const getOverview = async (req, res, next) => {
    try {
        const [totalUsers, totalProblems, totalSubmissions, totalContests] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Problem.countDocuments({ isPublished: true }),
            Submission.countDocuments(),
            Contest.countDocuments(),
        ]);

        const acceptedSubmissions = await Submission.countDocuments({ status: 'Accepted' });
        const acceptanceRate =
            totalSubmissions === 0 ? 0 : ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProblems,
                totalSubmissions,
                totalContests,
                acceptedSubmissions,
                acceptanceRate,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get daily submission stats for last 7 days
 * @route   GET /api/analytics/submissions/daily
 * @access  Private (Host)
 */
const getDailySubmissions = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dailyStats = await Submission.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    total: { $sum: 1 },
                    accepted: {
                        $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]);

        // Format dates for frontend
        const formatted = dailyStats.map((item) => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            total: item.total,
            accepted: item.accepted,
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get difficulty distribution of problems
 * @route   GET /api/analytics/problems/difficulty
 * @access  Private (Host)
 */
const getDifficultyDistribution = async (req, res, next) => {
    try {
        const distribution = await Problem.aggregate([
            { $match: { isPublished: true } },
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 },
                },
            },
        ]);

        res.status(200).json({ success: true, data: distribution });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get host-specific analytics (their problems and contests)
 * @route   GET /api/analytics/host
 * @access  Private (Host)
 */
const getHostAnalytics = async (req, res, next) => {
    try {
        const hostId = req.user.id;

        const [myProblems, myContests] = await Promise.all([
            Problem.find({ createdBy: hostId }),
            Contest.find({ createdBy: hostId }).populate('participants', 'name'),
        ]);

        const problemIds = myProblems.map((p) => p._id);
        const totalSubmissionsOnMyProblems = await Submission.countDocuments({
            problemId: { $in: problemIds },
        });
        const acceptedOnMyProblems = await Submission.countDocuments({
            problemId: { $in: problemIds },
            status: 'Accepted',
        });

        const totalParticipants = myContests.reduce(
            (sum, c) => sum + c.participants.length,
            0
        );

        res.status(200).json({
            success: true,
            data: {
                totalProblems: myProblems.length,
                totalContests: myContests.length,
                totalSubmissionsOnMyProblems,
                acceptedOnMyProblems,
                acceptanceRate:
                    totalSubmissionsOnMyProblems === 0
                        ? 0
                        : ((acceptedOnMyProblems / totalSubmissionsOnMyProblems) * 100).toFixed(1),
                totalParticipants,
                problems: myProblems.map((p) => ({
                    title: p.title,
                    difficulty: p.difficulty,
                    totalSubmissions: p.totalSubmissions,
                    acceptedSubmissions: p.acceptedSubmissions,
                })),
                contests: myContests.map((c) => ({
                    title: c.title,
                    status: c.status,
                    participants: c.participants.length,
                    problems: c.problems.length,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get global leaderboard (top users by rating/solved)
 * @route   GET /api/analytics/leaderboard
 * @access  Public
 */
const getGlobalLeaderboard = async (req, res, next) => {
    try {
        const users = await User.find({ role: 'user', isActive: true })
            .select('name rating totalAccepted totalSubmissions solvedProblems avatar')
            .sort({ rating: -1, totalAccepted: -1 })
            .limit(100);

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            avatar: user.avatar,
            rating: user.rating,
            solved: user.solvedProblems.length,
            submissions: user.totalSubmissions,
            accepted: user.totalAccepted,
        }));

        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getDailySubmissions,
    getDifficultyDistribution,
    getHostAnalytics,
    getGlobalLeaderboard,
};
