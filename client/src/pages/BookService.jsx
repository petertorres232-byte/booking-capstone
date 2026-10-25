// ==============================================================================
// APEX PERFORMANCE — BOOK A SERVICE PAGE
// File Path: client/src/pages/BookService.jsx
// Route: /book/:serviceId   (wrapped in <ProtectedRoute> in App.jsx)
// ==============================================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { api } from '../services/api.js';
import {
  MAX_NOTES_LENGTH,
  formatDateTime,
  formatTimeRange,
  getMinLocalDateTime,
  localInputToIso,
  validateBookingForm
} from '../utils/bookingHelpers.js';
import { formatDuration, formatPrice } from '../utils/serviceHelpers.js';

// A MongoDB ObjectId is exactly 24 hexadecimal characters
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const EMPTY_VALUES = { startTime: '', notes: '' };

export default function BookService() {
  const { serviceId } = useParams();
  const isValidId = OBJECT_ID_PATTERN.test(serviceId ?? '');

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, service: null, error: '', notFound: false });

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const requestKey = `${serviceId}#${reloadCount}`;

  // Load the service so the user can review exactly what they are booking
  useEffect(() => {
    if (!isValidId) {
      return undefined;
    }

    let cancelled = false;

    api
      .get(`/services/${encodeURIComponent(serviceId)}`)
      .then((data) => {
        if (!cancelled) {
          setResult({ key: requestKey, service: data?.service ?? null, error: '', notFound: !data?.service });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const isMissing = error.status === 400 || error.status === 404;
        setResult({
          key: requestKey,
          service: null,
          error: isMissing ? '' : error.message,
          notFound: isMissing
        });
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, isValidId, requestKey]);

  const isCurrent = result.key === requestKey;
  const isLoading = isValidId && !isCurrent;
  const notFound = !isValidId || (isCurrent && result.notFound);
  const hasLoadError = isValidId && isCurrent && !result.notFound && Boolean(result.error);
  const service = isCurrent ? result.service : null;

  const handleRetry = () => setReloadCount((count) => count + 1);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const foundErrors = validateBookingForm(values);
    setErrors(foundErrors);

    const firstInvalidField = Object.keys(foundErrors)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Only these three fields are sent. Price, end time, status and user come from the server.
      const data = await api.post(
        '/bookings',
        {
          serviceId,
          startTime: localInputToIso(values.startTime),
          notes: values.notes.trim()
        },
        { auth: true }
      );

      setConfirmedBooking(data?.booking ?? {});
    } catch (error) {
      if (error.status === 409) {
        setSubmitError(
          'That time overlaps an existing appointment for this service. Please choose a different time.'
        );
        document.getElementById('startTime')?.focus();
      } else if (error.status === 404) {
        setSubmitError('This service is no longer available for booking.');
      } else {
        // 400 (for example a time that just passed), 429 (rate limit) and everything else
        setSubmitError(error.message || 'We could not complete your booking. Please try again.');
      }
      setSubmitting(false);
    }
  };

  // ---------- Screens ----------

  if (isLoading) {
    return (
      <div className="card text-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading service...
      </div>
    );
  }

  if (notFound) {
    return (
      <section className="card text-center">
        <h1>Service not found</h1>
        <p className="text-muted">
          We could not find that service. It may have been removed, or the link may be incorrect.
        </p>
        <Link className="btn" to="/services">
          Browse all services
        </Link>
      </section>
    );
  }

  if (hasLoadError) {
    return (
      <div className="alert alert-error" role="alert">
        <p>We could not load this service. {result.error}</p>
        <button type="button" className="btn btn-secondary" onClick={handleRetry}>
          Try again
        </button>{' '}
        <Link className="btn btn-secondary" to="/services">
          Back to services
        </Link>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  // Success screen: shows the server's saved values, not what we typed
  if (confirmedBooking) {
    const savedStart = confirmedBooking.startTime;
    const savedDuration = confirmedBooking.durationMinutes ?? service.durationMinutes;
    const savedPrice = confirmedBooking.priceAtBooking ?? service.price;

    return (
      <section className="card" style={{ maxWidth: '640px', marginInline: 'auto' }}>
        <div className="alert alert-success" role="status">
          Your appointment is booked.
        </div>
        <h1>Booking confirmed</h1>

        <dl className="facts">
          <div>
            <dt>Service</dt>
            <dd>{service.name}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{savedStart ? formatDateTime(savedStart) : 'See your dashboard'}</dd>
          </div>
          {savedStart && (
            <div>
              <dt>Time</dt>
              <dd>{formatTimeRange(savedStart, savedDuration)}</dd>
            </div>
          )}
          <div>
            <dt>Coach</dt>
            <dd>{service.coachName}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(savedPrice)}</dd>
          </div>
        </dl>

        <p>
          <Link className="btn" to="/dashboard">
            View my appointments
          </Link>{' '}
          <Link className="btn btn-secondary" to="/services">
            Book another service
          </Link>
        </p>
      </section>
    );
  }

  // Booking form
  const notesRemaining = MAX_NOTES_LENGTH - values.notes.length;
  const notesErrorId = errors.notes ? 'notes-error' : undefined;

  return (
    <section className="card" style={{ maxWidth: '640px', marginInline: 'auto' }}>
      <Link className="back-link" to={`/services/${serviceId}`}>
        <span aria-hidden="true">&larr; </span>Back to service details
      </Link>

      <h1>Book: {service.name}</h1>

      <dl className="facts">
        <div>
          <dt>Price</dt>
          <dd>{formatPrice(service.price)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(service.durationMinutes)}</dd>
        </div>
        <div>
          <dt>Coach</dt>
          <dd>{service.coachName}</dd>
        </div>
      </dl>

      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <FormField
          id="startTime"
          label="Date and time"
          type="datetime-local"
          min={getMinLocalDateTime()}
          value={values.startTime}
          onChange={handleChange}
          hint="Shown in your local time zone."
          error={errors.startTime}
        />

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={MAX_NOTES_LENGTH + 50}
            value={values.notes}
            onChange={handleChange}
            aria-invalid={errors.notes ? 'true' : undefined}
            aria-describedby={['notes-count', notesErrorId].filter(Boolean).join(' ')}
            style={{ width: '100%' }}
          />
          <small id="notes-count" className="text-muted">
            {notesRemaining >= 0
              ? `${notesRemaining} characters remaining`
              : `${Math.abs(notesRemaining)} characters over the limit`}
          </small>
          {errors.notes && (
            <p id="notes-error" className="field-error" role="alert">
              {errors.notes}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Booking...' : 'Confirm booking'}
        </button>
      </form>
    </section>
  );
}