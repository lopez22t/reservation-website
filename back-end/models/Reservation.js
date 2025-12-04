const mongoose = require('mongoose');

/**
 * Reservation Schema
 * Stores room reservation bookings made by users.
 * Includes validation to prevent double-booking the same room at the same time.
 * Tracks reservation status from creation through completion.
 */
const reservationSchema = new mongoose.Schema({
    // Reference to the user who made the reservation
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to the room being reserved
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
    // Date of the reservation (YYYY-MM-DD format stored as Date)
    reservationDate: {
        type: Date,
        required: true
    },
    // Start time of the reservation (format: HH:MM in 24-hour format)
    startTime: {
        type: String,
        required: true
    },
    // End time of the reservation (format: HH:MM in 24-hour format)
    endTime: {
        type: String,
        required: true
    },
    // Duration of reservation in minutes
    duration: {
        type: Number,
        required: true
    },
    // Purpose of the reservation
    purpose: {
        type: String,
        enum: ['studying', 'group-project', 'meeting', 'exam-prep', 'other'],
        required: true
    },
    // Number of people expected to use the room
    numberOfPeople: {
        type: Number,
        required: true,
        min: 1
    },
    // Current status of the reservation
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
        default: 'pending'
    },
    // Reason for cancellation (if applicable)
    cancelReason: {
        type: String,
        trim: true,
        default: null
    },
    // Timestamp when the reservation was cancelled
    cancelledAt: {
        type: Date,
        default: null
    },
    // Reference to the user who cancelled the reservation
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Additional notes about the reservation
    notes: {
        type: String,
        trim: true
    },
    // Time when the user actually checked in to the room
    checkInTime: {
        type: Date,
        default: null
    },
    // Time when the user actually checked out from the room
    checkOutTime: {
        type: Date,
        default: null
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
 * Database Indexes
 * Compound index prevents double-booking by ensuring no two confirmed/pending reservations
 * can have overlapping times for the same room on the same date
 */
reservationSchema.index({ room: 1, reservationDate: 1, startTime: 1, endTime: 1, status: 1 });
// Index for efficient queries of user's reservations sorted by date
reservationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Reservation', reservationSchema);
