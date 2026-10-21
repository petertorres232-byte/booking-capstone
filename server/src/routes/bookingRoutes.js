// ==============================================================================
// APEX PERFORMANCE — BOOKING MANAGEMENT ROUTES (FULL CRUD)
// File Path: server/src/routes/bookingRoutes.js
// Base Route: /api/bookings
// ==============================================================================

import express from 'express';
import {
  createBooking,
  getMyBookings,
  updateBooking,
  cancelBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT authentication across all booking endpoints
router.use(protect);

/**
 * @route   POST /api/bookings
 * @desc    Create a new appointment booking (user derived from JWT)
 * @access  Private
 */
router.post('/', createBooking);

/**
 * @route   GET /api/bookings/mine
 * @desc    Get all bookings belonging to the logged-in user
 * @access  Private
 */
router.get('/mine', getMyBookings);

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update/reschedule an existing booking (Strict Ownership Check)
 * @access  Private
 */
router.patch('/:id', updateBooking);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel an existing booking (Strict Ownership Check)
 * @access  Private
 */
router.delete('/:id', cancelBooking);

export default router;