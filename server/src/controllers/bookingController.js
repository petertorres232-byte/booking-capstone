// ==============================================================================
// APEX PERFORMANCE — BOOKING MANAGEMENT CONTROLLER (FULL CRUD)
// File Path: server/src/controllers/bookingController.js
// ==============================================================================

import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

// A MongoDB ObjectId is exactly 24 hexadecimal characters
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

/**
 * Helper: Require a plain 24-character hex string.
 * Rejects objects/arrays (for example {"$ne": null}) so they can never be
 * interpreted as MongoDB query operators.
 */
const requireObjectIdString = (value, fieldName) => {
  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw new ApiError(400, `Invalid ${fieldName}. Please provide a valid ${fieldName}.`);
  }
  return value;
};

/**
 * Helper: Notes must be plain text when provided. Returns a trimmed string.
 */
const parseNotes = (rawNotes) => {
  if (rawNotes === undefined || rawNotes === null) {
    return '';
  }
  if (typeof rawNotes !== 'string') {
    throw new ApiError(400, 'Notes must be text');
  }
  return rawNotes.trim();
};

/**
 * Helper: Parse and validate a future appointment startTime
 * Returns a valid Date object or throws a 400 ApiError.
 */
const parseFutureStartTime = (rawStartTime) => {
  if (rawStartTime === undefined || rawStartTime === null || rawStartTime === '') {
    throw new ApiError(400, 'Please provide an appointment startTime');
  }

  if (typeof rawStartTime !== 'string') {
    throw new ApiError(400, 'Invalid startTime date format. Please use ISO 8601 format.');
  }

  const parsedDate = new Date(rawStartTime);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, 'Invalid startTime date format. Please use ISO 8601 format.');
  }

  if (parsedDate.getTime() <= Date.now()) {
    throw new ApiError(400, 'Appointment startTime must be scheduled in the future');
  }

  return parsedDate;
};

/**
 * Helper: Check for overlapping active bookings for the same service
 * Excludes cancelled bookings and optionally excludes a specific bookingId (during reschedule)
 */
const findOverlappingBooking = async ({
  serviceId,
  newStartTime,
  newEndTime,
  excludeBookingId = null
}) => {
  const conflictQuery = {
    service: serviceId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: newEndTime },
    endTime: { $gt: newStartTime }
  };

  if (excludeBookingId) {
    conflictQuery._id = { $ne: excludeBookingId };
  }

  return Booking.findOne(conflictQuery);
};

/**
 * @desc    Create a new service appointment booking
 * @route   POST /api/bookings
 * @access  Private (Authenticated Client — user derived strictly from req.user.id)
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, startTime, notes } = req.body;

  if (serviceId === undefined || serviceId === null || serviceId === '') {
    throw new ApiError(400, 'Please provide a serviceId');
  }

  // 0. Type-check every client-controlled value before it can reach a query
  const safeServiceId = requireObjectIdString(serviceId, 'serviceId');
  const safeNotes = parseNotes(notes);

  // 1. Validate future startTime
  const parsedStartTime = parseFutureStartTime(startTime);

  // 2. Verify target service exists and is active in MongoDB
  const service = await Service.findById(safeServiceId);
  if (!service || !service.isActive) {
    throw new ApiError(404, 'Selected service was not found or is no longer active');
  }

  // 3. Compute deterministic endTime on the server (startTime + durationMinutes)
  const durationMs = service.durationMinutes * 60 * 1000;
  const computedEndTime = new Date(parsedStartTime.getTime() + durationMs);

  // 4. Check for scheduling conflicts / double-booking on this service
  const conflictingBooking = await findOverlappingBooking({
    serviceId: service._id,
    newStartTime: parsedStartTime,
    newEndTime: computedEndTime
  });

  if (conflictingBooking) {
    throw new ApiError(
      409,
      'This time slot overlaps with an existing confirmed appointment for this service. Please choose a different time.'
    );
  }

  // 5. Create booking with server-derived user ID and price/duration snapshots
  const booking = await Booking.create({
    user: req.user.id,
    service: service._id,
    startTime: parsedStartTime,
    endTime: computedEndTime,
    status: 'confirmed',
    priceAtBooking: service.price,
    durationMinutes: service.durationMinutes,
    notes: safeNotes
  });

  // Populate service details for immediate UI confirmation rendering
  await booking.populate('service', 'name category coachName durationMinutes price');

  res.status(201).json({
    status: 'success',
    message: 'Appointment booked successfully',
    booking
  });
});

/**
 * @desc    Get all bookings belonging to the currently logged-in user
 * @route   GET /api/bookings/mine
 * @access  Private
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('service', 'name category description coachName durationMinutes price')
    .sort({ startTime: 1 });

  res.status(200).json({
    status: 'success',
    count: bookings.length,
    bookings
  });
});

/**
 * @desc    Update/reschedule an existing booking (startTime and/or notes)
 * @route   PATCH /api/bookings/:id
 * @access  Private (Strict Ownership Check)
 */
export const updateBooking = asyncHandler(async (req, res) => {
  const { startTime, notes } = req.body;

  if (startTime === undefined && notes === undefined) {
    throw new ApiError(400, 'Please provide a new startTime or notes to update');
  }

  // 0. Type-check client-controlled values before using them
  const safeNotes = notes !== undefined ? parseNotes(notes) : undefined;
  const bookingId = requireObjectIdString(req.params.id, 'booking id');

  // 1. Find existing booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // 2. Enforce strict ownership (or admin role)
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to modify another user’s booking');
  }

  // 3. Prevent modifying a cancelled or completed booking
  if (booking.status !== 'confirmed') {
    throw new ApiError(
      400,
      `Cannot reschedule or edit a booking with status '${booking.status}'`
    );
  }

  // 4. If rescheduling startTime, validate future date and check overlaps
  if (startTime !== undefined) {
    const newStartTime = parseFutureStartTime(startTime);
    const durationMs = booking.durationMinutes * 60 * 1000;
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    const conflictingBooking = await findOverlappingBooking({
      serviceId: booking.service,
      newStartTime,
      newEndTime,
      excludeBookingId: booking._id
    });

    if (conflictingBooking) {
      throw new ApiError(
        409,
        'The requested new time slot overlaps with an existing appointment for this service.'
      );
    }

    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
  }

  // 5. If updating coaching/recovery notes
  if (safeNotes !== undefined) {
    booking.notes = safeNotes;
  }

  await booking.save();
  await booking.populate('service', 'name category description coachName durationMinutes price');

  res.status(200).json({
    status: 'success',
    message: 'Booking updated successfully',
    booking
  });
});

/**
 * @desc    Cancel an existing booking (Soft-Cancel to preserve history)
 * @route   DELETE /api/bookings/:id
 * @access  Private (Strict Ownership Check)
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const bookingId = requireObjectIdString(req.params.id, 'booking id');

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // 1. Enforce strict ownership (or admin role)
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to cancel another user’s booking');
  }

  // 2. Check if already cancelled
  if (booking.status === 'cancelled') {
    throw new ApiError(400, 'This booking is already cancelled');
  }

  // 3. Mark status as cancelled (use updateOne/save without triggering future startTime check on past bookings)
  booking.status = 'cancelled';
  await booking.save({ validateModifiedOnly: true });
  await booking.populate('service', 'name category description coachName durationMinutes price');

  res.status(200).json({
    status: 'success',
    message: 'Booking cancelled successfully',
    booking
  });
});