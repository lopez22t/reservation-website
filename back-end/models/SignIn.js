const mongoose = require('mongoose');

/**
 * SignIn Schema
 * Records when users check in and out of reserved rooms.
 * Linked to reservations to ensure accountability and track actual room usage.
 * Calculates actual duration spent based on check-in/check-out times.
 */
const signInSchema = new mongoose.Schema({
    // Reference to the user checking in
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to the reservation associated with this check-in
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true
    },
    // Reference to the room being used
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    // Reference to the building containing the room
    building: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        required: true
    },
    // Timestamp when the user checked in to the room
    signInTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Timestamp when the user checked out (null until checkout)
    signOutTime: {
        type: Date,
        default: null
    },
    // Actual duration spent in the room in minutes (calculated at check-out)
    actualDuration: {
        type: Number,
        default: null
    },
    // Notes or comments about the visit
    notes: {
        type: String,
        trim: true
    },
    // Status of the check-in session: 'active' (ongoing), 'completed', or 'abandoned'
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
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
 * Middleware: Calculate actual duration spent when user checks out
 * Duration is calculated in minutes from signInTime to signOutTime
 */
signInSchema.pre('save', function (next) {
    if (this.signOutTime && this.signInTime) {
        this.actualDuration = Math.round((this.signOutTime - this.signInTime) / 60000); // Convert to minutes
    }
    next();
});

module.exports = mongoose.model('SignIn', signInSchema);
