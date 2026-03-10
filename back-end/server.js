/**
 * Main Express Server File
 * Initializes the backend server with MongoDB connection and middleware setup
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
// Enable CORS for cross-origin requests from frontend
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// Serve front-end static files from sibling `front-end` directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../front-end')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../front-end/index.html')));

// ==================== DATABASE CONNECTION ====================
// Connect to MongoDB using connection string from environment variables
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-room-reservation')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.log('MongoDB connection error:', err));

// ==================== API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));          // User login, signup, logout
app.use('/api/reservations', require('./routes/reservations'));  // Reservation CRUD operations
app.use('/api/rooms', require('./routes/rooms'));        // Room queries and occupancy
app.use('/api/buildings', require('./routes/buildings')); // Building information
app.use('/api/signin', require('./routes/signin'));      // Check-in/Check-out operations

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
