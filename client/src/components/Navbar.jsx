// ==============================================================================
// APEX PERFORMANCE — NAVBAR COMPONENT
// File Path: client/src/components/Navbar.jsx
// Links change with login state; includes accessible mobile menu toggle
// and the light/dark theme toggle
// ==============================================================================

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  // Close the mobile menu when the Escape key is pressed
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          Apex Performance
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>

        <nav id="primary-navigation" aria-label="Main navigation" className={`site-nav${isOpen ? ' is-open' : ''}`}>
          <NavLink to="/" end className="nav-link" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/services" className="nav-link" onClick={closeMenu}>
            Services
          </NavLink>

          {/* While the session is being verified, show nothing account-related (prevents a flash) */}
          {!isLoading && isAuthenticated && (
            <>
              <NavLink to="/dashboard" className="nav-link" onClick={closeMenu}>
                Dashboard
              </NavLink>
              <span className="nav-user">Hi, {firstName}</span>
              <button type="button" className="nav-link" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}

          {!isLoading && !isAuthenticated && (
            <>
              <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                Log in
              </NavLink>
              <NavLink to="/register" className="nav-link" onClick={closeMenu}>
                Register
              </NavLink>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}