// ==============================================================================
// APEX PERFORMANCE — BOOKING CARD (ONE APPOINTMENT)
// File Path: client/src/components/BookingCard.jsx
// Usage: <BookingCard booking={b} isPast={false}>{actions}</BookingCard>
// Shows the service's category photo and a date badge, tinted by status.
// ==============================================================================

import { Link } from 'react-router-dom';
import { formatDateTime, formatTimeRange } from '../utils/bookingHelpers.js';
import { getCategoryImage } from '../utils/categoryImages.js';
import { formatDuration, formatPrice } from '../utils/serviceHelpers.js';
import '../styles/dashboard.css';

const KNOWN_STATUSES = ['confirmed', 'completed', 'cancelled'];

/**
 * Decide which label, badge style and card style to show.
 * A "confirmed" booking whose time has passed is shown as "Past" (display only;
 * the stored status is not changed).
 */
function getStatusDisplay(status, isPast) {
  if (status === 'confirmed' && isPast) {
    return { key: 'past', label: 'Past', className: 'badge-completed' };
  }
  if (KNOWN_STATUSES.includes(status)) {
    return { key: status, label: status, className: `badge-${status}` };
  }
  return { key: 'unknown', label: 'Unknown', className: 'badge-completed' };
}

/** Month and day for the date badge, or null if the date is invalid. */
function getDateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.getDate()
  };
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
  const image = getCategoryImage(service?.category);
  const dateParts = getDateParts(booking.startTime);

  return (
    <article className={`card booking-card booking-card--${status.key}`}>
      <div className="booking-card__media">
        {/* Decorative: the date and service name are in the text below */}
        {image && (
          <img
            className="booking-card__image"
            src={image}
            alt=""
            width="1600"
            height="1200"
            loading="lazy"
            decoding="async"
          />
        )}
        {dateParts && (
          <div className="booking-card__date" aria-hidden="true">
            <span className="booking-card__month">{dateParts.month}</span>
            <span className="booking-card__day">{dateParts.day}</span>
          </div>
        )}
      </div>

      <div className="booking-card__body">
        <div className="detail-header">
          <Heading>{service?._id ? <Link to={`/services/${service._id}`}>{serviceName}</Link> : serviceName}</Heading>
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
      </div>
    </article>
  );
}