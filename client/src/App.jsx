// ==============================================================================
// APEX PERFORMANCE — APP ROOT (TEMPORARY ROUTER SHELL + AUTH DEBUG PANEL)
// File Path: client/src/App.jsx
// The debug panel is TEMPORARY and is removed in Step 28 (real Navbar/Layout).
// ==============================================================================

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// TEMPORARY: shows live session state so we can test AuthContext before building real forms
function AuthDebugPanel() {
  const { user, isLoading, isAuthenticated, register, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreateTestUser = async () => {
    setBusy(true);
    setMessage('');
    try {
      await register('Debug User', `debug.${Date.now()}@example.com`, 'TestPass123');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" aria-live="polite">
      <h2>Auth debug panel (temporary)</h2>

      {isLoading && (
        <p>
          <span className="spinner" aria-hidden="true" /> Checking session...
        </p>
      )}

      {!isLoading && isAuthenticated && (
        <p>
          Logged in as <strong>{user.email}</strong> (role: {user.role})
        </p>
      )}

      {!isLoading && !isAuthenticated && <p>Logged out</p>}

      {message && <div className="alert alert-error">{message}</div>}

      <button type="button" className="btn" onClick={handleCreateTestUser} disabled={busy || isLoading || isAuthenticated}>
        {busy ? 'Creating...' : 'Create throwaway user and log in'}
      </button>{' '}
      <button type="button" className="btn btn-secondary" onClick={logout} disabled={isLoading || !isAuthenticated}>
        Log out
      </button>
    </section>
  );
}

function HomePlaceholder() {
  return (
    <section className="card">
      <h1>Apex Performance</h1>
      <p className="text-muted">
        Router shell is working. The real home page arrives in a later step.
      </p>
      <Link className="btn" to="/services">
        Browse services
      </Link>
    </section>
  );
}

function ServicesPlaceholder() {
  return (
    <section className="card">
      <h1>Services</h1>
      <p className="text-muted">The live service catalog will load here from the API.</p>
    </section>
  );
}

function NotFoundPlaceholder() {
  return (
    <section className="card text-center">
      <h1>Page not found</h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link className="btn" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="container page-title" aria-label="Main navigation">
          <Link to="/">Home</Link> | <Link to="/services">Services</Link>
        </nav>

        <main className="container page">
          <AuthDebugPanel />
          <Routes>
            <Route path="/" element={<HomePlaceholder />} />
            <Route path="/services" element={<ServicesPlaceholder />} />
            <Route path="*" element={<NotFoundPlaceholder />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}