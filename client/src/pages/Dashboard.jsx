// ==============================================================================
// APEX PERFORMANCE — USER DASHBOARD
// File Path: client/src/pages/Dashboard.jsx
// Route: /dashboard   (wrapped in <ProtectedRoute> in App.jsx)
// ==============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import BookingActions from '../components/BookingActions.jsx';
import BookingCard from '../components/BookingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import '../styles/dashboard.css';

const toTime = (value) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatShortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatShortTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
  const [notice, setNotice] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const noticeRef = useRef(null);

  // Identifies one specific request; every reload creates a new key
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

  // After an action, move keyboard focus to the status message
  useEffect(() => {
    if (notice) {
      noticeRef.current?.focus();
    }
  }, [notice]);

  const handleChanged = (message) => {
    setNotice(message);
    setReloadCount((count) => count + 1);
  };

  const handleRetry = () => setReloadCount((count) => count + 1);

  const isCurrent = result.key === requestKey;

  // Spinner only for the first load, or when retrying after an error.
  // During a refresh after an action, the previous list stays visible.
  const isLoading = result.key === null || (!isCurrent && Boolean(result.error));

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
  const nextBooking = upcoming[0] ?? null;
  const pastSessions = history.filter((booking) => booking.status !== 'cancelled').length;
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div>
      <section className="dashboard-hero" aria-labelledby="dashboard-heading">
        <div>
          <h1 id="dashboard-heading">{firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}</h1>
          <p className="text-muted">Manage your coaching and recovery appointments.</p>
        </div>
        <Link className="btn" to="/services">
          Book a service
        </Link>
      </section>

      <dl className="dashboard-stats">
        <div className="dashboard-stat">
          <dt>Upcoming</dt>
          <dd>{upcoming.length}</dd>
        </div>
        <div className="dashboard-stat">
          <dt>Next session</dt>
          <dd>
            {nextBooking ? formatShortDate(nextBooking.startTime) : 'None yet'}
            <span className="dashboard-stat__sub">
              {nextBooking
                ? `${formatShortTime(nextBooking.startTime)} · ${nextBooking.service?.name ?? 'Appointment'}`
                : 'Book a service to get started'}
            </span>
          </dd>
        </div>
        <div className="dashboard-stat">
          <dt>Past sessions</dt>
          <dd>{pastSessions}</dd>
        </div>
      </dl>

      {notice && (
        <div className="alert alert-success" role="status" tabIndex={-1} ref={noticeRef}>
          {notice}
        </div>
      )}

      <section className="dashboard-section" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Upcoming appointments ({upcoming.length})</h2>

        {upcoming.length === 0 ? (
          <div className="card text-center">
            <p>You have no upcoming appointments.</p>
            <Link className="btn" to="/services">
              Browse services
            </Link>
          </div>
        ) : (
          upcoming.map((booking) => (
            <BookingCard key={booking._id} booking={booking}>
              <BookingActions booking={booking} onChanged={handleChanged} />
            </BookingCard>
          ))
        )}
      </section>

      <section className="dashboard-section" aria-labelledby="history-heading">
        <details
          className="history-panel"
          open={historyOpen}
          onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
        >
          <summary className="history-summary">
            <h2 id="history-heading">History ({history.length})</h2>
            <ChevronDown className="history-chevron" size={24} aria-hidden="true" />
          </summary>

          <div className="history-panel__content">
            {history.length === 0 ? (
              <p className="text-muted">Past and cancelled appointments will appear here.</p>
            ) : (
              history.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  isPast={toTime(booking.endTime) <= result.loadedAt}
                />
              ))
            )}
          </div>
        </details>
      </section>
    </div>
  );
}