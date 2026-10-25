// ==============================================================================
// Category -> illustration lookup (files live in client/public/images)
// File Path: client/src/utils/categoryImages.js
// ==============================================================================

const CATEGORY_IMAGES = {
  strength: '/images/strength.webp',
  cardio: '/images/cardio.webp',
  recovery: '/images/recovery.webp',
  mobility: '/images/mobility.webp',
  assessment: '/images/assessment.webp',
};

/** Image path for a category name (any capitalisation), or null if there is none. */
export function getCategoryImage(category) {
  const key = String(category ?? '').toLowerCase();
  // hasOwn avoids inherited names such as "constructor" matching by accident
  return Object.hasOwn(CATEGORY_IMAGES, key) ? CATEGORY_IMAGES[key] : null;
}