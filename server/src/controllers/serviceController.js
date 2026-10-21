// ==============================================================================
// APEX PERFORMANCE — SERVICE CATALOG CONTROLLER
// File Path: server/src/controllers/serviceController.js
// ==============================================================================

import Service from '../models/Service.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

const ALLOWED_CATEGORIES = [
  'Strength',
  'Cardio',
  'Recovery',
  'Mobility',
  'Assessment'
];

/**
 * @desc    Get all active services (with optional ?category= filter)
 * @route   GET /api/services
 * @access  Public
 */
export const getServices = asyncHandler(async (req, res) => {
  const { category } = req.query;

  // Base filter: only return active catalog items
  const filter = { isActive: true };

  // Validate optional category query parameter against strict enum allowlist
  if (category !== undefined && String(category).trim() !== '') {
    const trimmedCategory = String(category).trim();

    if (!ALLOWED_CATEGORIES.includes(trimmedCategory)) {
      throw new ApiError(
        400,
        `Invalid category '${trimmedCategory}'. Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}`
      );
    }

    filter.category = trimmedCategory;
  }

  // Sort by category first, then price ascending for a clean catalog layout
  const services = await Service.find(filter).sort({ category: 1, price: 1 });

  res.status(200).json({
    status: 'success',
    count: services.length,
    services
  });
});

/**
 * @desc    Get a single active service by MongoDB ObjectId
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    throw new ApiError(404, 'Service not found or is no longer active');
  }

  res.status(200).json({
    status: 'success',
    service
  });
});