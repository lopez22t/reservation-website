/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes that require authentication
 */
const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from request headers
 * Extracts user information from token and attaches to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header (format: "Bearer <token>")
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token using JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');

        // Attach user info to request object for use in route handlers
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
