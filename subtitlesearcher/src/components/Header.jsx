import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="site-header">
      <div className="logo">
        <Link to="/">SubtitleSearcher</Link>
      </div>
      <nav aria-label="Main Navigation">
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/bot">Bot</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;