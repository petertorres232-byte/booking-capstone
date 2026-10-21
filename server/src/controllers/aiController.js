// ==============================================================================
// APEX PERFORMANCE — AI RECOMMENDATION CONTROLLER
// File Path: server/src/controllers/aiController.js
// ==============================================================================

import { getServiceRecommendations } from '../services/recommendationService.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

// Status codes produced by aiClient.js / recommendationService.js when the AI path itself fails
const AI_UNAVAILABLE_STATUS_CODES = [502, 503, 504];

/**
 * @desc    Recommend real catalog services for a free-text fitness goal
 * @route   POST /api/ai/recommend-service
 * @access  Private (route-level protect + aiLimiter, wired in the next step)
 * @body    { "message": "string, 5-500 characters" }
 */
export const recommendService = asyncHandler(async (req, res) => {
  const message = req.body?.message;

  // 1. Reject a missing body field early (type and length are validated in the service)
  if (message === undefined || message === null) {
    throw new ApiError(400, 'Please provide a message describing your fitness goal');
  }

  try {
    // 2. Delegate all AI + database logic to the service layer
    const result = await getServiceRecommendations(message);

    return res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    // 3. Client mistakes (400s) go to the global error handler unchanged
    if (!AI_UNAVAILABLE_STATUS_CODES.includes(error.statusCode)) {
      throw error;
    }

    // 4. AI is down/slow/busy: return a safe error PLUS a fallback hint for the UI
    return res.status(error.statusCode).json({
      status: 'error',
      statusCode: error.statusCode,
      message: error.message,
      fallback: {
        action: 'browse_catalog',
        path: '/services'
      }
    });
  }
});