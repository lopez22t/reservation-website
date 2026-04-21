const mongoose = require('mongoose');

/**
 * Building Schema
 * Represents a physical building on campus that contains study rooms.
 * Each building has a unique name, code, and can contain multiple rooms across different floors.
 */
const buildingSchema = new mongoose.Schema({
    // Building name (e.g., "Engineering Building", "Library Annex")
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Short building code for identification (e.g., "ENG", "LIB") - automatically uppercase
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    // Building location details including GPS coordinates for mapping
    location: {
        street: String,
        city: String,
        postalCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    // Detailed description of the building
    description: {
        type: String,
        trim: true
    },
    // Total number of floors in the building
    totalFloors: {
        type: Number,
        default: 1
    },
    // URL to building image/photo
    imageUrl: {
        type: String,
        default: null
    },
    // Flag to deactivate building without deleting data
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

module.exports = mongoose.model('Building', buildingSchema);
