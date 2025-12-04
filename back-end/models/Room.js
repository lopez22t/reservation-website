const mongoose = require('mongoose');

/**
 * Room Schema
 * Represents a study room within a building.
 * Tracks real-time occupancy status, amenities, capacity, and operating hours.
 * Supports multiple room types: study, lab, meeting, and group-study.
 */
const roomSchema = new mongoose.Schema({
    // Room identifier/number within the building (e.g., "101", "A205")
    roomNumber: {
        type: String,
        required: true,
        trim: true
    },
    // Reference to the building this room belongs to
    building: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        required: true
    },
    // Floor number where the room is located
    floor: {
        type: Number,
        required: true
    },
    // Maximum number of people the room can accommodate
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    // Type of room: study, lab, meeting, or group-study
    roomType: {
        type: String,
        enum: ['study', 'lab', 'meeting', 'group-study'],
        default: 'study'
    },
    // List of available amenities in the room
    amenities: [{
        type: String,
        enum: ['wifi', 'projector', 'whiteboard', 'computers', 'printer', 'ac', 'desks']
    }],
    // Current occupancy status: 'available', 'occupied', or 'maintenance'
    occupancyStatus: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    // Number of people currently in the room
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0
    },
    // Timestamp of last occupancy status update
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    // Operating hours for the room (24-hour format: HH:MM)
    operatingHours: {
        openTime: {
            type: String,
            default: '08:00'
        },
        closeTime: {
            type: String,
            default: '22:00'
        }
    },
    // Array of image URLs for the room
    images: [String],
    // Additional notes about the room
    notes: {
        type: String,
        trim: true
    },
    // Flag to deactivate room without deleting data
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
 * Middleware: Automatically update occupancy status based on current occupancy count
 * If currentOccupancy > 0, mark as 'occupied'
 * Otherwise mark as 'available' (unless already in maintenance)
 */
roomSchema.pre('save', function (next) {
    if (this.currentOccupancy > 0) {
        this.occupancyStatus = 'occupied';
    } else if (this.occupancyStatus !== 'maintenance') {
        this.occupancyStatus = 'available';
    }
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('Room', roomSchema);
