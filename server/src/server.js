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
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// 1. Load environment variables from server/.env
dotenv.config();

// 2. Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

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

// 6. Health Check Diagnostic Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'success' : 'error',
    message: 'Apex Performance API is online',
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown'
    }
  });
});

// 7. Mount Modular API Routes
app.use('/api/auth', authRoutes);

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