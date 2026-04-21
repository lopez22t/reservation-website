/**
 * Buildings Routes
 * Handles building information retrieval and management
 */
const express = require('express');
const { Building, Room } = require('../models');

// Single-building mode: the app should operate only for this building
const MAIN_BUILDING_NAME = 'Pratt Music hall';

async function getMainBuilding() {
    let building = await Building.findOne({ name: MAIN_BUILDING_NAME });
    if (!building) {
        // Create a minimal default building if missing
        building = new Building({
            name: MAIN_BUILDING_NAME,
            code: 'PRATT',
            description: 'Main building: Pratt Music hall',
            totalFloors: 3,
            isActive: true
        });
        await building.save();
    }
    return building;
}
// Authentication removed for public endpoints

const router = express.Router();

/**
 * GET /api/buildings
 * Get all buildings on campus
 * @query {boolean} active - Filter by active status (optional)
 */
router.get('/', async (req, res) => {
    try {
        const building = await getMainBuilding();
        res.json({
            message: 'Building retrieved successfully',
            count: 1,
            data: building
        });
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ message: 'Error retrieving building' });
    }
});

/**
 * GET /api/buildings/:id
 * Get specific building details with rooms
 * @param {string} id - Building ID
 */
router.get('/:id', async (req, res) => {
    try {
        const mainBuilding = await getMainBuilding();

        const id = req.params.id.toString();
        if (id !== mainBuilding._id.toString() && id.toLowerCase() !== 'pratt' && id.toLowerCase() !== 'main') {
            return res.status(404).json({ message: 'Building not found in single-building mode' });
        }

        const rooms = await Room.find({ building: mainBuilding._id, isActive: true });

        res.json({
            message: 'Building retrieved successfully',
            data: {
                ...mainBuilding.toObject(),
                rooms: rooms
            }
        });
    } catch (error) {
        console.error('Get building error:', error);
        res.status(500).json({ message: 'Error retrieving building' });
    }
});

/**
 * GET /api/buildings/:id/rooms
 * Get all rooms in a specific building with occupancy information
 * @param {string} id - Building ID
 * @query {string} floor - Filter by floor number (optional)
 * @query {string} status - Filter by occupancy status (optional: available, occupied, maintenance)
 */
router.get('/:id/rooms', async (req, res) => {
    try {
        const { floor, status } = req.query;
        const mainBuilding = await getMainBuilding();

        // Verify requested id refers to the main building in single-building mode
        const id = req.params.id.toString();
        if (id !== mainBuilding._id.toString() && id.toLowerCase() !== 'pratt' && id.toLowerCase() !== 'main') {
            return res.status(404).json({ message: 'Building not found in single-building mode' });
        }

        // Build filter for rooms (force to main building)
        const filter = { building: mainBuilding._id, isActive: true };
        if (floor) filter.floor = parseInt(floor);
        if (status) filter.occupancyStatus = status;

        const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });

        res.json({
            message: 'Building rooms retrieved successfully',
            buildingName: mainBuilding.name,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        console.error('Get building rooms error:', error);
        res.status(500).json({ message: 'Error retrieving building rooms' });
    }
});

/**
 * POST /api/buildings (Admin Only)
 * Create a new building
 * Requires: Admin role
 * @body {string} name - Building name
 * @body {string} code - Building code
 * @body {object} location - Location details
 * @body {string} description - Building description
 * @body {number} totalFloors - Number of floors
 */
router.post('/', async (req, res) => {
    return res.status(403).json({ message: 'Single-building mode: building creation disabled' });
});

/**
 * PUT /api/buildings/:id (Admin Only)
 * Update building information
 * Requires: Admin role
 */
router.put('/:id', async (req, res) => {
    return res.status(403).json({ message: 'Single-building mode: building updates disabled' });
});

module.exports = router;
