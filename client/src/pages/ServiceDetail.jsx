// ==============================================================================
// APEX PERFORMANCE — SERVICE DETAIL PAGE
// File Path: client/src/pages/ServiceDetail.jsx
// Route: /services/:id
// ==============================================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatDuration, formatPrice, getCategoryClass } from '../utils/serviceHelpers.js';

// A MongoDB ObjectId is exactly 24 hexadecimal characters
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export default function ServiceDetail() {
  const { id } = useParams();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, service: null, error: '', notFound: false });

  const isValidId = OBJECT_ID_PATTERN.test(id ?? '');

  // Identifies one specific request; a different service or a retry creates a new key
  const requestKey = `${id}#${reloadCount}`;

  useEffect(() => {
    // A malformed id never reaches the API
    if (!isValidId) {
      return undefined;
    }

    let cancelled = false;

    api
      .get(`/services/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!cancelled) {
          setResult({ key: requestKey, service: data?.service ?? null, error: '', notFound: !data?.service });
        }
      })
      .catch((error) => {
        if (cancelled) return;

        // 400 (malformed id) and 404 (no active service) both mean "not available"
        const isMissing = error.status === 400 || error.status === 404;
        setResult({
          key: requestKey,
          service: null,
          error: isMissing ? '' : error.message,
          notFound: isMissing
        });
      });

    // If the user navigates to another service first, ignore this stale response
    return () => {
      cancelled = true;
    };
  }, [id, isValidId, requestKey]);

  const isCurrent = result.key === requestKey;
  const isLoading = isValidId && !isCurrent;
  const notFound = !isValidId || (isCurrent && result.notFound);
  const hasError = isValidId && isCurrent && !result.notFound && Boolean(result.error);
  const service = isCurrent ? result.service : null;

  const handleRetry = () => setReloadCount((count) => count + 1);

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

  if (hasError) {
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

  return (
    <article className="card">
      <Link className="back-link" to="/services">
        <span aria-hidden="true">&larr; </span>Back to all services
      </Link>

      <div className="detail-header">
        <h1>{service.name}</h1>
        <span className={`category-tag ${getCategoryClass(service.category)}`}>{service.category || 'General'}</span>
      </div>

      <p>{service.description}</p>

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
    </article>
  );
}