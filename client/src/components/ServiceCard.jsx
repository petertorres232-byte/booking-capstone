// ==============================================================================
// APEX PERFORMANCE - SERVICE CARD
// File Path: client/src/components/ServiceCard.jsx
// Props: service (catalog shape with _id OR AI shape with id), headingLevel (2 or 3),
//        children (optional extra content, e.g. an AI "why this fits" note)
// Shows a category photo when one exists, and an expandable description.
// ==============================================================================

import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { formatDuration, formatPrice, getCategoryClass, getServiceId } from '../utils/serviceHelpers.js';
import '../styles/service-card.css';

// One illustration per category (files live in client/public/images)
const CATEGORY_IMAGES = {
  strength: '/images/strength.webp',
  cardio: '/images/cardio.webp',
  recovery: '/images/recovery.webp',
  mobility: '/images/mobility.webp',
  assessment: '/images/assessment.webp',
};

// Descriptions longer than this are trimmed to 3 lines with a Show more button
const LONG_DESCRIPTION_LENGTH = 120;

export default function ServiceCard({ service, headingLevel = 2, children }) {
  // Hooks must run before any early return
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionId = useId();

  if (!service) {
    return null;
  }

  const serviceId = getServiceId(service);
  const detailPath = serviceId ? `/services/${encodeURIComponent(serviceId)}` : null;
  const serviceName = service.name || 'Untitled service';
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const description = typeof service.description === 'string' ? service.description : '';
  const isLong = description.length > LONG_DESCRIPTION_LENGTH;
  const image = CATEGORY_IMAGES[String(service.category || '').toLowerCase()] ?? null;

  const categoryTag = (
    <span className={`category-tag ${getCategoryClass(service.category)}`}>{service.category || 'General'}</span>
  );

  return (
    <article className="card service-card">
      {image && (
        <div className="service-card__media">
          {/* Decorative: the title and category tag carry the meaning */}
          <img
            className="service-card__image"
            src={image}
            alt=""
            width="1600"
            height="1200"
            loading="lazy"
            decoding="async"
          />
          {categoryTag}
        </div>
      )}

      <div className="service-card__body">
        {!image && categoryTag}

        <Heading className="service-card__title">
          {detailPath ? <Link to={detailPath}>{serviceName}</Link> : serviceName}
        </Heading>

        <p
          id={descriptionId}
          className={`service-card__description${isExpanded ? ' is-expanded' : ''}`}
        >
          {description}
        </p>

        {isLong && (
          <button
            type="button"
            className="service-card__toggle"
            aria-expanded={isExpanded}
            aria-controls={descriptionId}
            onClick={() => setIsExpanded((open) => !open)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
            <span className="visually-hidden"> about {serviceName}</span>
            <ChevronDown className="service-card__chevron" size={18} aria-hidden="true" />
          </button>
        )}

        {children}

        <p className="service-meta">
          <span>
            <span className="visually-hidden">Duration: </span>
            {formatDuration(service.durationMinutes)}
          </span>
          <span>
            <span className="visually-hidden">Coach: </span>
            {service.coachName}
          </span>
        </p>

        <div className="service-card__footer">
          <span className="price">
            <span className="visually-hidden">Price: </span>
            {formatPrice(service.price)}
          </span>

          {detailPath && (
            <Link className="btn" to={detailPath} aria-label={`View details for ${serviceName}`}>
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}