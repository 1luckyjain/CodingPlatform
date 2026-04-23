const express = require('express');
const { submitCode, runCode, getMySubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All submission routes require authentication
// Static routes MUST come before /:id
router.post('/run', protect, runCode);
router.get('/my', protect, getMySubmissions);
router.post('/', protect, submitCode);

// Parameterized routes
router.get('/:id', protect, getSubmission);

module.exports = router;
