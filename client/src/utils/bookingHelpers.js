// ==============================================================================
// APEX PERFORMANCE — BOOKING HELPERS (CLIENT)
// File Path: client/src/utils/bookingHelpers.js
// Purpose: Date conversion, display formatting and client-side validation for
//          the booking form. Mirrors server rules (future start, notes <= 300).
//          The server remains the source of truth for every rule.
// ==============================================================================

export const MAX_NOTES_LENGTH = 300;

// A booking must start at least this far in the future (client-side UX rule).
const MIN_LEAD_MS = 60 * 1000;

const LOCAL_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function pad(number) {
  return String(number).padStart(2, '0');
}

/**
 * Format a Date as the "YYYY-MM-DDTHH:mm" string that datetime-local expects,
 * using the user's LOCAL time (not UTC).
 */
export function toLocalInputValue(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Earliest value the datetime-local picker should allow (used for its `min`).
 */
export function getMinLocalDateTime(now = new Date()) {
  return toLocalInputValue(new Date(now.getTime() + MIN_LEAD_MS));
}

/**
 * Convert a datetime-local string to an ISO 8601 UTC string for the API.
 * Returns null if the value is empty, malformed, or not a real calendar date.
 */
export function localInputToIso(value) {
  if (typeof value !== 'string' || !LOCAL_INPUT_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(value); // parsed as local time
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Round-trip check rejects dates the engine silently "fixes" (e.g. Feb 31).
  if (toLocalInputValue(date) !== value) {
    return null;
  }

  return date.toISOString();
}

/**
 * Validate the booking form. Returns an object of field errors.
 * An empty object means the form is valid.
 */
export function validateBookingForm({ startTime, notes }, now = new Date()) {
  const errors = {};

  if (!startTime) {
    errors.startTime = 'Please choose a date and time.';
  } else {
    const iso = localInputToIso(startTime);
    if (!iso) {
      errors.startTime = 'Please enter a valid date and time.';
    } else if (new Date(iso).getTime() < now.getTime() + MIN_LEAD_MS) {
      errors.startTime = 'Please choose a time in the future.';
    }
  }

  if (typeof notes === 'string' && notes.trim().length > MAX_NOTES_LENGTH) {
    errors.notes = `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`;
  }

  return errors;
}

/**
 * Human-readable date and time, in the user's locale and timezone.
 */
export function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(date);
}

/**
 * Human-readable time range, e.g. "2:30 PM – 3:30 PM".
 */
export function formatTimeRange(isoStart, durationMinutes) {
  const start = new Date(isoStart);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(durationMinutes)) {
    return '';
  }
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const formatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}