// ==============================================================================
// APEX PERFORMANCE - BOOKING CONFIRMATION SCREEN
// File Path: client/src/components/BookingConfirmation.jsx
// Props: service (the service that was booked), booking (the server's saved booking)
// Shows the server's saved values, not what the user typed. Animated, and moves
// focus to the heading so screen readers announce the result.
// ==============================================================================

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatTimeRange } from '../utils/bookingHelpers.js';
import { getCategoryImage } from '../utils/categoryImages.js';
import { formatPrice } from '../utils/serviceHelpers.js';
import '../styles/booking-confirmation.css';

export default function BookingConfirmation({ service, booking }) {
  const headingRef = useRef(null);

  // Announce the new screen to screen readers and keyboard users
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const savedStart = booking?.startTime;
  const savedDuration = booking?.durationMinutes ?? service.durationMinutes;
  const savedPrice = booking?.priceAtBooking ?? service.price;
  const image = getCategoryImage(service.category);

  return (
    <section className="card booking-confirmation" aria-labelledby="confirmation-heading">
      <div className="booking-confirmation__header">
        <div className="booking-confirmation__media">
          {/* Decorative: the service name is in the details below */}
          {image && (
            <img
              className="booking-confirmation__image"
              src={image}
              alt=""
              width="1600"
              height="1200"
              decoding="async"
            />
          )}
        </div>
        <div className="booking-confirmation__badge" aria-hidden="true">
          <svg className="booking-confirmation__check" viewBox="0 0 52 52" focusable="false">
            <path d="M14 27 l9 9 l16 -19" pathLength="1" />
          </svg>
        </div>
      </div>

      <div className="booking-confirmation__body">
        <div className="alert alert-success" role="status">
          Your appointment is booked.
        </div>
        <h1 id="confirmation-heading" tabIndex={-1} ref={headingRef}>
          Booking confirmed
        </h1>

        <dl className="facts booking-confirmation__facts">
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

        <div className="booking-confirmation__actions">
          <Link className="btn" to="/dashboard">
            View my appointments
          </Link>
          <Link className="btn btn-secondary" to="/services">
            Book another service
          </Link>
        </div>
      </div>
    </section>
  );
}