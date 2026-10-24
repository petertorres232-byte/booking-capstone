// ==============================================================================
// APEX PERFORMANCE — FOOTER COMPONENT
// File Path: client/src/components/Footer.jsx
// ==============================================================================

// Change this if you want a different credit line on the site
const AUTHOR_NAME = 'Peter Torres';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          &copy; {currentYear} Apex Performance. Built by {AUTHOR_NAME} as a Software Engineering Capstone Project.
        </p>
        <p>
          Service recommendations from the AI assistant are general fitness guidance, not medical advice. If you have
          pain or an injury, please check with a healthcare professional.
        </p>
      </div>
    </footer>
  );
}