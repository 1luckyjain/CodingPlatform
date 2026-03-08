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

    // ── Create Problems ───────────────────────────────────────
    const problems = await Problem.insertMany([
        {
            title: 'Two Sum',
            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
            difficulty: 'Easy',
            tags: ['arrays', 'hashing'],
            constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
            inputFormat: 'First line: space-separated integers (the array)\nSecond line: the target integer',
            outputFormat: 'Two space-separated indices',
            sampleTestCases: [
                { input: '2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
                { input: '3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
            ],
            hiddenTestCases: [
                { input: '3 3\n6', output: '0 1' },
                { input: '1 2 3 4 5\n9', output: '3 4' },
                { input: '-1 -2 -3 -4\n-7', output: '2 3' },
            ],
            createdBy: host._id,
            timeLimit: 2000,
            memoryLimit: 256,
            isPublished: true,
        },
        {
            title: 'Palindrome Check',
            description: 'Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.\n\nA phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
            difficulty: 'Easy',
            tags: ['strings', 'two-pointers'],
            constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
            inputFormat: 'A single line containing a string',
            outputFormat: 'true or false',
            sampleTestCases: [
                { input: 'racecar', output: 'true', explanation: 'racecar reads the same forwards and backwards' },
                { input: 'hello', output: 'false', explanation: 'hello is not a palindrome' },
            ],
            hiddenTestCases: [
                { input: 'A man a plan a canal Panama', output: 'true' },
                { input: 'race a car', output: 'false' },
                { input: 'Was it a car or a cat I saw', output: 'true' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Longest Substring Without Repeating Characters',
            description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
            difficulty: 'Medium',
            tags: ['strings', 'sliding-window', 'hashing'],
            constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
            inputFormat: 'A single string on one line',
            outputFormat: 'A single integer — the length of the longest substring without repeating characters',
            sampleTestCases: [
                { input: 'abcabcbb', output: '3', explanation: 'Substring "abc" has length 3' },
                { input: 'bbbbb', output: '1', explanation: 'Substring "b" has length 1' },
                { input: 'pwwkew', output: '3', explanation: 'Substring "wke" has length 3' },
            ],
            hiddenTestCases: [
                { input: '', output: '0' },
                { input: 'au', output: '2' },
                { input: 'dvdf', output: '3' },
                { input: 'abcdefg', output: '7' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Maximum Subarray',
            description: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.',
            difficulty: 'Medium',
            tags: ['dynamic-programming', 'arrays', 'kadane'],
            constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
            inputFormat: 'First line: n (number of elements)\nSecond line: n space-separated integers',
            outputFormat: 'A single integer — the maximum subarray sum',
            sampleTestCases: [
                { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: 'Subarray [4,-1,2,1] has the largest sum = 6' },
                { input: '1\n1', output: '1' },
                { input: '5\n5 4 -1 7 8', output: '23' },
            ],
            hiddenTestCases: [
                { input: '3\n-1 -2 -3', output: '-1' },
                { input: '4\n1 2 3 4', output: '10' },
                { input: '6\n-2 -3 4 -1 -2 1', output: '4' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Binary Search',
            description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with O(log n) runtime complexity.',
            difficulty: 'Easy',
            tags: ['binary-search', 'arrays'],
            constraints: '1 <= nums.length <= 10^4\nnums is sorted in ascending order\n-10^4 <= nums[i], target <= 10^4',
            inputFormat: 'First line: n and target\nSecond line: n sorted integers',
            outputFormat: 'The index of target, or -1',
            sampleTestCases: [
                { input: '6 9\n-1 0 3 5 9 12', output: '4', explanation: '9 is at index 4' },
                { input: '6 2\n-1 0 3 5 9 12', output: '-1', explanation: '2 does not exist in the array' },
            ],
            hiddenTestCases: [
                { input: '1 5\n5', output: '0' },
                { input: '3 3\n1 2 3', output: '2' },
                { input: '5 -1\n-5 -3 -1 0 2', output: '2' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Merge Two Sorted Lists',
            description: 'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.\n\nFor this simplified version, take two space-separated sorted arrays and output the merged sorted array.',
            difficulty: 'Easy',
            tags: ['linked-list', 'merge', 'sorting'],
            constraints: '0 <= list1.length, list2.length <= 50\n-100 <= Node.val <= 100\nBoth list1 and list2 are sorted in non-decreasing order.',
            inputFormat: 'First line: elements of list1 (space-separated, or "empty")\nSecond line: elements of list2 (space-separated, or "empty")',
            outputFormat: 'Merged sorted elements space separated',
            sampleTestCases: [
                { input: '1 2 4\n1 3 4', output: '1 1 2 3 4 4' },
                { input: 'empty\nempty', output: 'empty' },
                { input: 'empty\n0', output: '0' },
            ],
            hiddenTestCases: [
                { input: '1 3 5\n2 4 6', output: '1 2 3 4 5 6' },
                { input: '1\n2', output: '1 2' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Trapping Rain Water',
            description: 'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
            difficulty: 'Hard',
            tags: ['two-pointers', 'dynamic-programming', 'stack'],
            constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
            inputFormat: 'First line: n\nSecond line: n space-separated non-negative integers',
            outputFormat: 'A single integer — total water trapped',
            sampleTestCases: [
                { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', output: '6', explanation: '6 units of rain water are trapped.' },
                { input: '6\n4 2 0 3 2 5', output: '9' },
            ],
            hiddenTestCases: [
                { input: '3\n3 0 3', output: '3' },
                { input: '4\n1 0 1 0', output: '1' },
                { input: '1\n5', output: '0' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
        {
            title: 'Word Ladder',
            description: 'A transformation sequence from beginWord to endWord using a word list is a sequence of words such that each adjacent pair of words differs by exactly one letter, and every word in the sequence is in the word list.\n\nReturn the number of words in the shortest transformation sequence, or 0 if no such sequence exists.',
            difficulty: 'Hard',
            tags: ['bfs', 'graph', 'strings'],
            constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nAll words have the same length and contain only lowercase English letters.',
            inputFormat: 'First line: beginWord endWord\nSecond line: space-separated word list',
            outputFormat: 'A single integer — shortest transformation length',
            sampleTestCases: [
                { input: 'hit cog\nhot dot dog lot log cog', output: '5', explanation: 'hit -> hot -> dot -> dog -> cog (5 words)' },
                { input: 'hit cog\nhot dot dog lot log', output: '0', explanation: 'cog is not in the word list' },
            ],
            hiddenTestCases: [
                { input: 'a c\na b', output: '0' },
                { input: 'hot dog\nhot dog dot', output: '3' },
            ],
            createdBy: host._id,
            isPublished: true,
        },
    ]);

    console.log(`✅ Created ${problems.length} sample problems`);

    // ── Create a sample contest (upcoming) ────────────────────
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);  // 2 hours from now
    const endTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);  // 5 hours from now

    const contest = await Contest.create({
        title: 'Weekly Challenge #1',
        description: 'Welcome to the first weekly challenge! This contest features problems ranging from Easy to Hard. Compete against other programmers and earn your place on the leaderboard.',
        createdBy: host._id,
        problems: [problems[2]._id, problems[3]._id, problems[6]._id], // Medium + Hard
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

    // Past contest for analytics data
    const pastStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const pastContest = await Contest.create({
        title: 'Beginner Bootcamp',
        description: 'A beginner-friendly contest with easy problems to get you started on your competitive programming journey.',
        createdBy: host._id,
        problems: [problems[0]._id, problems[1]._id, problems[4]._id], // Easy problems
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

    // Update user solved problems
    await User.findByIdAndUpdate(user1._id, {
        $set: {
            solvedProblems: [problems[0]._id, problems[1]._id],
            totalSubmissions: 8,
            totalAccepted: 5,
            contestsParticipated: [pastContest._id],
        },
    });

    await User.findByIdAndUpdate(user2._id, {
        $set: {
            solvedProblems: [problems[0]._id],
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
  • ${problems.length} Problems (Easy/Medium/Hard)
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
