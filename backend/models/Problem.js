const mongoose = require('mongoose');

/**
 * Problem Schema
 * Contains coding challenges with test cases
 */
const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        default: '',
    },
    output: {
        type: String,
        default: '',
    },
    explanation: {
        type: String,
        default: '',
    },
    isHidden: {
        type: Boolean,
        default: false,
    },
});

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Problem title is required'],
            trim: true,
            unique: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Problem description is required'],
            minlength: [10, 'Description must be at least 10 characters'],
        },
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            required: [true, 'Difficulty is required'],
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        constraints: {
            type: String,
            default: '',
        },
        inputFormat: {
            type: String,
            default: '',
        },
        outputFormat: {
            type: String,
            default: '',
        },
        sampleTestCases: [testCaseSchema],   // Visible to users
        hiddenTestCases: [testCaseSchema],   // Used for actual evaluation
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        totalSubmissions: {
            type: Number,
            default: 0,
        },
        acceptedSubmissions: {
            type: Number,
            default: 0,
        },
        timeLimit: {
            type: Number,
            default: 2000, // ms
        },
        memoryLimit: {
            type: Number,
            default: 256, // MB
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        contestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contest',
            default: null, // null means it's a standalone problem
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for acceptance rate
problemSchema.virtual('acceptanceRate').get(function () {
    if (this.totalSubmissions === 0) return 0;
    return ((this.acceptedSubmissions / this.totalSubmissions) * 100).toFixed(1);
});

problemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Problem', problemSchema);
