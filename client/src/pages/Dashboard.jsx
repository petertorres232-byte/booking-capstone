// ==============================================================================
// APEX PERFORMANCE — USER DASHBOARD
// File Path: client/src/pages/Dashboard.jsx
// Route: /dashboard   (wrapped in <ProtectedRoute> in App.jsx)
// ==============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard from '../components/BookingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const toTime = (value) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/**
 * Split bookings into upcoming and history lists.
 * Upcoming = confirmed and not yet finished (soonest first).
 * History  = everything else (most recent first).
 */
function splitBookings(bookings, now) {
  const upcoming = [];
  const history = [];

  for (const booking of bookings) {
    const isActive = booking.status === 'confirmed' && toTime(booking.endTime) > now;
    if (isActive) {
      upcoming.push(booking);
    } else {
      history.push(booking);
    }
  }

  upcoming.sort((a, b) => toTime(a.startTime) - toTime(b.startTime));
  history.sort((a, b) => toTime(b.startTime) - toTime(a.startTime));

  return { upcoming, history };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, bookings: [], error: '', loadedAt: 0 });

  // Identifies one specific request; a retry creates a new key
  const requestKey = `bookings#${reloadCount}`;

  useEffect(() => {
    let cancelled = false;

    api
      .get('/bookings/mine')
      .then((data) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            bookings: Array.isArray(data?.bookings) ? data.bookings : [],
            error: '',
            loadedAt: Date.now()
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({ key: requestKey, bookings: [], error: error.message, loadedAt: Date.now() });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const isCurrent = result.key === requestKey;
  const isLoading = !isCurrent;
  const handleRetry = () => setReloadCount((count) => count + 1);

  if (isLoading) {
    return (
      <div className="card text-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading your appointments...
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="alert alert-error" role="alert">
        <p>We could not load your appointments. {result.error}</p>
        <button type="button" className="btn btn-secondary" onClick={handleRetry}>
          Try again
        </button>
      </div>
    );
  }

  const { upcoming, history } = splitBookings(result.bookings, result.loadedAt);

  return (
    <div>
      <div className="page-header">
        <h1>{user?.name ? `Welcome back, ${user.name}` : 'Your dashboard'}</h1>
        <p className="text-muted">Manage your coaching and recovery appointments.</p>
        <Link className="btn" to="/services">
          Book a service
        </Link>
      </div>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Upcoming appointments ({upcoming.length})</h2>

        {upcoming.length === 0 ? (
          <div className="card text-center">
            <p>You have no upcoming appointments.</p>
            <Link className="btn" to="/services">
              Browse services
            </Link>
          </div>
        ) : (
          upcoming.map((booking) => <BookingCard key={booking._id} booking={booking} />)
        )}
      </section>

      <section aria-labelledby="history-heading" style={{ marginTop: 'var(--space-6)' }}>
        <h2 id="history-heading">History ({history.length})</h2>

        {history.length === 0 ? (
          <p className="text-muted">Past and cancelled appointments will appear here.</p>
        ) : (
          history.map((booking) => (
            <BookingCard key={booking._id} booking={booking} isPast={toTime(booking.endTime) <= result.loadedAt} />
          ))
        )}
      </section>
    </div>
  );
}