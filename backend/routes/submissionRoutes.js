const express = require('express');
const { submitCode, runCode, getMySubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All submission routes require authentication
router.post('/', protect, submitCode);
router.post('/run', protect, runCode);
router.get('/my', protect, getMySubmissions);
router.get('/:id', protect, getSubmission);

module.exports = router;
