const express = require('express');
const { body } = require('express-validator');
const {
    createProblem,
    getProblems,
    getProblem,
    updateProblem,
    deleteProblem,
    getMyProblems,
} = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const problemValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
    body('sampleTestCases').isArray({ min: 1 }).withMessage('At least one sample test case is required'),
    body('hiddenTestCases').isArray({ min: 1 }).withMessage('At least one hidden test case is required'),
];

// Public routes
router.get('/', getProblems);

// Protected routes (must be before /:id to prevent 'host' matching as an ID param)
router.get('/host/my-problems', protect, authorize('host'), getMyProblems);
router.post('/', protect, authorize('host'), problemValidation, createProblem);

// Parameterized routes
router.get('/:id', getProblem);
router.put('/:id', protect, authorize('host'), updateProblem);
router.delete('/:id', protect, authorize('host'), deleteProblem);

module.exports = router;
