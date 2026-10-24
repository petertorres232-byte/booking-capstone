// ==============================================================================
// APEX PERFORMANCE — SAFE POST-LOGIN DESTINATION HELPER
// File Path: client/src/utils/getSafeDestination.js
// Pure function: no React, no browser APIs (easy to test in Node).
// ==============================================================================

// Pages that must never be a redirect target (would loop for logged-in users)
const AUTH_PAGES = ['/login', '/register'];

/**
 * Work out where to send a user after authenticating.
 *
 * @param {Object} [location] - React Router location; may carry state.from set by ProtectedRoute
 * @param {string} [fallback] - Used whenever the saved destination is missing or unsafe
 * @returns {string} An in-app path such as "/dashboard" or "/dashboard?tab=past"
 */
export const getSafeDestination = (location, fallback = '/dashboard') => {
  const from = location?.state?.from;
  const path = from?.pathname;

  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  // Reject backslashes and control characters (browsers treat "/\evil.com" like "//evil.com")
  const hasUnsafeCharacter = [...path].some((character) => character === '\\' || character.charCodeAt(0) < 32);
  if (hasUnsafeCharacter) {
    return fallback;
  }

  // Compare case-insensitively and ignore trailing slashes so "/Login/" is caught too
  const normalizedPath = path.toLowerCase().replace(/\/+$/, '');
  if (AUTH_PAGES.includes(normalizedPath)) {
    return fallback;
  }

  // Keep the query string only when it is a plain "?..." string
  const search = typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '';

  return `${path}${search}`;
};