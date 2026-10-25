// ==============================================================================
// ThemeToggle: icon button that switches between light and dark.
// File Path: client/src/components/ThemeToggle.jsx
// ==============================================================================
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getActiveTheme, getStoredTheme, setTheme } from '../utils/theme.js';
import '../styles/theme-toggle.css';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getActiveTheme);

  // Follow the OS setting live, but only while the visitor has not chosen.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!getStoredTheme()) setThemeState(query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;

  function handleClick() {
    setTheme(nextTheme);
    setThemeState(nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleClick}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}