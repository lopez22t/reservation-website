const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user account information including authentication credentials and profile details.
 * Supports three roles: student, admin, and staff.
 * Password is automatically hashed before saving to the database.
 */
const userSchema = new mongoose.Schema({
    // User's first name
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    // User's last name
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    // Email address - used for login and must be unique
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // Password - automatically hashed before saving (minimum 6 characters)
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // School/University student ID number
    studentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    // User role: 'student', 'admin', or 'staff'
    role: {
        type: String,
        enum: ['student', 'admin', 'staff'],
        default: 'student'
    },
    // User's contact phone number
    phone: {
        type: String,
        trim: true
    },
    // User's department/faculty
    department: {
        type: String,
        trim: true
    },
    // URL to user's profile picture
    profilePicture: {
        type: String,
        default: null
    },
    // Flag to deactivate user accounts without deleting data
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

/**
 * Middleware: Hash password before saving to database
 * Only hashes if password field has been modified
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to compare a provided password with the hashed password
 * Used during login to verify credentials
 * @param {string} candidatePassword - Password to verify
 * @returns {boolean} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to remove sensitive data (password) from user objects
 * Called automatically when user data is sent in API responses
 */
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
