// ==============================================================================
// APEX PERFORMANCE — USER MONGOOSE MODEL
// File Path: server/src/models/User.js
// ==============================================================================

import mongoose from 'mongoose';

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
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
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