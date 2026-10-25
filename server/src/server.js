// ==============================================================================
// APEX PERFORMANCE — EXPRESS SERVER ENTRY POINT
// File Path: server/src/server.js
// ==============================================================================

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// 1. Load environment variables from server/.env
dotenv.config();

// 1b. Fail closed in production: never guess which website may call this API
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
  console.error('[Startup Error]: CLIENT_ORIGIN must be set when NODE_ENV is production.');
  process.exit(1);
}

// 2. Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// 2b. Behind a hosting proxy (Render), trust exactly ONE hop so req.ip is the real visitor.
//     Not enabled locally, and never set to `true` (that would let clients spoof their IP).
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 3. Connect to MongoDB Atlas Cloud Cluster
connectDB();

// 4. Global Security & Parsing Middleware
app.use(helmet()); // Sets secure HTTP response headers
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '10kb' })); // Body parser with payload size limit

// 5. Apply General Rate Limiter to all /api routes
app.use('/api', apiLimiter);

// 6. Health Check Diagnostic Endpoint (public: reveals only whether the database is up)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'success' : 'error',
    message: 'Apex Performance API is online',
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected
    }
  });
});

// 7. Mount Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);

// 8. Centralized 404 & Global Error Handling Middleware (MUST be mounted last)
app.use(notFound);
app.use(errorHandler);

// 9. Start Express Server
const server = app.listen(PORT, () => {
  console.log(
    `[Server Running]: Mode -> ${process.env.NODE_ENV || 'development'} | Port -> ${PORT}`
  );
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;