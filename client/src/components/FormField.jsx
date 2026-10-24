// ==============================================================================
// APEX PERFORMANCE — FORM FIELD (LABEL + INPUT + HINT + ERROR)
// File Path: client/src/components/FormField.jsx
// Usage: <FormField id="email" label="Email" type="email" value={v} onChange={fn} error={msg} />
// ==============================================================================

export default function FormField({ id, label, error, hint, ...inputProps }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        name={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />

      {hint && (
        <small id={hintId} className="text-muted">
          {hint}
        </small>
      )}

      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}