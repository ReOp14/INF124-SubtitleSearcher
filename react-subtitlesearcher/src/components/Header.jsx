import React from 'react';
import { NavLink } from 'react-router-dom';

function Header() {
  return (
    <header className="site-header">
      <nav aria-label="Main Navigation">
        <ul className="site-nav">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/about">About Us</NavLink></li>
          <li><NavLink to="/contact">Contact</NavLink></li>
          <li><NavLink to="/bot">Bot</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
