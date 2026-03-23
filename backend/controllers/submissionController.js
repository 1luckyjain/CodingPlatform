const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Contest = require('../models/Contest');
const codeExecutionService = require('../services/codeExecutionService');

/**
 * @desc    Submit code for a problem
 * @route   POST /api/submissions
 * @access  Private
 */
const submitCode = async (req, res, next) => {
    try {
        const { problemId, code, language, contestId } = req.body;

        // Find the problem
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        // Create submission record
        const submission = await Submission.create({
            userId: req.user.id,
            problemId,
            contestId: contestId || null,
            code,
            language,
            status: 'Running',
            testCasesTotal: problem.hiddenTestCases.length || problem.sampleTestCases.length,
        });

        // Update problem submission count
        await Problem.findByIdAndUpdate(problemId, { $inc: { totalSubmissions: 1 } });
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalSubmissions: 1 } });

        // Execute code against test cases
        const testCases = problem.hiddenTestCases.length > 0
            ? problem.hiddenTestCases
            : problem.sampleTestCases;

        const result = await codeExecutionService.executeCode({
            code,
            language,
            testCases,
            timeLimit: problem.timeLimit,     // milliseconds (e.g. 2000)
            memoryLimit: problem.memoryLimit, // MB (e.g. 256)
        });

        // Update submission with result
        const updatedSubmission = await Submission.findByIdAndUpdate(
            submission._id,
            {
                status: result.status,
                executionTime: result.executionTime,
                memoryUsed: result.memoryUsed,
                testCasesPassed: result.testCasesPassed,
                errorMessage: result.errorMessage || '',
                output: result.output || '',
            },
            { new: true }
        ).populate('userId', 'name').populate('problemId', 'title difficulty');

        // If accepted, update user stats
        if (result.status === 'Accepted') {
            await Problem.findByIdAndUpdate(problemId, { $inc: { acceptedSubmissions: 1 } });
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { totalAccepted: 1 },
                $addToSet: { solvedProblems: problemId },
            });

            // Update contest leaderboard if this is a contest submission
            if (contestId) {
                await updateContestLeaderboard(contestId, req.user.id, problemId);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Code executed successfully!',
            submission: updatedSubmission,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Run code (without submitting) against sample test cases
 * @route   POST /api/submissions/run
 * @access  Private
 */
const runCode = async (req, res, next) => {
    try {
        const { problemId, code, language, customInput } = req.body;

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        const isCustom = !!customInput;

        // Custom input: no expected output → comparison skipped
        const testCases = isCustom
            ? [{ input: customInput, output: '' }]
            : problem.sampleTestCases.slice(0, 3);

        const result = await codeExecutionService.executeCode({
            code,
            language,
            testCases,
            timeLimit: problem.timeLimit,
            memoryLimit: problem.memoryLimit,
        });

        // Custom input: don't show WA/AC verdict — just show raw output
        if (isCustom && (result.status === 'Accepted' || result.status === 'Wrong Answer')) {
            result.status = 'Completed';
            result.errorMessage = '';
        }

        res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all submissions for current user
 * @route   GET /api/submissions/my
 * @access  Private
 */
const getMySubmissions = async (req, res, next) => {
    try {
        const { problemId, page = 1, limit = 20 } = req.query;
        const query = { userId: req.user.id };

        if (problemId) query.problemId = problemId;

        const skip = (Number(page) - 1) * Number(limit);

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('problemId', 'title difficulty')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Submission.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            count: submissions.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            submissions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a specific submission
 * @route   GET /api/submissions/:id
 * @access  Private
 */
const getSubmission = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('userId', 'name')
            .populate('problemId', 'title difficulty');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found.' });
        }

        // Only allow the owner or host to view submission
        if (submission.userId._id.toString() !== req.user.id && req.user.role !== 'host') {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        res.status(200).json({ success: true, submission });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Update contest leaderboard after accepted submission
 */
const updateContestLeaderboard = async (contestId, userId, problemId) => {
    try {
        const contest = await Contest.findById(contestId);
        if (!contest) return;

        const existingEntry = contest.leaderboard.find(
            (entry) => entry.userId.toString() === userId.toString()
        );

        if (existingEntry) {
            existingEntry.problemsSolved += 1;
            existingEntry.score += 100;
        } else {
            contest.leaderboard.push({
                userId,
                score: 100,
                problemsSolved: 1,
            });
        }

        // Sort leaderboard by score descending
        contest.leaderboard.sort((a, b) => b.score - a.score);

        // Assign ranks
        contest.leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        await contest.save();
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
};

module.exports = { submitCode, runCode, getMySubmissions, getSubmission };
