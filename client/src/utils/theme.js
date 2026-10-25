// ==============================================================================
// Theme helpers: light / dark, saved in localStorage, OS preference as fallback.
// File Path: client/src/utils/theme.js
// ==============================================================================

const STORAGE_KEY = 'apex-theme';
const VALID_THEMES = ['light', 'dark'];

/** Saved choice, or null. Only the exact strings 'light' / 'dark' are trusted. */
export function getStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(value) ? value : null;
  } catch {
    return null; // storage blocked: behave as "no saved choice"
  }
}

/** What the operating system prefers. */
export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The theme currently showing: saved choice first, then the OS preference. */
export function getActiveTheme() {
  return getStoredTheme() ?? getSystemTheme();
}

/** Put the theme on <html>; index.css reacts to data-theme. */
export function applyTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return;
  document.documentElement.dataset.theme = theme;
}

/** Apply and remember a choice made by the visitor. */
export function setTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return;
  applyTheme(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but the theme still applies for this visit.
  }
}

/** Call once at startup: re-apply a saved choice before the first paint of the app. */
export function initTheme() {
  const stored = getStoredTheme();
  if (stored) applyTheme(stored);
}