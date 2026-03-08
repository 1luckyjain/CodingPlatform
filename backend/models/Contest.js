const mongoose = require('mongoose');

/**
 * Contest Schema
 * Manages coding contests with participants and leaderboard
 */
const leaderboardEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    score: {
        type: Number,
        default: 0,
    },
    totalTime: {
        type: Number,
        default: 0, // Total time in seconds
    },
    problemsSolved: {
        type: Number,
        default: 0,
    },
    rank: {
        type: Number,
        default: 0,
    },
});

const contestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Contest title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Contest description is required'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        problems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Problem',
            },
        ],
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        leaderboard: [leaderboardEntrySchema],
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        rules: {
            type: String,
            default: '',
        },
        maxParticipants: {
            type: Number,
            default: 1000,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'past'],
            default: 'upcoming',
        },
        banner: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for status based on time
contestSchema.virtual('currentStatus').get(function () {
    const now = new Date();
    if (now < this.startTime) return 'upcoming';
    if (now > this.endTime) return 'past';
    return 'ongoing';
});

// Index for time-based queries
contestSchema.index({ startTime: 1 });
contestSchema.index({ endTime: 1 });
contestSchema.index({ status: 1 });

contestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Contest', contestSchema);
