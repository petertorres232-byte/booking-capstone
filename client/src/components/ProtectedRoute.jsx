// ==============================================================================
// APEX PERFORMANCE — PROTECTED ROUTE (CLIENT-SIDE ROUTE GUARD)
// File Path: client/src/components/ProtectedRoute.jsx
// UX convenience only: the server's `protect` middleware is the real security.
// Usage: <ProtectedRoute><Dashboard /></ProtectedRoute>
// ==============================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Session still being verified: never redirect yet
  if (isLoading) {
    return (
      <div className="card text-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Checking your session...
      </div>
    );
  }

  // 2. Not logged in: go to login and remember the page they wanted
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Logged in: show the page (supports both wrapper and layout-route usage)
  return children ?? <Outlet />;
}