/**
 * backend/models/PlagiarismFlag.js
 * ─────────────────────────────────
 * Stores pairs flagged by the ML plagiarism service.
 * Admins can review and mark them as confirmed or dismissed.
 */

const mongoose = require('mongoose');

const plagiarismFlagSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    language: {
      type: String,
      enum: ['python', 'cpp', 'java', 'js', 'c'],
    },
    // Admin review fields
    reviewed: {
      type: Boolean,
      default: false,
    },
    verdict: {
      type: String,
      enum: ['pending', 'confirmed', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: String,
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate flags for the same pair in the same contest+problem
plagiarismFlagSchema.index(
  { contestId: 1, problemId: 1, userA: 1, userB: 1 },
  { unique: true }
);

module.exports = mongoose.model('PlagiarismFlag', plagiarismFlagSchema);
