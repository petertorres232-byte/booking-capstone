// ==============================================================================
// APEX PERFORMANCE — SERVICES CATALOG PAGE
// File Path: client/src/pages/Services.jsx
// Route: /services  (optional filter: /services?category=Recovery)
// ==============================================================================

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AIRecommender from '../components/AIRecommender.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { api } from '../services/api.js';
import { getServiceId } from '../utils/serviceHelpers.js';

// Mirrors the server's allowed categories. The server still validates every request.
const CATEGORIES = ['Strength', 'Cardio', 'Recovery', 'Mobility', 'Assessment'];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, services: [], error: '' });

  // The URL is user-editable, so only accept known categories (anything else means "All")
  const requestedCategory = searchParams.get('category');
  const category = CATEGORIES.includes(requestedCategory) ? requestedCategory : '';

  // Identifies one specific request; a new filter or a retry creates a new key
  const requestKey = `${category}#${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    const path = category ? `/services?category=${encodeURIComponent(category)}` : '/services';

    api
      .get(path)
      .then((data) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            services: Array.isArray(data?.services) ? data.services : [],
            error: ''
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({ key: requestKey, services: [], error: error.message });
        }
      });

    // If the filter changes before this response arrives, ignore the stale response
    return () => {
      cancelled = true;
    };
  }, [category, requestKey]);

  const isLoading = result.key !== requestKey;
  const hasError = !isLoading && Boolean(result.error);
  const services = result.services;

  const handleSelectCategory = (nextCategory) => {
    setSearchParams(nextCategory ? { category: nextCategory } : {}, { replace: true });
  };

  const handleRetry = () => setReloadCount((count) => count + 1);

  const countMessage = `${services.length} ${services.length === 1 ? 'service' : 'services'}${
    category ? ` in ${category}` : ''
  }`;

  return (
    <>
      <div className="page-header">
        <h1>Our services</h1>
        <p className="text-muted">
          Strength coaching, conditioning, mobility and recovery sessions with certified coaches. Pick a category or
          browse everything.
        </p>
      </div>

            

      <AIRecommender />

      <div className="filter-bar" role="group" aria-label="Filter services by category">
        <button
          type="button"
          className="filter-chip"
          aria-pressed={category === ''}
          onClick={() => handleSelectCategory('')}
        >
          All
        </button>
        {CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            className="filter-chip"
            aria-pressed={category === name}
            onClick={() => handleSelectCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="card text-center" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" /> Loading services...
        </div>
      )}

      {hasError && (
        <div className="alert alert-error" role="alert">
          <p>We could not load the services. {result.error}</p>
          <button type="button" className="btn btn-secondary" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !hasError && services.length === 0 && (
        <div className="card text-center">
          <p>
            {category
              ? `There are no ${category} services available right now.`
              : 'No services are available right now. Please check back soon.'}
          </p>
          {category && (
            <button type="button" className="btn btn-secondary" onClick={() => handleSelectCategory('')}>
              View all services
            </button>
          )}
        </div>
      )}

      {!isLoading && !hasError && services.length > 0 && (
        <>
          <p className="text-muted" role="status">
            {countMessage}
          </p>
          <div className="grid-cards">
            {services.map((service) => (
              <ServiceCard key={getServiceId(service) || service.name} service={service} />
            ))}
          </div>
        </>
      )}
    </>
  );
}