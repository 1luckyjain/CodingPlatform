const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Supports two roles: 'user' and 'host'
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password in queries
        },
        role: {
            type: String,
            enum: ['user', 'host'],
            default: 'user',
        },
        avatar: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            maxlength: [300, 'Bio cannot exceed 300 characters'],
            default: '',
        },
        rating: {
            type: Number,
            default: 1500,
        },
        solvedProblems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Problem',
            },
        ],
        totalSubmissions: {
            type: Number,
            default: 0,
        },
        totalAccepted: {
            type: Number,
            default: 0,
        },
        contestsParticipated: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Contest',
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for acceptance rate
userSchema.virtual('acceptanceRate').get(function () {
    if (this.totalSubmissions === 0) return 0;
    return ((this.totalAccepted / this.totalSubmissions) * 100).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);
