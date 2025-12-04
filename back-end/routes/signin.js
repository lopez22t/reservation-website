/**
 * Sign-In Routes
 * Handles user check-in and check-out from reserved rooms
 */
const express = require('express');
const { SignIn, Reservation, Room, User } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/signin
 * Check in to a reserved room
 * Requires: Valid JWT token
 * @body {string} reservation - Reservation ID
 * @body {string} room - Room ID
 * @body {string} building - Building ID
 * @body {string} notes - Optional check-in notes
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { reservation, room, building, notes } = req.body;

        if (!reservation || !room || !building) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify reservation exists and belongs to user
        const reservationData = await Reservation.findById(reservation);
        if (!reservationData) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        if (reservationData.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check reservation status
        if (!['pending', 'confirmed'].includes(reservationData.status)) {
            return res.status(400).json({ message: 'Can only check in for pending or confirmed reservations' });
        }

        // Check if already checked in (no active sign-in for this reservation)
        const existingSignIn = await SignIn.findOne({
            reservation,
            status: 'active'
        });

        if (existingSignIn) {
            return res.status(400).json({ message: 'Already checked in for this reservation' });
        }

        // Create sign-in record
        const signIn = new SignIn({
            user: req.user.userId,
            reservation,
            room,
            building,
            signInTime: new Date(),
            notes: notes || '',
            status: 'active'
        });

        await signIn.save();

        // Update room occupancy
        let roomData = await Room.findById(room);
        roomData.currentOccupancy = (roomData.currentOccupancy || 0) + 1;
        await roomData.save();

        res.status(201).json({
            message: 'Check-in successful',
            data: {
                signInId: signIn._id,
                signInTime: signIn.signInTime,
                roomOccupancy: roomData.currentOccupancy
            }
        });
    } catch (error) {
        console.error('Sign-in error:', error);
        res.status(500).json({ message: 'Error during check-in' });
    }
});

/**
 * POST /api/signin/:id/checkout
 * Check out from a room
 * Requires: Valid JWT token
 * @param {string} id - SignIn record ID
 * @body {string} notes - Optional check-out notes
 */
router.post('/:id/checkout', authMiddleware, async (req, res) => {
    try {
        const { notes } = req.body;

        const signIn = await SignIn.findById(req.params.id);
        if (!signIn) {
            return res.status(404).json({ message: 'Check-in record not found' });
        }

        // Verify user owns this check-in
        if (signIn.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Can only checkout if active
        if (signIn.status !== 'active') {
            return res.status(400).json({ message: 'Check-in is not active' });
        }

        // Update sign-in record
        signIn.signOutTime = new Date();
        signIn.status = 'completed';
        if (notes) signIn.notes = notes;

        await signIn.save();

        // Update room occupancy
        let room = await Room.findById(signIn.room);
        room.currentOccupancy = Math.max(0, (room.currentOccupancy || 1) - 1);
        await room.save();

        // Update reservation status to completed
        const reservation = await Reservation.findById(signIn.reservation);
        if (reservation) {
            reservation.status = 'completed';
            reservation.checkInTime = signIn.signInTime;
            reservation.checkOutTime = signIn.signOutTime;
            await reservation.save();
        }

        res.json({
            message: 'Check-out successful',
            data: {
                signInId: signIn._id,
                signOutTime: signIn.signOutTime,
                actualDuration: signIn.actualDuration,
                roomOccupancy: room.currentOccupancy
            }
        });
    } catch (error) {
        console.error('Sign-out error:', error);
        res.status(500).json({ message: 'Error during check-out' });
    }
});

/**
 * GET /api/signin/history
 * Get user's check-in history
 * Requires: Valid JWT token
 * @query {string} from - From date (YYYY-MM-DD, optional)
 * @query {string} to - To date (YYYY-MM-DD, optional)
 * @query {string} status - Filter by status (optional: active, completed, abandoned)
 */
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { from, to, status } = req.query;

        const filter = { user: req.user.userId };

        if (status) filter.status = status;

        if (from || to) {
            filter.signInTime = {};
            if (from) filter.signInTime.$gte = new Date(from);
            if (to) filter.signInTime.$lte = new Date(to);
        }

        const signIns = await SignIn.find(filter)
            .populate('room', 'roomNumber')
            .populate('building', 'name code')
            .populate('reservation', 'purpose numberOfPeople')
            .sort({ signInTime: -1 });

        res.json({
            message: 'Sign-in history retrieved successfully',
            count: signIns.length,
            data: signIns
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'Error retrieving sign-in history' });
    }
});

/**
 * GET /api/signin/:id
 * Get specific sign-in record details
 * @param {string} id - SignIn ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const signIn = await SignIn.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('room', 'roomNumber capacity')
            .populate('building', 'name code')
            .populate('reservation', 'startTime endTime purpose');

        if (!signIn) {
            return res.status(404).json({ message: 'Check-in record not found' });
        }

        // Check authorization
        if (signIn.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json({
            message: 'Check-in record retrieved successfully',
            data: signIn
        });
    } catch (error) {
        console.error('Get sign-in error:', error);
        res.status(500).json({ message: 'Error retrieving sign-in record' });
    }
});

/**
 * PUT /api/signin/:id
 * Update sign-in notes (admin only for modification)
 * @param {string} id - SignIn ID
 * @body {string} notes - Updated notes
 * @body {string} status - Update status (optional, admin only)
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { notes, status } = req.body;

        const signIn = await SignIn.findById(req.params.id);
        if (!signIn) {
            return res.status(404).json({ message: 'Check-in record not found' });
        }

        // Users can only update their own notes
        if (signIn.user.toString() !== req.user.userId) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        if (notes) signIn.notes = notes;

        // Only admin can change status
        if (status && req.user.role === 'admin') {
            if (['active', 'completed', 'abandoned'].includes(status)) {
                signIn.status = status;
            }
        }

        await signIn.save();

        res.json({
            message: 'Check-in record updated successfully',
            data: signIn
        });
    } catch (error) {
        console.error('Update sign-in error:', error);
        res.status(500).json({ message: 'Error updating check-in record' });
    }
});

/**
 * GET /api/signin/room/:roomId
 * Get current occupancy and active check-ins for a room (for staff/admin)
 * @param {string} roomId - Room ID
 */
router.get('/room/:roomId', async (req, res) => {
    try {
        const activeSignIns = await SignIn.find({
            room: req.params.roomId,
            status: 'active'
        })
            .populate('user', 'firstName lastName email')
            .populate('reservation', 'purpose numberOfPeople');

        const room = await Room.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({
            message: 'Room occupancy data retrieved successfully',
            roomData: {
                roomId: room._id,
                currentOccupancy: room.currentOccupancy,
                capacity: room.capacity,
                occupancyStatus: room.occupancyStatus
            },
            activeUsers: activeSignIns,
            count: activeSignIns.length
        });
    } catch (error) {
        console.error('Get room occupancy error:', error);
        res.status(500).json({ message: 'Error retrieving room occupancy' });
    }
});

module.exports = router;
