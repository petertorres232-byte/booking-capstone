// ==============================================================================
// APEX PERFORMANCE — LAYOUT (SHARED PAGE FRAME FOR EVERY ROUTE)
// File Path: client/src/components/Layout.jsx
// Used as a layout route: child pages render where <Outlet /> is.
// ==============================================================================

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="container page">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}