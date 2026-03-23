const { validationResult } = require('express-validator');
const Problem = require('../models/Problem');

/**
 * @desc    Create a new problem (Host only)
 * @route   POST /api/problems
 * @access  Private (Host)
 */
const createProblem = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const problem = await Problem.create({
            ...req.body,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Problem created successfully!',
            problem,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all problems with search and filter
 * @route   GET /api/problems
 * @access  Public
 */
const getProblems = async (req, res, next) => {
    try {
        const { search, difficulty, tag, page = 1, limit = 20 } = req.query;

        const query = { isPublished: true };

        // Search by title
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Filter by difficulty
        if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            query.difficulty = difficulty;
        }

        // Filter by tag
        if (tag) {
            query.tags = { $in: [tag] };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [problems, total] = await Promise.all([
            Problem.find(query)
                .select('-hiddenTestCases -sampleTestCases')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Problem.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            count: problems.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            problems,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single problem by ID
 * @route   GET /api/problems/:id
 * @access  Public
 */
const getProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate('createdBy', 'name')
            .select('-hiddenTestCases'); // Never expose hidden test cases

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        res.status(200).json({ success: true, problem });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a problem (Host only, own problems)
 * @route   PUT /api/problems/:id
 * @access  Private (Host)
 */
const updateProblem = async (req, res, next) => {
    try {
        let problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        // Ensure host owns this problem
        if (problem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this problem.' });
        }

        problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, message: 'Problem updated!', problem });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a problem (Host only, own problems)
 * @route   DELETE /api/problems/:id
 * @access  Private (Host)
 */
const deleteProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found.' });
        }

        // Ensure host owns this problem
        if (problem.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this problem.' });
        }

        await problem.deleteOne();

        res.status(200).json({ success: true, message: 'Problem deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get problems created by the current host
 * @route   GET /api/problems/my-problems
 * @access  Private (Host)
 */
const getMyProblems = async (req, res, next) => {
    try {
        const problems = await Problem.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: problems.length, problems });
    } catch (error) {
        next(error);
    }
};

module.exports = { createProblem, getProblems, getProblem, updateProblem, deleteProblem, getMyProblems };
