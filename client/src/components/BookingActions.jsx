// ==============================================================================
// APEX PERFORMANCE — BOOKING ACTIONS (RESCHEDULE + CANCEL)
// File Path: client/src/components/BookingActions.jsx
// Usage: <BookingActions booking={b} onChanged={(message) => reloadAndAnnounce(message)} />
// Only render this for upcoming, confirmed bookings (the Dashboard decides).
// ==============================================================================

import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog.jsx';
import FormField from './FormField.jsx';
import { api } from '../services/api.js';
import {
  formatDateTime,
  getMinLocalDateTime,
  localInputToIso,
  validateBookingForm
} from '../utils/bookingHelpers.js';

export default function BookingActions({ booking, onChanged }) {
  const serviceName = booking.service?.name ?? 'this appointment';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const [newStartTime, setNewStartTime] = useState('');
  const [fieldError, setFieldError] = useState('');

  // ---------- Cancel ----------
  const openCancel = () => {
    setDialogError('');
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (!busy) setCancelOpen(false);
  };

  const confirmCancel = async () => {
    setBusy(true);
    setDialogError('');

    try {
      await api.delete(`/bookings/${encodeURIComponent(booking._id)}`);
      setBusy(false);
      setCancelOpen(false);
      onChanged('Your appointment was cancelled.');
    } catch (error) {
      setDialogError(error.message || 'We could not cancel this appointment. Please try again.');
      setBusy(false);
    }
  };

  // ---------- Reschedule ----------
  const openReschedule = () => {
    setDialogError('');
    setFieldError('');
    setNewStartTime('');
    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    if (!busy) setRescheduleOpen(false);
  };

  const handleTimeChange = (event) => {
    setNewStartTime(event.target.value);
    setFieldError('');
    setDialogError('');
  };

  const confirmReschedule = async () => {
    const errors = validateBookingForm({ startTime: newStartTime, notes: '' });
    if (errors.startTime) {
      setFieldError(errors.startTime);
      return;
    }

    setBusy(true);
    setDialogError('');

    try {
      await api.patch(`/bookings/${encodeURIComponent(booking._id)}`, {
        startTime: localInputToIso(newStartTime)
      });
      setBusy(false);
      setRescheduleOpen(false);
      onChanged('Your appointment was rescheduled.');
    } catch (error) {
      if (error.status === 409) {
        setDialogError(
          'That time overlaps an existing appointment for this service. Please choose a different time.'
        );
      } else {
        setDialogError(error.message || 'We could not reschedule this appointment. Please try again.');
      }
      setBusy(false);
    }
  };

  const timeFieldId = `reschedule-${booking._id}`;

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={openReschedule}
          aria-label={`Reschedule ${serviceName}`}
        >
          Reschedule
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={openCancel}
          aria-label={`Cancel booking for ${serviceName}`}
        >
          Cancel booking
        </button>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this appointment?"
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={closeCancel}
      >
        <p>
          You are about to cancel <strong>{serviceName}</strong> on {formatDateTime(booking.startTime)}.
        </p>
        <p className="text-muted">The time slot will be released for others to book.</p>
        {dialogError && (
          <div className="alert alert-error" role="alert">
            {dialogError}
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={rescheduleOpen}
        title="Reschedule appointment"
        confirmLabel="Save new time"
        cancelLabel="Keep current time"
        busy={busy}
        onConfirm={confirmReschedule}
        onCancel={closeReschedule}
      >
        <p>
          <strong>{serviceName}</strong> is currently booked for {formatDateTime(booking.startTime)}.
        </p>
        {dialogError && (
          <div className="alert alert-error" role="alert">
            {dialogError}
          </div>
        )}
        <FormField
          id={timeFieldId}
          label="New date and time"
          type="datetime-local"
          min={getMinLocalDateTime()}
          value={newStartTime}
          onChange={handleTimeChange}
          hint="Shown in your local time zone."
          error={fieldError}
        />
      </ConfirmDialog>
    </>
  );
}