// ==============================================================================
// APEX PERFORMANCE — IDEMPOTENT SERVICE CATALOG SEED SCRIPT
// File Path: server/scripts/seedServices.js
// Run from: booking-capstone/server -> npm run seed
// ==============================================================================

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../src/models/Service.js';

// Resolve exact path to server/.env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apexServices = [
  {
    name: '1-on-1 Strength & Hypertrophy Assessment',
    category: 'Assessment',
    description:
      'Comprehensive movement screening, barbell mechanics evaluation (squat, bench, deadlift), and a personalized 8-week progressive overload hypertrophy roadmap.',
    durationMinutes: 60,
    price: 85,
    coachName: 'Coach Marcus Vance (CSCS)',
    isActive: true
  },
  {
    name: 'Olympic Weightlifting & Barbell Power Lab',
    category: 'Strength',
    description:
      'Advanced 1-on-1 coaching focused on snatch, clean & jerk, explosive hip extension, and maximal strength under heavy barbell loads.',
    durationMinutes: 90,
    price: 120,
    coachName: 'Coach Marcus Vance (CSCS)',
    isActive: true
  },
  {
    name: 'HIIT Metabolic Conditioning & VO2 Max Session',
    category: 'Cardio',
    description:
      'High-intensity interval training utilizing assault bikes, rowing ergometers, and sled pushes to maximize caloric burn and cardiovascular endurance.',
    durationMinutes: 45,
    price: 65,
    coachName: 'Coach Elena Rostova',
    isActive: true
  },
  {
    name: 'Post-Run Sports Massage & Myofascial Release',
    category: 'Recovery',
    description:
      'Targeted deep-tissue decompression, percussion therapy, and myofascial release for sore quads, hamstrings, calves, and lower back fatigue.',
    durationMinutes: 60,
    price: 95,
    coachName: 'Dr. Devon Brooks (DPT)',
    isActive: true
  },
  {
    name: 'Guided Mobility & Joint Decompression Flow',
    category: 'Mobility',
    description:
      'Low-impact active range-of-motion session targeting stiff hips, thoracic spine, and shoulder capsules—ideal for desk workers and active recovery days.',
    durationMinutes: 45,
    price: 55,
    coachName: 'Coach Lena Park (FRCms)',
    isActive: true
  },
  {
    name: 'Contrast Recovery Suite & Normatec Compression',
    category: 'Recovery',
    description:
      'Guided recovery protocol combining pneumatic leg compression boots, percussive flush, and breathwork to accelerate nervous system recovery between heavy training blocks.',
    durationMinutes: 45,
    price: 60,
    coachName: 'Dr. Devon Brooks (DPT)',
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Seed Connected]: Database -> ${mongoose.connection.name}`);

    const seededResults = [];

    for (const item of apexServices) {
      const doc = await Service.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );
      seededResults.push({
        _id: doc._id.toString(),
        name: doc.name,
        category: doc.category,
        durationMinutes: doc.durationMinutes,
        price: `$${doc.price}`
      });
    }

    console.log(`\n[Seed Success]: Upserted ${seededResults.length} Apex Performance services:`);
    console.table(seededResults);

    await mongoose.connection.close();
    console.log('[Seed Disconnected]: MongoDB connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Failure]: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();