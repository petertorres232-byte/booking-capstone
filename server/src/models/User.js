// ==============================================================================
// APEX PERFORMANCE — USER MONGOOSE MODEL
// File Path: server/src/models/User.js
// ==============================================================================

import mongoose from 'mongoose';

// Linear-time email check (no nested repetition, so it cannot be abused for ReDoS):
// local part, "@", one or more dot-free domain labels, and a final label of 2+ characters
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a user name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [EMAIL_PATTERN, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Please add a password hash'],
      minlength: [60, 'Invalid password hash length'],
      select: false // CRITICAL SECURITY: Excluded by default from queries
    },
    role: {
      type: String,
      enum: {
        values: ['client', 'admin'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'client'
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

export default User;