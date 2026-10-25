// ==============================================================================
// APEX PERFORMANCE — TEST DATA CLEANUP TOOL (DEVELOPMENT ONLY)
// File Path: server/scripts/cleanupTestData.js
//
// Usage (run from the server folder):
//   node scripts/cleanupTestData.js
//       -> report only: lists users, booking counts and services (changes nothing)
//   node scripts/cleanupTestData.js --delete-users <id>[,<id>...]
//       -> DRY RUN of deleting those users and all of their bookings
//   node scripts/cleanupTestData.js --delete-users <id>[,<id>...] --yes
//       -> actually deletes them
//   node scripts/cleanupTestData.js --delete-bookings-of <userId> [--yes]
//       -> deletes all bookings of one user but keeps the account
//
// Safety: nothing is deleted without --yes. Admin accounts are never deleted.
// ==============================================================================

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Booking from '../src/models/Booking.js';
import Service from '../src/models/Service.js';

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const args = process.argv.slice(2);
const execute = args.includes('--yes');

const getArgValue = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : undefined;
};

const maskEmail = (email = '') => {
  const [local = '', domain = ''] = String(email).split('@');
  return `${local.slice(0, 1)}***@${domain}`;
};

const parseIds = (raw, flag) => {
  if (!raw || raw.startsWith('--')) {
    throw new Error(`${flag} needs one or more user IDs (comma separated).`);
  }
  const ids = raw.split(',').map((value) => value.trim()).filter(Boolean);
  if (ids.length === 0 || !ids.every((id) => OBJECT_ID_PATTERN.test(id))) {
    throw new Error('Every ID must be exactly 24 hexadecimal characters.');
  }
  return ids;
};

const printReport = async () => {
  const [users, services] = await Promise.all([
    User.find({}).sort({ createdAt: 1 }),
    Service.find({}).sort({ category: 1, price: 1 })
  ]);

  console.log(`\nUsers: ${users.length}`);
  for (const user of users) {
    const [total, confirmed, cancelled] = await Promise.all([
      Booking.countDocuments({ user: user._id }),
      Booking.countDocuments({ user: user._id, status: 'confirmed' }),
      Booking.countDocuments({ user: user._id, status: 'cancelled' })
    ]);
    console.log(
      `  ${user._id}  ${String(user.name).padEnd(20).slice(0, 20)}  ${maskEmail(user.email).padEnd(28)}  ` +
        `${String(user.role).padEnd(7)}  created ${user.createdAt?.toISOString().slice(0, 10)}  ` +
        `bookings: ${total} (confirmed ${confirmed}, cancelled ${cancelled})`
    );
  }

  const orphaned = await Booking.countDocuments({ user: { $nin: users.map((u) => u._id) } });
  console.log(`\nBookings in total: ${await Booking.countDocuments({})} (orphaned, with no user: ${orphaned})`);

  const activeServices = services.filter((service) => service.isActive).length;
  console.log(`Services: ${services.length} (active: ${activeServices})`);
};

const deleteUsers = async (ids) => {
  const users = await User.find({ _id: { $in: ids } });
  const foundIds = users.map((user) => user._id.toString());
  const missing = ids.filter((id) => !foundIds.includes(id.toLowerCase()));

  if (missing.length > 0) {
    throw new Error(`No user found for: ${missing.join(', ')}. Nothing was deleted.`);
  }

  const admins = users.filter((user) => user.role === 'admin');
  if (admins.length > 0) {
    throw new Error('Refusing to delete an admin account. Nothing was deleted.');
  }

  const bookingCount = await Booking.countDocuments({ user: { $in: users.map((u) => u._id) } });

  console.log(`\n${execute ? 'DELETING' : 'DRY RUN - would delete'}:`);
  for (const user of users) {
    console.log(`  user ${user._id}  ${user.name}  ${maskEmail(user.email)}`);
  }
  console.log(`  and ${bookingCount} booking(s) belonging to them`);

  if (!execute) {
    console.log('\nNothing was changed. Add --yes to perform the deletion.');
    return;
  }

  const bookingResult = await Booking.deleteMany({ user: { $in: users.map((u) => u._id) } });
  const userResult = await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  console.log(`\nDeleted ${userResult.deletedCount} user(s) and ${bookingResult.deletedCount} booking(s).`);
};

const deleteBookingsOf = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('No user found for that ID. Nothing was deleted.');
  }

  const bookingCount = await Booking.countDocuments({ user: user._id });
  console.log(
    `\n${execute ? 'DELETING' : 'DRY RUN - would delete'} ${bookingCount} booking(s) of ` +
      `${user.name} (${maskEmail(user.email)}). The account is kept.`
  );

  if (!execute) {
    console.log('\nNothing was changed. Add --yes to perform the deletion.');
    return;
  }

  const result = await Booking.deleteMany({ user: user._id });
  console.log(`\nDeleted ${result.deletedCount} booking(s).`);
};

const main = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Run this from the server folder with a valid .env file.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const usersFlag = args.includes('--delete-users');
  const bookingsFlag = args.includes('--delete-bookings-of');

  if (usersFlag && bookingsFlag) {
    throw new Error('Use only one deletion option at a time.');
  }

  if (usersFlag) {
    await deleteUsers(parseIds(getArgValue('--delete-users'), '--delete-users'));
  } else if (bookingsFlag) {
    const [userId] = parseIds(getArgValue('--delete-bookings-of'), '--delete-bookings-of');
    await deleteBookingsOf(userId);
  } else {
    console.log('Report only. Nothing will be changed.');
  }

  await printReport();
};

main()
  .catch((error) => {
    console.error(`\nCleanup stopped: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());