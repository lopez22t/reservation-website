/**
 * Rooms Routes
 * Handles room information and occupancy management
 */
const express = require('express');
const { Room, Building } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/rooms
 * Get all rooms with occupancy information
 * @query {string} building - Filter by building ID (optional)
 * @query {string} floor - Filter by floor number (optional)
 * @query {string} status - Filter by occupancy status (optional: available, occupied, maintenance)
 * @query {string} roomType - Filter by room type (optional: study, lab, meeting, group-study)
 * @query {number} minCapacity - Filter by minimum capacity (optional)
 */
router.get('/', async (req, res) => {
    try {
        const { building, floor, status, roomType, minCapacity } = req.query;

        // Build filter object
        const filter = { isActive: true };
        if (building) filter.building = building;
        if (floor) filter.floor = parseInt(floor);
        if (status) filter.occupancyStatus = status;
        if (roomType) filter.roomType = roomType;
        if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

        const rooms = await Room.find(filter)
            .populate('building', 'name code location')
            .sort({ building: 1, floor: 1, roomNumber: 1 });

        res.json({
            message: 'Rooms retrieved successfully',
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Error retrieving rooms' });
    }
});

/**
 * GET /api/rooms/available
 * Get only available rooms (quick search for booking)
 * @query {string} building - Filter by building ID (optional)
 * @query {number} minCapacity - Minimum capacity needed (optional)
 */
router.get('/available', async (req, res) => {
    try {
        const { building, minCapacity } = req.query;

        const filter = { isActive: true, occupancyStatus: 'available' };
        if (building) filter.building = building;
        if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

        const rooms = await Room.find(filter)
            .populate('building', 'name code')
            .sort({ building: 1, floor: 1 });

        res.json({
            message: 'Available rooms retrieved successfully',
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        console.error('Get available rooms error:', error);
        res.status(500).json({ message: 'Error retrieving available rooms' });
    }
});

/**
 * GET /api/rooms/:id
 * Get specific room details
 * @param {string} id - Room ID
 */
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('building', 'name code location');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({
            message: 'Room retrieved successfully',
            data: room
        });
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Error retrieving room' });
    }
});

/**
 * POST /api/rooms (Admin Only)
 * Create a new room
 * Requires: Admin role
 * @body {string} roomNumber - Room number/identifier
 * @body {string} building - Building ID
 * @body {number} floor - Floor number
 * @body {number} capacity - Room capacity
 * @body {string} roomType - Room type (study, lab, meeting, group-study)
 * @body {array} amenities - Array of amenities
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create rooms' });
        }

        const { roomNumber, building, floor, capacity, roomType, amenities, operatingHours } = req.body;

        if (!roomNumber || !building || floor === undefined || !capacity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify building exists
        const buildingExists = await Building.findById(building);
        if (!buildingExists) {
            return res.status(404).json({ message: 'Building not found' });
        }

        // Check for duplicate room in same building/floor
        const existingRoom = await Room.findOne({ building, floor, roomNumber });
        if (existingRoom) {
            return res.status(409).json({ message: 'Room already exists in this building/floor' });
        }

        const room = new Room({
            roomNumber,
            building,
            floor,
            capacity,
            roomType: roomType || 'study',
            amenities: amenities || [],
            operatingHours: operatingHours || { openTime: '08:00', closeTime: '22:00' }
        });

        await room.save();

        res.status(201).json({
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Error creating room' });
    }
});

/**
 * PUT /api/rooms/:id (Admin Only)
 * Update room information
 * Requires: Admin role
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update rooms' });
        }

        const { capacity, amenities, operatingHours, notes, isActive, occupancyStatus } = req.body;

        let room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (capacity) room.capacity = capacity;
        if (amenities) room.amenities = amenities;
        if (operatingHours) room.operatingHours = operatingHours;
        if (notes) room.notes = notes;
        if (isActive !== undefined) room.isActive = isActive;
        if (occupancyStatus && ['available', 'occupied', 'maintenance'].includes(occupancyStatus)) {
            room.occupancyStatus = occupancyStatus;
        }

        await room.save();

        res.json({
            message: 'Room updated successfully',
            data: room
        });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ message: 'Error updating room' });
    }
});

/**
 * PATCH /api/rooms/:id/occupancy
 * Update room occupancy status and count
 * Used to track real-time room usage
 * @param {string} id - Room ID
 * @body {number} currentOccupancy - Current number of people in room
 * @body {string} status - Occupancy status (optional)
 */
router.patch('/:id/occupancy', async (req, res) => {
    try {
        const { currentOccupancy, status } = req.body;

        let room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (currentOccupancy !== undefined) {
            room.currentOccupancy = Math.max(0, currentOccupancy);
        }

        if (status && ['available', 'occupied', 'maintenance'].includes(status)) {
            room.occupancyStatus = status;
        }

        room.lastUpdated = new Date();
        await room.save();

        res.json({
            message: 'Room occupancy updated successfully',
            data: {
                roomId: room._id,
                occupancyStatus: room.occupancyStatus,
                currentOccupancy: room.currentOccupancy,
                lastUpdated: room.lastUpdated
            }
        });
    } catch (error) {
        console.error('Update occupancy error:', error);
        res.status(500).json({ message: 'Error updating room occupancy' });
    }
});

module.exports = router;
