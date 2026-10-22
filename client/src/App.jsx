// ==============================================================================
// APEX PERFORMANCE — APP ROOT (TEMPORARY ROUTER SHELL)
// File Path: client/src/App.jsx
// Replaced step by step: Navbar/Layout (Step 28), real pages (Steps 29-35)
// ==============================================================================

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function HomePlaceholder() {
  return (
    <section className="card">
      <h1>Apex Performance</h1>
      <p className="text-muted">
        Router shell is working. The real home page arrives in a later step.
      </p>
      <Link className="btn" to="/services">
        Browse services
      </Link>
    </section>
  );
}

function ServicesPlaceholder() {
  return (
    <section className="card">
      <h1>Services</h1>
      <p className="text-muted">The live service catalog will load here from the API.</p>
    </section>
  );
}

function NotFoundPlaceholder() {
  return (
    <section className="card text-center">
      <h1>Page not found</h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link className="btn" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="container page-title" aria-label="Main navigation">
        <Link to="/">Home</Link> | <Link to="/services">Services</Link>
      </nav>

      <main className="container page">
        <Routes>
          <Route path="/" element={<HomePlaceholder />} />
          <Route path="/services" element={<ServicesPlaceholder />} />
          <Route path="*" element={<NotFoundPlaceholder />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}