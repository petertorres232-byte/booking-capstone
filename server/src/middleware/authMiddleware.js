// ==============================================================================
// APEX PERFORMANCE — JWT AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// File Path: server/src/middleware/authMiddleware.js
// ==============================================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError, asyncHandler } from './errorMiddleware.js';

/**
 * Protect Middleware: Verifies Bearer JWT and attaches authenticated user to req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for Authorization header formatted as "Bearer <token>"
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]?.trim();
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No authentication token provided.');
  }

  // 2. Verify token signature and expiration using server JWT_SECRET
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Confirm user still exists in MongoDB (passwordHash excluded by schema default)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  // 4. Attach normalized user identity to request object for downstream controllers
  req.user = {
    id: currentUser._id.toString(),
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role
  };

  next();
});

/**
 * Role Authorization Middleware: Restricts access to specific user roles (e.g., 'admin', 'client')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user?.role || 'unknown'}' is not authorized to access this resource.`
        )
      );
    }
    next();
  };
};