// ==============================================================================
// APEX PERFORMANCE — HOME PAGE
// File Path: client/src/pages/Home.jsx
// Route: /
// Static content only (no API calls), so it always loads instantly.
// ==============================================================================

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
  { name: 'Strength', blurb: 'Coached lifting sessions to build a stronger, more resilient body.' },
  { name: 'Cardio', blurb: 'Conditioning work to build endurance and heart health.' },
  { name: 'Recovery', blurb: 'Massage and recovery sessions to help you bounce back between workouts.' },
  { name: 'Mobility', blurb: 'Guided sessions to improve movement, flexibility and range of motion.' },
  { name: 'Assessment', blurb: 'A starting point: a coach reviews your goals and where you are today.' }
];

const STEPS = [
  {
    title: 'Tell us your goal',
    text: 'Describe what you want in your own words, or browse the catalog by category.'
  },
  {
    title: 'Pick a service',
    text: 'Our assistant suggests real services from our catalog, with the reasons they fit.'
  },
  {
    title: 'Book your time',
    text: 'Choose a date and time. We check for conflicts so your slot is protected.'
  }
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <section className="card text-center" aria-labelledby="home-heading">
        <h1 id="home-heading">Train smarter. Recover better.</h1>
        <p className="text-muted">
          Apex Performance connects you with coaches for strength, conditioning, mobility and recovery. Describe your
          goal, get suggestions from our real catalog, and book in minutes.
        </p>
        <p>
          <Link className="btn" to="/services">
            Find my service
          </Link>{' '}
          {isAuthenticated ? (
            <Link className="btn btn-secondary" to="/dashboard">
              Go to my dashboard
            </Link>
          ) : (
            <Link className="btn btn-secondary" to="/register">
              Create a free account
            </Link>
          )}
        </p>
      </section>

      <section aria-labelledby="how-heading" style={{ marginTop: 'var(--space-6)' }}>
        <h2 id="how-heading">How it works</h2>
        <div className="grid-cards">
          {STEPS.map((step, index) => (
            <article className="card" key={step.title}>
              <h3>
                {index + 1}. {step.title}
              </h3>
              <p className="text-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="categories-heading" style={{ marginTop: 'var(--space-6)' }}>
        <h2 id="categories-heading">What we offer</h2>
        <div className="grid-cards">
          {CATEGORIES.map((category) => (
            <article className="card" key={category.name}>
              <h3>{category.name}</h3>
              <p className="text-muted">{category.blurb}</p>
              <Link className="btn btn-secondary" to={`/services?category=${encodeURIComponent(category.name)}`}>
                Browse {category.name}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}