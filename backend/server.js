require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const contestRoutes = require('./routes/contestRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { testPistonConnection } = require('./services/codeExecutionService');

// Connect to MongoDB
connectDB();

const app = express();

// =============================================
//  SECURITY MIDDLEWARE
// =============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS — allow any localhost port in dev, specific origin in prod
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://coding-platform-theta-inky.vercel.app',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Postman)
            if (!origin) return callback(null, true);
            // Allow any localhost origin in development
            if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error(`CORS: Origin '${origin}' not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Trust proxy (required for Render, Heroku, etc.) so rate-limiting sees the real client IP
app.set('trust proxy', 1);

// Global rate limiting (100 requests per 15 minutes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
});

// Rate limit for code submissions
const submissionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many submissions, please wait a moment.' },
});

app.use('/api', globalLimiter);

// =============================================
//  GENERAL MIDDLEWARE
// =============================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// =============================================
//  API ROUTES
// =============================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionLimiter, submissionRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 CodingCollege API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// =============================================
//  ERROR HANDLING
// =============================================

app.use(notFound);
app.use(errorHandler);

// =============================================
//  START SERVER
// =============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
    // Test Piston connection
    await testPistonConnection();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err.message);
    server.close(() => process.exit(1));
});

module.exports = app;
