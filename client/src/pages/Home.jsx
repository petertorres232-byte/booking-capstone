// ==============================================================================
// APEX PERFORMANCE — HOME PAGE
// File Path: client/src/pages/Home.jsx
// Photo hero, how-it-works steps, and one photo tile per service category.
// The Layout's <main> already provides the page container, so no wrapper here.
// ==============================================================================

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/home.css';

const STEPS = [
  {
    title: 'Pick a service',
    text: 'Browse the catalog, or describe your goal and let the AI finder suggest options from our real services.',
  },
  {
    title: 'Choose a time',
    text: 'Select a date and time that suits you. Conflicts are checked instantly, so a confirmed slot is yours.',
  },
  {
    title: 'Show up and train',
    text: 'Manage, reschedule or cancel from your dashboard any time before your session.',
  },
];

// Names must match the server's categories exactly (the Services page validates them)
const CATEGORIES = [
  {
    name: 'Strength',
    text: 'Coached lifting sessions built around your goals.',
    image: '/images/strength.webp',
  },
  {
    name: 'Cardio',
    text: 'Conditioning and endurance work that builds steadily.',
    image: '/images/cardio.webp',
  },
  {
    name: 'Recovery',
    text: 'Sessions to reset, repair and come back stronger.',
    image: '/images/recovery.webp',
  },
  {
    name: 'Mobility',
    text: 'Move through a fuller range with less friction.',
    image: '/images/mobility.webp',
  },
  {
    name: 'Assessment',
    text: 'A clear baseline and a plan before you begin.',
    image: '/images/assessment.webp',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        {/* Decorative photo (alt is empty on purpose): the headline carries the meaning */}
        <img
          className="hero__image"
          src="/images/hero.webp"
          alt=""
          width="2400"
          height="1350"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__content">
          <h1 id="hero-heading">Train with a plan. Book in seconds.</h1>
          <p className="hero__lead">
            Apex Performance connects you with strength, cardio, recovery and mobility sessions, and
            an AI finder that suggests services from our real catalog.
          </p>
          <div className="hero__actions">
            <Link to="/services" className="btn">
              Browse services
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-secondary">
                My appointments
              </Link>
            ) : (
              <Link to="/register" className="btn btn-secondary">
                Create an account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li className="step" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section" aria-labelledby="categories-heading">
        <h2 id="categories-heading">Find your focus</h2>
        <p className="home-section__intro">
          Five categories, one place to book. Choose where you want to start.
        </p>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <Link
              to={`/services?category=${encodeURIComponent(category.name)}`}
              className="category-tile"
              key={category.name}
            >
              <img
                className="category-tile__image"
                src={category.image}
                alt=""
                width="1600"
                height="1200"
                loading="lazy"
                decoding="async"
              />
              <span className="category-tile__shade" aria-hidden="true" />
              <span className="category-tile__body">
                <h3>
                  {category.name}
                  <ArrowRight className="category-tile__arrow" size={22} aria-hidden="true" />
                </h3>
                <p>{category.text}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}