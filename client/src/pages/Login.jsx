// ==============================================================================
// APEX PERFORMANCE — LOGIN PAGE
// File Path: client/src/pages/Login.jsx
// ==============================================================================

import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getSafeDestination } from '../utils/getSafeDestination.js';

// Deliberately loose: it only catches typos; the server decides whether credentials are valid
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_VALUES = { email: '', password: '' };

/**
 * Helper: client-side checks (convenience only; the server validates again).
 */
const validate = ({ email, password }) => {
  const errors = {};

  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Please enter your password.';
  }

  return errors;
};

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Still verifying a saved session: avoid flashing the form at someone who is already logged in
  if (isLoading) {
    return (
      <div className="card text-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Checking your session...
      </div>
    );
  }

  // Already logged in (or just logged in): go back to where they were heading
  if (isAuthenticated) {
    return <Navigate to={getSafeDestination(location)} replace />;
  }

  const redirectedFromProtectedPage = Boolean(location.state?.from);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const cleaned = { email: values.email.trim(), password: values.password };

    const foundErrors = validate(cleaned);
    setErrors(foundErrors);

    const firstInvalidField = Object.keys(foundErrors)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await login(cleaned.email, cleaned.password);
      // Success: AuthContext now has the user, and the <Navigate> above handles the redirect
    } catch (error) {
      setSubmitError(error.message);
      // Keep the email, clear the password, and put the cursor back in the password box
      setValues((current) => ({ ...current, password: '' }));
      setSubmitting(false);
      document.getElementById('password')?.focus();
    }
  };

  return (
    <section className="card" style={{ maxWidth: '480px', marginInline: 'auto' }}>
      <h1>Log in</h1>

      {redirectedFromProtectedPage && <p className="text-muted">Please log in to view that page.</p>}

      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="username"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          maxLength={72}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-center" style={{ marginTop: 'var(--space-4)' }}>
        New to Apex Performance?{' '}
        <Link to="/register" state={location.state}>
          Create an account
        </Link>
      </p>
    </section>
  );
}