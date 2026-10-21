// ==============================================================================
// APEX PERFORMANCE — AUTHENTICATION ROUTES
// File Path: server/src/routes/authRoutes.js
// Base Route: /api/auth
// ==============================================================================

import express from 'express';
import {
  registerUser,
  loginUser,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account & return signed JWT
 * @access  Public (Protected by strict authLimiter)
 */
router.post('/register', authLimiter, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials & return signed JWT
 * @access  Public (Protected by strict authLimiter)
 */
router.post('/login', authLimiter, loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user's profile from verified JWT
 * @access  Private (Requires Bearer JWT via protect middleware)
 */
router.get('/me', protect, getMe);

export default router;