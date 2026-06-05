import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatDate(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function Account() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, logout, refreshProfile } = useAuth();
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    setRefreshing(true);
    refreshProfile()
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, refreshProfile]);

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleRefresh = async () => {
    setError('');
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="cinema-page interior-page account-page">
      <section className="page-hero compact-hero">
        <p className="eyebrow">Your Account</p>
        <h1>{user?.username ? `Welcome, ${user.username}.` : 'Welcome back.'}</h1>
        <p>Manage the signed-in session connected to SubtitleSearcher.</p>
      </section>

      <section className="section-panel account-panel">
        <div className="section-heading">
          <p className="eyebrow">Profile</p>
          <h2>Account details.</h2>
        </div>

        {error && <p className="error-copy" role="alert">{error}</p>}

        <div className="account-details">
          <article className="info-card">
            <h3>Username</h3>
            <p>{user?.username || (refreshing ? 'Loading...' : 'Not available')}</p>
          </article>
          <article className="info-card">
            <h3>Email</h3>
            <p>{user?.email || (refreshing ? 'Loading...' : 'Not available')}</p>
          </article>
          <article className="info-card">
            <h3>Member Since</h3>
            <p>{refreshing ? 'Loading...' : formatDate(user?.createdAt)}</p>
          </article>
        </div>

        <div className="account-actions">
          <button className="button button-secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Profile'}
          </button>
          <button className="button button-primary" type="button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </section>
    </div>
  );
}

export default Account;
