// ==============================================================================
// APEX PERFORMANCE — SERVICE CATALOG ROUTES
// File Path: server/src/routes/serviceRoutes.js
// Base Route: /api/services
// ==============================================================================

import express from 'express';
import {
  getServices,
  getServiceById
} from '../controllers/serviceController.js';

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all active services (supports optional ?category= filter)
 * @access  Public
 */
router.get('/', getServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get a single active service by MongoDB ObjectId
 * @access  Public
 */
router.get('/:id', getServiceById);

export default router;