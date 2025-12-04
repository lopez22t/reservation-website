/**
 * Reservations Routes
 * Handles room reservation bookings and management
 */
const express = require('express');
const { Reservation, Room, Building, User } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Helper function to check for booking conflicts
 * Ensures no double-booking of the same room at the same time
 */
const checkBookingConflict = async (roomId, reservationDate, startTime, endTime, excludeId = null) => {
    const query = {
        room: roomId,
        reservationDate: new Date(reservationDate),
        status: { $in: ['pending', 'confirmed'] }
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    // Get all reservations for this room on this date
    const conflicts = await Reservation.find(query);

    // Check if any reservation overlaps with requested time
    for (const existing of conflicts) {
        // Compare times (assuming HH:MM format)
        if (!(endTime <= existing.startTime || startTime >= existing.endTime)) {
            return true; // Conflict found
        }
    }

    return false; // No conflicts
};

/**
 * GET /api/reservations
 * Get user's reservations
 * Requires: Valid JWT token
 * @query {string} status - Filter by status (optional: pending, confirmed, cancelled, completed)
 * @query {string} from - Filter from date (optional, format: YYYY-MM-DD)
 * @query {string} to - Filter to date (optional, format: YYYY-MM-DD)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, from, to } = req.query;

        const filter = { user: req.user.userId };

        if (status) filter.status = status;

        if (from || to) {
            filter.reservationDate = {};
            if (from) filter.reservationDate.$gte = new Date(from);
            if (to) filter.reservationDate.$lte = new Date(to);
        }

        const reservations = await Reservation.find(filter)
            .populate('room', 'roomNumber capacity roomType occupancyStatus')
            .populate('building', 'name code')
            .sort({ reservationDate: 1, startTime: 1 });

        res.json({
            message: 'User reservations retrieved successfully',
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        console.error('Get reservations error:', error);
        res.status(500).json({ message: 'Error retrieving reservations' });
    }
});

/**
 * GET /api/reservations/:id
 * Get specific reservation details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('room', 'roomNumber capacity amenities')
            .populate('building', 'name code location');

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check if user owns this reservation (unless admin)
        if (reservation.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json({
            message: 'Reservation retrieved successfully',
            data: reservation
        });
    } catch (error) {
        console.error('Get reservation error:', error);
        res.status(500).json({ message: 'Error retrieving reservation' });
    }
});

/**
 * POST /api/reservations
 * Create a new room reservation
 * Requires: Valid JWT token
 * @body {string} room - Room ID
 * @body {string} building - Building ID
 * @body {string} reservationDate - Reservation date (YYYY-MM-DD)
 * @body {string} startTime - Start time (HH:MM)
 * @body {string} endTime - End time (HH:MM)
 * @body {string} purpose - Purpose of reservation
 * @body {number} numberOfPeople - Number of people
 * @body {string} notes - Optional notes
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { room, building, reservationDate, startTime, endTime, purpose, numberOfPeople, notes } = req.body;

        // Validate required fields
        if (!room || !building || !reservationDate || !startTime || !endTime || !purpose || !numberOfPeople) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify room exists and get capacity
        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if building exists
        const buildingData = await Building.findById(building);
        if (!buildingData) {
            return res.status(404).json({ message: 'Building not found' });
        }

        // Validate capacity
        if (numberOfPeople > roomData.capacity) {
            return res.status(400).json({
                message: `Room capacity is ${roomData.capacity}, requested ${numberOfPeople}`
            });
        }

        // Check for booking conflicts
        const hasConflict = await checkBookingConflict(room, reservationDate, startTime, endTime);
        if (hasConflict) {
            return res.status(409).json({ message: 'Time slot is already booked' });
        }

        // Calculate duration in minutes
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        if (duration <= 0) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        // Create reservation
        const reservation = new Reservation({
            user: req.user.userId,
            room,
            building,
            reservationDate: new Date(reservationDate),
            startTime,
            endTime,
            duration,
            purpose,
            numberOfPeople,
            notes,
            status: 'pending'
        });

        await reservation.save();

        const populatedReservation = await Reservation.findById(reservation._id)
            .populate('room', 'roomNumber')
            .populate('building', 'name');

        res.status(201).json({
            message: 'Reservation created successfully',
            data: populatedReservation
        });
    } catch (error) {
        console.error('Create reservation error:', error);
        res.status(500).json({ message: 'Error creating reservation' });
    }
});

/**
 * PUT /api/reservations/:id
 * Update reservation details (only if pending)
 * Requires: User owns reservation or is admin
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { startTime, endTime, numberOfPeople, notes, status } = req.body;

        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check authorization
        if (reservation.user.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Can only modify pending reservations
        if (reservation.status !== 'pending' && status !== 'confirmed') {
            return res.status(400).json({ message: 'Can only modify pending reservations' });
        }

        // If updating time, check for conflicts
        if (startTime || endTime) {
            const newStartTime = startTime || reservation.startTime;
            const newEndTime = endTime || reservation.endTime;

            const hasConflict = await checkBookingConflict(
                reservation.room.toString(),
                reservation.reservationDate,
                newStartTime,
                newEndTime,
                reservation._id
            );

            if (hasConflict) {
                return res.status(409).json({ message: 'New time slot is already booked' });
            }

            if (startTime) reservation.startTime = startTime;
            if (endTime) reservation.endTime = endTime;
        }

        // Validate capacity if updating numberOfPeople
        if (numberOfPeople) {
            const room = await Room.findById(reservation.room);
            if (numberOfPeople > room.capacity) {
                return res.status(400).json({
                    message: `Room capacity is ${room.capacity}`
                });
            }
            reservation.numberOfPeople = numberOfPeople;
        }

        if (notes) reservation.notes = notes;
        if (status && ['confirmed', 'cancelled'].includes(status)) {
            reservation.status = status;
        }

        await reservation.save();

        const updated = await Reservation.findById(reservation._id)
            .populate('room', 'roomNumber')
            .populate('building', 'name');

        res.json({
            message: 'Reservation updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Update reservation error:', error);
        res.status(500).json({ message: 'Error updating reservation' });
    }
});

/**
 * DELETE /api/reservations/:id
 * Cancel a reservation
 * Requires: User owns reservation or is admin
 * @body {string} reason - Cancellation reason
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Check authorization
        if (reservation.user.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Can only cancel pending or confirmed reservations
        if (!['pending', 'confirmed'].includes(reservation.status)) {
            return res.status(400).json({ message: 'Cannot cancel completed or already cancelled reservations' });
        }

        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelledBy = req.user.userId;
        reservation.cancelReason = reason || '';

        await reservation.save();

        res.json({
            message: 'Reservation cancelled successfully',
            data: reservation
        });
    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({ message: 'Error cancelling reservation' });
    }
});

/**
 * GET /api/reservations/room/:roomId
 * Get all reservations for a specific room (for calendar view)
 * @param {string} roomId - Room ID
 * @query {string} date - Filter by date (YYYY-MM-DD, optional)
 */
router.get('/room/:roomId', async (req, res) => {
    try {
        const { date } = req.query;

        const filter = {
            room: req.params.roomId,
            status: { $in: ['pending', 'confirmed'] }
        };

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            filter.reservationDate = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const reservations = await Reservation.find(filter)
            .populate('user', 'firstName lastName email')
            .sort({ startTime: 1 });

        res.json({
            message: 'Room reservations retrieved successfully',
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        console.error('Get room reservations error:', error);
        res.status(500).json({ message: 'Error retrieving room reservations' });
    }
});

module.exports = router;
