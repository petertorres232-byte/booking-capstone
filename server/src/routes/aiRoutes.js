// ==============================================================================
// APEX PERFORMANCE — AI RECOMMENDATION ROUTES
// File Path: server/src/routes/aiRoutes.js
// Base Route: /api/ai
// ==============================================================================

import express from 'express';
import { recommendService } from '../controllers/aiController.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/ai/recommend-service
 * @desc    Recommend real catalog services for a free-text fitness goal
 * @access  Public (guests allowed; protected by strict per-IP aiLimiter)
 */
router.post('/recommend-service', aiLimiter, recommendService);

export default router;