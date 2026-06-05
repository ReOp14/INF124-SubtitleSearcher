import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, signup } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = useMemo(() => {
    const redirectPath = location.state?.from?.pathname;
    return redirectPath && redirectPath !== '/login' && redirectPath !== '/signup' ? redirectPath : '/account';
  }, [location.state]);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cinema-page interior-page auth-page">
      <section className="auth-shell">
        <div className="auth-hero">
          <p className="eyebrow">Member Access</p>
          <h1>{isSignup ? 'Create your SubtitleSearcher account.' : 'Log in to SubtitleSearcher.'}</h1>
          <p>
            Keep your subtitle discovery workspace connected with the account API behind this project.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <p className="eyebrow">{isSignup ? 'New Account' : 'Welcome Back'}</p>
            <h2>{isSignup ? 'Sign up' : 'Log in'}</h2>
          </div>

          {isSignup && (
            <label>
              <span>Username</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={updateField}
                placeholder="Your username"
                autoComplete="username"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Enter your password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {error && <p className="error-copy" role="alert">{error}</p>}

          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Working...' : isSignup ? 'Create Account' : 'Log In'}
          </button>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} state={location.state}>
              {isSignup ? 'Log in' : 'Sign up'}
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

export default AuthPage;
