// ==============================================================================
// APEX PERFORMANCE — MONGODB ATLAS CONNECTION MODULE
// File Path: server/src/config/db.js
// ==============================================================================

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`[Database Connected]: MongoDB Atlas Host -> ${conn.connection.host}`);
    console.log(`[Database Name]: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Connection Error]: ${error.message}`);
    process.exit(1); // Exit process with failure code if DB fails on startup
  }
};

// Listen for Mongoose connection events for robust monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning]: Lost connection to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error Event]: ${err}`);
});

export default connectDB;