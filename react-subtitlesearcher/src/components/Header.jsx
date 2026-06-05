import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="site-header">
      <nav aria-label="Main Navigation">
        <ul className="site-nav">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/about">About Us</NavLink></li>
          <li><NavLink to="/contact">Contact</NavLink></li>
          <li><NavLink to="/bot">Bot</NavLink></li>
          {isAuthenticated ? (
            <>
              <li>
                <NavLink to="/account">
                  {user?.username || 'Account'}
                </NavLink>
              </li>
              <li>
                <button className="nav-button" type="button" onClick={logout}>
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login">Log In</NavLink></li>
              <li><NavLink to="/signup">Sign Up</NavLink></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
