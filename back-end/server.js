/**
 * Main Express Server File
 * Initializes the backend server with MongoDB connection and middleware setup
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
// Security headers
app.use(helmet());

// Rate limiting - general API protection
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Enable CORS for cross-origin requests from frontend
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || false
        : ['http://localhost:5000', 'http://localhost:5001'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Serve front-end static files from sibling `front-end` directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../front-end')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../front-end/index.html')));

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB using connection string from environment variables
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-room-reservation')
    .then(() => logger.info('MongoDB connected successfully'))
    .catch(err => logger.error('MongoDB connection error:', err));

// ==================== API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));          // User login, signup, logout
app.use('/api/reservations', require('./routes/reservations'));  // Reservation CRUD operations
app.use('/api/rooms', require('./routes/rooms'));        // Room queries and occupancy
app.use('/api/buildings', require('./routes/buildings')); // Building information
app.use('/api/signin', require('./routes/signin'));      // Check-in/Check-out operations

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
