// ==============================================================================
// APEX PERFORMANCE — BOOKING CARD (ONE APPOINTMENT)
// File Path: client/src/components/BookingCard.jsx
// Usage: <BookingCard booking={b} isPast={false}>{actions}</BookingCard>
// ==============================================================================

import { Link } from 'react-router-dom';
import { formatDateTime, formatTimeRange } from '../utils/bookingHelpers.js';
import { formatDuration, formatPrice } from '../utils/serviceHelpers.js';

const KNOWN_STATUSES = ['confirmed', 'completed', 'cancelled'];

/**
 * Decide which label and badge style to show.
 * A "confirmed" booking whose time has passed is shown as "Past" (display only;
 * the stored status is not changed).
 */
function getStatusDisplay(status, isPast) {
  if (status === 'confirmed' && isPast) {
    return { label: 'Past', className: 'badge-completed' };
  }
  if (KNOWN_STATUSES.includes(status)) {
    return { label: status, className: `badge-${status}` };
  }
  return { label: 'Unknown', className: 'badge-completed' };
}

export default function BookingCard({ booking, isPast = false, headingLevel = 3, children }) {
  if (!booking) {
    return null;
  }

  const Heading = `h${Math.min(Math.max(headingLevel, 2), 6)}`;
  const service = booking.service;
  const serviceName = service?.name ?? 'Service no longer available';
  const duration = booking.durationMinutes ?? service?.durationMinutes;
  const status = getStatusDisplay(booking.status, isPast);

  return (
    <article className="card booking-card">
      <div className="detail-header">
        <Heading style={{ margin: 0 }}>
          {service?._id ? <Link to={`/services/${service._id}`}>{serviceName}</Link> : serviceName}
        </Heading>
        <span className={`badge ${status.className}`}>{status.label}</span>
      </div>

      <dl className="facts">
        <div>
          <dt>When</dt>
          <dd>{formatDateTime(booking.startTime)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTimeRange(booking.startTime, duration)}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(duration)}</dd>
        </div>
        {service?.coachName && (
          <div>
            <dt>Coach</dt>
            <dd>{service.coachName}</dd>
          </div>
        )}
        <div>
          <dt>Price</dt>
          <dd>{formatPrice(booking.priceAtBooking)}</dd>
        </div>
      </dl>

      {booking.notes && (
        <p className="text-muted">
          <strong>Notes:</strong> {booking.notes}
        </p>
      )}

      {children}
    </article>
  );
}