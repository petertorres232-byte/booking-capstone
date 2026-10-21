// ==============================================================================
// APEX PERFORMANCE — SERVICE CATALOG MONGOOSE MODEL
// File Path: server/src/models/Service.js
// ==============================================================================

import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a service name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Please specify a service category'],
      enum: {
        values: ['Strength', 'Cardio', 'Recovery', 'Mobility', 'Assessment'],
        message: '{VALUE} is not a supported category'
      }
    },
    description: {
      type: String,
      required: [true, 'Please add a service description'],
      trim: true,
      maxlength: [600, 'Description cannot exceed 600 characters']
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Please specify session duration in minutes'],
      min: [15, 'Duration must be at least 15 minutes'],
      max: [240, 'Duration cannot exceed 240 minutes']
    },
    price: {
      type: Number,
      required: [true, 'Please specify service price in USD'],
      min: [0, 'Price cannot be negative']
    },
    coachName: {
      type: String,
      required: [true, 'Please specify coach name'],
      trim: true,
      default: 'Apex Senior Coach',
      maxlength: [80, 'Coach name cannot exceed 80 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Service = mongoose.model('Service', serviceSchema);

export default Service;