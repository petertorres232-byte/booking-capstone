// ==============================================================================
// APEX PERFORMANCE — BOOKING MONGOOSE MODEL
// File Path: server/src/models/Booking.js
// ==============================================================================

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be associated with a user'],
      index: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Booking must select an active service'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, 'Please specify appointment start time'],
      validate: {
        validator: function (value) {
          // Allow existing bookings or future dates
          return value > Date.now();
        },
        message: 'Appointment start time must be in the future'
      }
    },
    endTime: {
      type: Date,
      required: [true, 'Appointment end time is required']
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid booking status'
      },
      default: 'confirmed'
    },
    priceAtBooking: {
      type: Number,
      required: [true, 'Price snapshot at booking is required'],
      min: [0, 'Price cannot be negative']
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration snapshot at booking is required'],
      min: [15, 'Duration must be at least 15 minutes']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-speed conflict detection and dashboard queries
bookingSchema.index({ service: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ user: 1, startTime: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;