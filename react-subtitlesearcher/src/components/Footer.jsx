import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link className="footer-brand" to="/">SubtitleSearcher</Link>
          <p>Premium subtitle discovery for movies, series, quotes, and scenes.</p>
        </div>
        <nav aria-label="Footer quick links">
          <h2>Quick Links</h2>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/bot">Bot</Link>
        </nav>
        <div>
          <h2>Credits</h2>
          <p>Data Sources</p>
          <p>OpenSubtitles integrations and local subtitle indexing.</p>
        </div>
        <div>
          <h2>GitHub</h2>
          <p>INF 124 SubtitleSearcher</p>
          <p>&copy; {new Date().getFullYear()} SubtitleSearcher</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
