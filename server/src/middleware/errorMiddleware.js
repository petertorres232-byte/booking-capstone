// ==============================================================================
// APEX PERFORMANCE — CENTRALIZED ERROR & ASYNC HANDLER MIDDLEWARE
// File Path: server/src/middleware/errorMiddleware.js
// ==============================================================================

/**
 * Custom Operational HTTP Error Class
 * Allows controllers to throw errors with an explicit HTTP status code.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async Controller Wrapper
 * Eliminates repetitive try/catch blocks in async Express route handlers
 * by automatically passing any rejected Promise to next(err).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found Route Middleware
 * Catches requests to any undefined URL path and forwards a 404 ApiError.
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global Error-Handling Middleware (4-parameter signature required by Express)
 * Normalizes Mongoose, JWT, body-parser and custom errors into safe JSON responses.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Bad ObjectId (CastError — e.g., /api/services/invalid-id-123)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource ID format for field '${err.path}'`;
  }

  // 2. Mongoose Duplicate Key Error (Code 11000 — e.g., duplicate email or service name)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with that ${duplicateField} already exists`;
  }

  // 3. Mongoose Schema Validation Error (ValidationError)
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // 4. JSON Web Token (JWT) Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session token has expired. Please log in again.';
  }

  // 5. Request-body problems raised by Express's body parser (never echo parser internals)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  // 6. Production: unexpected server errors must not reveal internal details.
  //    Errors thrown on purpose (ApiError) keep their safe, written messages.
  if (isProduction && statusCode >= 500 && !err.isOperational) {
    message = 'Something went wrong on our server. Please try again.';
  }

  // Always log server errors so they can be diagnosed (hosting logs are private).
  // In production log only the message, in development log the full error.
  if (statusCode >= 500) {
    console.error('[Server Error]:', isProduction ? err.message : err);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Security Defense: Never expose stack traces when NODE_ENV === 'production'
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};