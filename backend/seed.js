/**
 * Seed Script
 * Populates the database with sample data for development/testing.
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Problem = require('./models/Problem');
const Contest = require('./models/Contest');
const connectDB = require('./config/db');
const problemsData = require('./problems.json');

const seed = async () => {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Clear existing data
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Contest.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Create Users ──────────────────────────────────────────
    const host = await User.create({
        name: 'Demo Host',
        email: 'host@demo.com',
        password: 'demo123',
        role: 'host',
        rating: 2000,
    });

    const user1 = await User.create({
        name: 'Alice Johnson',
        email: 'user@demo.com',
        password: 'demo123',
        role: 'user',
        rating: 1650,
        bio: 'Passionate about algorithms and competitive programming.',
    });

    const user2 = await User.create({
        name: 'Bob Smith',
        email: 'bob@demo.com',
        password: 'demo123',
        role: 'user',
        rating: 1420,
        bio: 'Software engineer with love for clean code.',
    });

    console.log('✅ Created users: host@demo.com, user@demo.com, bob@demo.com (all passwords: demo123)');

    // ── Create Problems from JSON ─────────────────────────────
    const problems = await Problem.insertMany(
        problemsData.map(p => ({ ...p, createdBy: host._id }))
    );
    console.log(`✅ Created ${problems.length} problems`);

    // ── Find specific problems for contests by title ──────────
    const twoSum        = problems.find(p => p.title === 'Two Sum');
    const palindrome    = problems.find(p => p.title === 'Palindrome Check');
    const binarySearch  = problems.find(p => p.title === 'Binary Search');
    const maxSubarray   = problems.find(p => p.title === 'Maximum Subarray (Kadane\'s Algorithm)');
    const longestSub    = problems.find(p => p.title === 'Longest Substring Without Repeating Characters');
    const trapping      = problems.find(p => p.title === 'Trapping Rain Water');
    const nQueens       = problems.find(p => p.title === 'N-Queens Problem');

    // ── Create a sample contest (upcoming) ────────────────────
    const now       = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const endTime   = new Date(now.getTime() + 5 * 60 * 60 * 1000); // 5 hours from now

    const contest = await Contest.create({
        title: 'Weekly Challenge #1',
        description: 'Welcome to the first weekly challenge! This contest features problems ranging from Easy to Hard. Compete against other programmers and earn your place on the leaderboard.',
        createdBy: host._id,
        problems: [
            longestSub?._id,
            maxSubarray?._id,
            trapping?._id,
        ].filter(Boolean),
        startTime,
        endTime,
        rules: `
• Each accepted submission earns 100 points.
• Fastest correct solution gets a time bonus.
• No external libraries are allowed.
• You may submit as many times as you want — only your best attempt counts.
• Plagiarism will result in disqualification.
        `.trim(),
        isPublic: true,
        maxParticipants: 500,
        status: 'upcoming',
    });

    // ── Past contest for analytics data ───────────────────────
    const pastStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const pastEnd   = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const pastContest = await Contest.create({
        title: 'Beginner Bootcamp',
        description: 'A beginner-friendly contest with easy problems to get you started on your competitive programming journey.',
        createdBy: host._id,
        problems: [
            twoSum?._id,
            palindrome?._id,
            binarySearch?._id,
        ].filter(Boolean),
        startTime: pastStart,
        endTime: pastEnd,
        participants: [user1._id, user2._id],
        leaderboard: [
            { userId: user1._id, score: 200, problemsSolved: 2, rank: 1 },
            { userId: user2._id, score: 100, problemsSolved: 1, rank: 2 },
        ],
        isPublic: true,
        status: 'past',
    });

    // ── Update user solved problems ───────────────────────────
    await User.findByIdAndUpdate(user1._id, {
        $set: {
            solvedProblems: [twoSum?._id, palindrome?._id].filter(Boolean),
            totalSubmissions: 8,
            totalAccepted: 5,
            contestsParticipated: [pastContest._id],
        },
    });

    await User.findByIdAndUpdate(user2._id, {
        $set: {
            solvedProblems: [twoSum?._id].filter(Boolean),
            totalSubmissions: 4,
            totalAccepted: 2,
            contestsParticipated: [pastContest._id],
        },
    });

    console.log('✅ Created 2 sample contests (1 upcoming, 1 past)');

    console.log(`
══════════════════════════════════════════
  ✅  Seed Complete!
══════════════════════════════════════════

  Demo Accounts:
  ┌─────────────────────────────────────┐
  │  Host:  host@demo.com / demo123     │
  │  User:  user@demo.com / demo123     │
  │  User:  bob@demo.com  / demo123     │
  └─────────────────────────────────────┘

  Created:
  • ${problems.length} Problems (Easy / Medium / Hard)
  • 2 Contests (Upcoming / Past)
  • 3 Users

  Start the backend:  npm run dev
  Start the frontend: npm start (in /frontend)
══════════════════════════════════════════
    `);

    mongoose.connection.close();
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    mongoose.connection.close();
    process.exit(1);
});
