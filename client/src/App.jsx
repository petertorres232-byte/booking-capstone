// ==============================================================================
// APEX PERFORMANCE — APP ROOT (PROVIDERS + ROUTES)
// File Path: client/src/App.jsx
// Placeholder pages below are replaced by real files in client/src/pages/
// during Steps 29-35.
// ==============================================================================

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function HomePlaceholder() {
  return (
    <section className="card">
      <h1>Apex Performance</h1>
      <p className="text-muted">The real home page arrives in a later step.</p>
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

function LoginPlaceholder() {
  return (
    <section className="card">
      <h1>Log in</h1>
      <p className="text-muted">The login form arrives in Step 29.</p>
    </section>
  );
}

function RegisterPlaceholder() {
  return (
    <section className="card">
      <h1>Register</h1>
      <p className="text-muted">The registration form arrives in Step 29.</p>
    </section>
  );
}

function DashboardPlaceholder() {
  return (
    <section className="card">
      <h1>Dashboard</h1>
      <p className="text-muted">Your appointments will appear here in Step 32.</p>
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
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePlaceholder />} />
            <Route path="services" element={<ServicesPlaceholder />} />
            <Route path="login" element={<LoginPlaceholder />} />
            <Route path="register" element={<RegisterPlaceholder />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPlaceholder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}