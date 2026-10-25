// ==============================================================================
// APEX PERFORMANCE — CONFIRM DIALOG (ACCESSIBLE MODAL)
// File Path: client/src/components/ConfirmDialog.jsx
// Usage:
//   <ConfirmDialog open={open} title="Cancel booking?" confirmLabel="Yes, cancel"
//                  cancelLabel="Keep booking" danger busy={busy}
//                  onConfirm={doIt} onCancel={() => setOpen(false)}>
//     <p>Explanation or form fields...</p>
//   </ConfirmDialog>
// ==============================================================================

import { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // Keep the native dialog in sync with the `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // Destructive dialogs start on the safe button; others on the first marked element
      dialog.querySelector('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc key: let our state decide, and ignore it while a request is running
  const handleCancel = (event) => {
    event.preventDefault();
    if (!busy) {
      onCancel();
    }
  };

  // Click on the dark backdrop (the dialog element itself) dismisses it
  const handleClick = (event) => {
    if (event.target === dialogRef.current && !busy) {
      onCancel();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!busy) {
      onConfirm();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
      style={{
        border: 'none',
        borderRadius: 'var(--radius, 8px)',
        padding: 0,
        width: 'calc(100% - 2rem)',
        maxWidth: '480px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      {open && (
        <form onSubmit={handleSubmit} aria-busy={busy} style={{ padding: '1.5rem' }}>
          <h2 id={titleId} style={{ marginTop: 0 }}>
            {title}
          </h2>

          {children}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={busy}
              data-autofocus={danger ? '' : undefined}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={danger ? 'btn btn-danger' : 'btn'}
              disabled={busy}
              data-autofocus={danger ? undefined : ''}
            >
              {busy ? 'Working...' : confirmLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}