/**
 * Buildings Routes
 * Handles building information retrieval and management
 */
const express = require('express');
const { Building, Room } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/buildings
 * Get all buildings on campus
 * @query {boolean} active - Filter by active status (optional)
 */
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;

        // Build filter object
        const filter = {};
        if (active !== undefined) {
            filter.isActive = active === 'true';
        }

        const buildings = await Building.find(filter).sort({ name: 1 });

        res.json({
            message: 'Buildings retrieved successfully',
            count: buildings.length,
            data: buildings
        });
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ message: 'Error retrieving buildings' });
    }
});

/**
 * GET /api/buildings/:id
 * Get specific building details with rooms
 * @param {string} id - Building ID
 */
router.get('/:id', async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        // Get all rooms in this building
        const rooms = await Room.find({ building: req.params.id, isActive: true });

        res.json({
            message: 'Building retrieved successfully',
            data: {
                ...building.toObject(),
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

        // Verify building exists
        const building = await Building.findById(req.params.id);
        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        // Build filter for rooms
        const filter = { building: req.params.id, isActive: true };
        if (floor) filter.floor = parseInt(floor);
        if (status) filter.occupancyStatus = status;

        const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });

        res.json({
            message: 'Building rooms retrieved successfully',
            buildingName: building.name,
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
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create buildings' });
        }

        const { name, code, location, description, totalFloors } = req.body;

        if (!name || !code) {
            return res.status(400).json({ message: 'Building name and code are required' });
        }

        // Check if building already exists
        const existingBuilding = await Building.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
        if (existingBuilding) {
            return res.status(409).json({ message: 'Building with this name or code already exists' });
        }

        const building = new Building({
            name,
            code: code.toUpperCase(),
            location,
            description,
            totalFloors: totalFloors || 1
        });

        await building.save();

        res.status(201).json({
            message: 'Building created successfully',
            data: building
        });
    } catch (error) {
        console.error('Create building error:', error);
        res.status(500).json({ message: 'Error creating building' });
    }
});

/**
 * PUT /api/buildings/:id (Admin Only)
 * Update building information
 * Requires: Admin role
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update buildings' });
        }

        const { name, description, imageUrl, isActive, totalFloors } = req.body;

        let building = await Building.findById(req.params.id);
        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        if (name) building.name = name;
        if (description) building.description = description;
        if (imageUrl) building.imageUrl = imageUrl;
        if (isActive !== undefined) building.isActive = isActive;
        if (totalFloors) building.totalFloors = totalFloors;

        await building.save();

        res.json({
            message: 'Building updated successfully',
            data: building
        });
    } catch (error) {
        console.error('Update building error:', error);
        res.status(500).json({ message: 'Error updating building' });
    }
});

module.exports = router;
