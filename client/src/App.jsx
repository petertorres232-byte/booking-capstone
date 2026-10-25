// ==============================================================================
// APEX PERFORMANCE — APP ROOT (PROVIDERS + ROUTES)
// File Path: client/src/App.jsx
// The only remaining placeholder is Home, replaced by a real page later.
// ==============================================================================

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import BookService from './pages/BookService.jsx';
import Dashboard from './pages/Dashboard.jsx';

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
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="book/:serviceId"
              element={
                <ProtectedRoute>
                  <BookService />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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