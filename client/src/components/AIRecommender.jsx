// ==============================================================================
// APEX PERFORMANCE — AI SERVICE FINDER (CLIENT)
// File Path: client/src/components/AIRecommender.jsx
// Calls POST /api/ai/recommend-service (public, rate limited on the server).
// The browser never contacts the AI provider; all AI output is rendered as text.
// ==============================================================================

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ServiceCard from './ServiceCard.jsx';
import { api } from '../services/api.js';
import { getServiceId } from '../utils/serviceHelpers.js';

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;
const AI_TIMEOUT_MS = 40000; // AI calls can be slow; the server has its own shorter limit

// Only this exact internal path is trusted from the server's fallback hint
const ALLOWED_FALLBACK_PATH = '/services';

const IDLE_RESULT = { status: 'idle', data: null, error: '', showCatalogLink: false };

export default function AIRecommender() {
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState(IDLE_RESULT);
  const latestRequest = useRef(0);

  const isLoading = result.status === 'loading';
  const remaining = MAX_LENGTH - message.length;

  const handleChange = (event) => {
    setMessage(event.target.value);
    setFieldError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const trimmed = message.trim();
    if (trimmed.length < MIN_LENGTH) {
      setFieldError(`Please describe your goal in at least ${MIN_LENGTH} characters.`);
      document.getElementById('ai-goal')?.focus();
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setFieldError(`Please keep your description under ${MAX_LENGTH} characters.`);
      document.getElementById('ai-goal')?.focus();
      return;
    }

    // Each submit gets a number; only the newest request may update the screen
    latestRequest.current += 1;
    const requestNumber = latestRequest.current;

    setFieldError('');
    setResult({ status: 'loading', data: null, error: '', showCatalogLink: false });

    try {
      const data = await api.post(
        '/ai/recommend-service',
        { message: trimmed },
        { auth: false, timeoutMs: AI_TIMEOUT_MS }
      );

      if (requestNumber !== latestRequest.current) return;
      setResult({ status: 'done', data, error: '', showCatalogLink: false });
    } catch (error) {
      if (requestNumber !== latestRequest.current) return;

      const fallbackPath = error.data?.fallback?.path;
      setResult({
        status: 'error',
        data: null,
        error: error.message || 'The assistant is unavailable right now.',
        showCatalogLink: fallbackPath === ALLOWED_FALLBACK_PATH || error.status === 0
      });
    }
  };

  const recommendations = Array.isArray(result.data?.recommendations) ? result.data.recommendations : [];

  return (
    <section className="card" aria-labelledby="ai-finder-heading">
      <h2 id="ai-finder-heading">Not sure where to start?</h2>
      <p className="text-muted">
        Describe your goal and our AI assistant will suggest services from our catalog. Suggestions are
        general guidance, not medical advice.
      </p>

      <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <div className="form-group">
          <label htmlFor="ai-goal">Your goal</label>
          <textarea
            id="ai-goal"
            name="goal"
            rows={3}
            maxLength={MAX_LENGTH + 50}
            value={message}
            onChange={handleChange}
            placeholder="For example: I want to build strength after a long break and loosen up my tight hips."
            aria-invalid={fieldError ? 'true' : undefined}
            aria-describedby={['ai-goal-count', fieldError ? 'ai-goal-error' : null].filter(Boolean).join(' ')}
            style={{ width: '100%' }}
          />
          <small id="ai-goal-count" className="text-muted">
            {remaining >= 0 ? `${remaining} characters remaining` : `${Math.abs(remaining)} characters over the limit`}
          </small>
          {fieldError && (
            <p id="ai-goal-error" className="field-error" role="alert">
              {fieldError}
            </p>
          )}
        </div>

        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Find my services'}
        </button>
      </form>

      <div aria-live="polite" style={{ marginTop: 'var(--space-4)' }}>
        {isLoading && (
          <p className="text-muted" role="status">
            <span className="spinner" aria-hidden="true" /> Looking through our catalog. This can take a few seconds...
          </p>
        )}

        {result.status === 'error' && (
          <div className="alert alert-error" role="alert">
            <p>{result.error}</p>
            {result.showCatalogLink && (
              <Link className="btn btn-secondary" to={ALLOWED_FALLBACK_PATH}>
                Browse the full catalog instead
              </Link>
            )}
          </div>
        )}

        {result.status === 'done' && (
          <div>
            {result.data?.summary && <p>{result.data.summary}</p>}

            {result.data?.outOfScope && (
              <p className="text-muted">
                That request is outside what we offer, so here is how to browse what we do have.
              </p>
            )}

            {recommendations.length === 0 ? (
              <p>
                We could not find a close match.{' '}
                <Link to={ALLOWED_FALLBACK_PATH}>Browse the full catalog</Link>.
              </p>
            ) : (
              <div>
                {recommendations.map((item) => (
                  <ServiceCard key={getServiceId(item.service)} service={item.service} headingLevel={3}>
                    <p>
                      <strong>Why this fits:</strong> {item.reason}
                    </p>
                  </ServiceCard>
                ))}
              </div>
            )}

            {result.data?.disclaimer && <p className="text-muted">{result.data.disclaimer}</p>}
          </div>
        )}
      </div>
    </section>
  );
}