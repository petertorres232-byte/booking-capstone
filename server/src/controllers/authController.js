// ==============================================================================
// APEX PERFORMANCE — AUTHENTICATION CONTROLLER
// File Path: server/src/controllers/authController.js
// ==============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * Helper: Generate signed JWT for an authenticated user
 */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Helper: Format safe user payload (never expose passwordHash)
 */
const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Validate required fields on the server
  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // 2. Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists');
  }

  // 3. Hash password with 10 salt rounds
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 4. Create user in MongoDB (role defaults strictly to 'client')
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash
  });

  // 5. Sign JWT and return 201 Created
  const token = generateToken(user);

  res.status(201).json({
    status: 'success',
    message: 'Account registered successfully',
    token,
    user: formatUserResponse(user)
  });
});

/**
 * @desc    Authenticate existing user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input presence
  if (!email || !password) {
    throw new ApiError(400, 'Please provide both email and password');
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // 2. Find user and explicitly select +passwordHash (since select: false is on model)
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // 3. Compare password hash (Generic error prevents account enumeration)
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 4. Sign JWT and return 200 OK
  const token = generateToken(user);

  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully',
    token,
    user: formatUserResponse(user)
  });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT protect middleware)
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json({
    status: 'success',
    user: formatUserResponse(user)
  });
});