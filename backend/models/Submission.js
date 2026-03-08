const mongoose = require('mongoose');

/**
 * Submission Schema
 * Tracks all code submissions with evaluation results
 */
const submissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true,
        },
        contestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contest',
            default: null,
        },
        code: {
            type: String,
            required: [true, 'Code is required'],
        },
        language: {
            type: String,
            enum: ['javascript', 'python', 'cpp', 'java', 'c'],
            required: [true, 'Language is required'],
        },
        status: {
            type: String,
            enum: [
                'Pending',
                'Running',
                'Accepted',
                'Wrong Answer',
                'Time Limit Exceeded',
                'Memory Limit Exceeded',
                'Compilation Error',
                'Runtime Error',
            ],
            default: 'Pending',
        },
        executionTime: {
            type: Number,
            default: 0, // ms
        },
        memoryUsed: {
            type: Number,
            default: 0, // MB
        },
        testCasesPassed: {
            type: Number,
            default: 0,
        },
        testCasesTotal: {
            type: Number,
            default: 0,
        },
        errorMessage: {
            type: String,
            default: '',
        },
        output: {
            type: String,
            default: '',
        },
        score: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast queries
submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ contestId: 1 });
submissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
