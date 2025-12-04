/**
 * Authentication Routes
 * Handles user registration, login, and authentication-related operations
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user account
 * @body {string} firstName - User's first name
 * @body {string} lastName - User's last name
 * @body {string} email - User's email (unique)
 * @body {string} password - User's password (min 6 characters)
 * @body {string} studentId - Optional student ID
 * @body {string} phone - Optional phone number
 * @body {string} department - Optional department
 */
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, studentId, phone, department } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            studentId,
            phone,
            department,
            role: 'student'
        });

        // Save user to database (password will be hashed automatically by schema middleware)
        await user.save();

        // Generate JWT token for immediate login
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user account' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 * @body {string} email - User's email
 * @body {string} password - User's password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Compare provided password with hashed password in database
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile information
 * Requires: Valid JWT token in Authorization header
 */
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile retrieved successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error retrieving profile' });
    }
});

/**
 * PUT /api/auth/profile
 * Update current user's profile information
 * Requires: Valid JWT token in Authorization header
 * @body {string} firstName - Updated first name
 * @body {string} lastName - Updated last name
 * @body {string} phone - Updated phone number
 * @body {string} department - Updated department
 * @body {string} profilePicture - Updated profile picture URL
 */
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, phone, department, profilePicture } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update allowed fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        if (department) user.department = department;
        if (profilePicture) user.profilePicture = profilePicture;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

/**
 * POST /api/auth/change-password
 * Change user's password
 * Requires: Valid JWT token in Authorization header
 * @body {string} oldPassword - Current password
 * @body {string} newPassword - New password (min 6 characters)
 */
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
});

module.exports = router;
