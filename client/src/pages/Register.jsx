// ==============================================================================
// APEX PERFORMANCE — REGISTER PAGE
// File Path: client/src/pages/Register.jsx
// ==============================================================================

import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Deliberately loose: the server applies the authoritative email rules
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_VALUES = { name: '', email: '', password: '', confirmPassword: '' };

/**
 * Helper: where to go after a successful sign-up.
 * Accepts only in-app paths ("/something"), never "//host" or full URLs (open-redirect protection).
 */
const getSafeDestination = (location) => {
  const from = location.state?.from;
  const path = from?.pathname;

  if (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    path !== '/login' &&
    path !== '/register'
  ) {
    return `${path}${typeof from.search === 'string' ? from.search : ''}`;
  }

  return '/dashboard';
};

/**
 * Helper: client-side validation (convenience only; the server validates again).
 */
const validate = ({ name, email, password, confirmPassword }) => {
  const errors = {};

  if (name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  } else if (name.length > 60) {
    errors.name = 'Name cannot be longer than 60 characters.';
  }

  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export default function Register() {
  const { register, isAuthenticated, isLoading } = useAuth();
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

  // Already logged in (or just registered): leave this page
  if (isAuthenticated) {
    return <Navigate to={getSafeDestination(location)} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const cleaned = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword
    };

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
      await register(cleaned.name, cleaned.email, cleaned.password);
      // Success: AuthContext now has the user, and the <Navigate> above handles the redirect
    } catch (error) {
      setSubmitError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: '480px', marginInline: 'auto' }}>
      <h1>Create your account</h1>
      <p className="text-muted">Book coaching and recovery sessions in a few clicks.</p>

      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <FormField
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          maxLength={60}
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />

        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={values.password}
          onChange={handleChange}
          hint="At least 8 characters."
          error={errors.password}
        />

        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center" style={{ marginTop: 'var(--space-4)' }}>
        Already have an account?{' '}
        <Link to="/login" state={location.state}>
          Log in
        </Link>
      </p>
    </section>
  );
}