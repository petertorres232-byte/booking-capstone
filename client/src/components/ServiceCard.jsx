// ==============================================================================
// APEX PERFORMANCE — SERVICE CARD
// File Path: client/src/components/ServiceCard.jsx
// Props: service (catalog shape with _id OR AI shape with id), headingLevel (2 or 3),
//        children (optional extra content, e.g. an AI "why this fits" note)
// ==============================================================================

import { Link } from 'react-router-dom';
import { formatDuration, formatPrice, getCategoryClass, getServiceId } from '../utils/serviceHelpers.js';

export default function ServiceCard({ service, headingLevel = 2, children }) {
  if (!service) {
    return null;
  }

  const serviceId = getServiceId(service);
  const detailPath = serviceId ? `/services/${encodeURIComponent(serviceId)}` : null;
  const serviceName = service.name || 'Untitled service';
  const Heading = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <article className="card service-card">
      <span className={`category-tag ${getCategoryClass(service.category)}`}>{service.category || 'General'}</span>

      <Heading className="service-card__title">
        {detailPath ? <Link to={detailPath}>{serviceName}</Link> : serviceName}
      </Heading>

      <p className="service-card__description">{service.description}</p>

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
    </article>
  );
}