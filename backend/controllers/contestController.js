const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Submission = require('../models/Submission');
const mlService = require('../services/mlService');
 
/**
 * @desc    Create a new contest (Host only)
 * @route   POST /api/contests
 * @access  Private (Host)
 */
const createContest = async (req, res, next) => {
    try {
        const contest = await Contest.create({
            ...req.body,
            createdBy: req.user.id,
        });
 
        res.status(201).json({
            success: true,
            message: 'Contest created successfully!',
            contest,
        });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Get all contests with status filter
 * @route   GET /api/contests
 * @access  Public
 */
const getContests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
 
        // Auto-update contest statuses
        const now = new Date();
        await Contest.updateMany({ startTime: { $gt: now } }, { status: 'upcoming' });
        await Contest.updateMany({ startTime: { $lte: now }, endTime: { $gt: now } }, { status: 'ongoing' });
        await Contest.updateMany({ endTime: { $lte: now } }, { status: 'past' });
 
        const query = { isPublic: true };
        if (status && ['upcoming', 'ongoing', 'past'].includes(status)) {
            query.status = status;
        }
 
        const skip = (Number(page) - 1) * Number(limit);
 
        const [contests, total] = await Promise.all([
            Contest.find(query)
                .populate('createdBy', 'name')
                .populate('problems', 'title difficulty')
                .select('-leaderboard')
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Contest.countDocuments(query),
        ]);
 
        res.status(200).json({
            success: true,
            count: contests.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            contests,
        });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Get single contest by ID
 * @route   GET /api/contests/:id
 * @access  Public
 */
const getContest = async (req, res, next) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('problems', 'title difficulty tags totalSubmissions acceptedSubmissions')
            .populate('participants', 'name rating')
            .populate('leaderboard.userId', 'name rating avatar');
 
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        res.status(200).json({ success: true, contest });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Join a contest
 * @route   POST /api/contests/:id/join
 * @access  Private
 */
const joinContest = async (req, res, next) => {
    try {
        const contest = await Contest.findById(req.params.id);
 
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        if (contest.status === 'past') {
            return res.status(400).json({ success: false, message: 'This contest has already ended.' });
        }
 
        if (contest.participants.length >= contest.maxParticipants) {
            return res.status(400).json({ success: false, message: 'Contest is full.' });
        }
 
        // Check if already joined
        if (contest.participants.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You have already joined this contest.' });
        }
 
        // Add user to participants
        contest.participants.push(req.user.id);
        await contest.save();
 
        // Add contest to user's participated list
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { contestsParticipated: contest._id },
        });
 
        res.status(200).json({ success: true, message: 'Successfully joined the contest!' });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Get contest leaderboard
 * @route   GET /api/contests/:id/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .select('leaderboard title')
            .populate('leaderboard.userId', 'name rating avatar');
 
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        const leaderboard = contest.leaderboard.sort((a, b) => b.score - a.score);
 
        res.status(200).json({ success: true, leaderboard, contestTitle: contest.title });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Update a contest (Host only)
 * @route   PUT /api/contests/:id
 * @access  Private (Host)
 */
const updateContest = async (req, res, next) => {
    try {
        let contest = await Contest.findById(req.params.id);
 
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        if (contest.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
 
        contest = await Contest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
 
        res.status(200).json({ success: true, message: 'Contest updated!', contest });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Delete a contest (Host only)
 * @route   DELETE /api/contests/:id
 * @access  Private (Host)
 */
const deleteContest = async (req, res, next) => {
    try {
        const contest = await Contest.findById(req.params.id);
 
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        if (contest.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
 
        await contest.deleteOne();
 
        res.status(200).json({ success: true, message: 'Contest deleted.' });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Get contests created by host
 * @route   GET /api/contests/my-contests
 * @access  Private (Host)
 */
const getMyContests = async (req, res, next) => {
    try {
        const contests = await Contest.find({ createdBy: req.user.id })
            .populate('problems', 'title difficulty')
            .sort({ createdAt: -1 });
 
        res.status(200).json({ success: true, count: contests.length, contests });
    } catch (error) {
        next(error);
    }
};
 
/**
 * @desc    Run plagiarism check on all submissions of a contest
 * @route   POST /api/contests/:id/run-plagiarism-check
 * @access  Private (Host)
 */
const runPlagiarismCheck = async (req, res, next) => {
    try {
        const contestId = req.params.id;
        const { threshold = 0.85 } = req.body;
 
        // Check if contest exists
        const contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(404).json({ success: false, message: 'Contest not found.' });
        }
 
        // Fetch all submissions for this contest
        const submissions = await Submission.find({ contestId })
            .select('userId problemId code language submittedAt')
            .lean();
 
        if (submissions.length < 2) {
            return res.status(400).json({
                success: false,
                message: `Only ${submissions.length} submission(s) found. Need at least 2 to compare.`,
            });
        }
 
        // Check if ML service is running
        const isMLHealthy = await mlService.isMLServiceHealthy();
        if (!isMLHealthy) {
            return res.status(503).json({
                success: false,
                message: 'ML service is not running. Please start it on port 8000.',
            });
        }
 
        // Map to ML service schema
        const mlSubmissions = submissions.map(s => ({
            userId: s.userId.toString(),
            problemId: s.problemId.toString(),
            code: s.code,
            language: s.language,
            submissionTime: s.submittedAt?.toISOString(),
        }));
 
        // Call ML service
        const result = await mlService.checkPlagiarism(contestId, mlSubmissions, threshold);
 
        return res.status(200).json({
            success: true,
            message: `Plagiarism check complete. ${result.flaggedPairs.length} pair(s) flagged.`,
            ...result,
        });
 
    } catch (err) {
        next(err);
    }
};
 
module.exports = {
    createContest,
    getContests,
    getContest,
    joinContest,
    getLeaderboard,
    updateContest,
    deleteContest,
    getMyContests,
    runPlagiarismCheck,
};
 