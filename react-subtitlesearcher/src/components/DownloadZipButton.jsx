import React, { useState } from 'react';
import { downloadSubtitleZip } from '../config/api';

function DownloadZipButton({ query, className = 'button button-secondary', label = 'Download ZIP' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    const trimmed = query?.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');

    try {
      await downloadSubtitleZip(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="download-zip-control">
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={loading || !query?.trim()}
      >
        {loading ? 'Downloading...' : label}
      </button>
      {error && <small className="error-copy">{error}</small>}
    </div>
  );
}

export default DownloadZipButton;
