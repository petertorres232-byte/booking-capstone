// ==============================================================================
// APEX PERFORMANCE — SERVICE DISPLAY HELPERS
// File Path: client/src/utils/serviceHelpers.js
// Pure functions: no React, no network. Used by cards, detail page and booking UI.
// ==============================================================================

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const usdCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Format a USD price: 85 -> "$85", 59.5 -> "$59.50".
 * Anything that is not a finite, non-negative number gives a safe fallback.
 */
export const formatPrice = (amount) => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return 'Price unavailable';
  }
  return Number.isInteger(amount) ? usdWhole.format(amount) : usdCents.format(amount);
};

/**
 * Format a duration in minutes: 45 -> "45 min", 60 -> "1 hr", 90 -> "1 hr 30 min".
 */
export const formatDuration = (minutes) => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return 'Duration unavailable';
  }

  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remainder = total % 60;

  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
};

/**
 * Read a service's identifier. The catalog API sends "_id" (a raw MongoDB document),
 * while the AI recommendation endpoint sends "id". Returns "" when neither exists.
 */
export const getServiceId = (service) => service?._id ?? service?.id ?? '';