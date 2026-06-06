import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DownloadZipButton from '../components/DownloadZipButton';
import { apiUrl } from '../config/api';

function parseErrorPayload(text, fallback) {
  if (!text) return fallback;
  try {
    const body = JSON.parse(text);
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
    }
    return JSON.stringify(body);
  } catch {
    return text.trim() || fallback;
  }
}

function ShowResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [state, setState] = useState({ status: query ? 'loading' : 'idle', results: [], error: '' });

  const endpoint = useMemo(() => {
    if (!query.trim()) return '';
    return apiUrl(`/api/subtitles?query=${encodeURIComponent(query.trim())}`);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      if (!endpoint) {
        setState({ status: 'idle', results: [], error: '' });
        return;
      }

      setState({ status: 'loading', results: [], error: '' });

      try {
        const response = await fetch(endpoint);
        const text = await response.text();

        if (!response.ok) {
          const detail = parseErrorPayload(text, response.statusText || 'Search request failed');
          throw new Error(`${response.status} ${detail}`);
        }

        const data = text ? JSON.parse(text) : {};
        const results = data.sample
          ? [{
              title: data.query || query,
              language: 'English',
              text: data.sample,
            }]
          : [];

        if (!cancelled) {
          setState({ status: results.length ? 'success' : 'empty', results, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Show search failed:', { query, endpoint, message });
          setState({ status: 'error', results: [], error: message });
        }
      }
    }

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [endpoint, query]);

  return (
    <div className="cinema-page interior-page">
      <section className="page-hero compact-hero">
        <p className="eyebrow">Search Results</p>
        <h1>{query ? `Results for ${query}` : 'Movie and show results'}</h1>
        <p>
          {query
            ? 'Searching the subtitle API for matching media and subtitle previews.'
            : 'Start from the landing page to search for a movie or show.'}
        </p>
      </section>

      <section className="section-panel">
        {state.status === 'idle' && (
          <div className="empty-state">
            <h2>No search query yet.</h2>
            <p>Search from the landing page to load subtitle results.</p>
            <Link className="button button-primary" to="/">Search again</Link>
          </div>
        )}

        {state.status === 'loading' && (
          <div className="results-state" role="status" aria-live="polite">
            <p className="eyebrow">Loading</p>
            <h2>Searching subtitles for {query}...</h2>
            <div className="skeleton-list"><span /><span /><span /></div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="api-error-state" role="alert">
            <p className="eyebrow">API Error</p>
            <h2>Search failed.</h2>
            <p>{state.error}</p>
            <small>
              Checked endpoint: <code>{endpoint}</code>. Backend secrets should live in
              <code> api-subtitlesearcher/.env </code>
              as <code>OS_API_KEY</code>, <code>OS_USERNAME</code>, <code>OS_PASSWORD</code>, and
              <code> OS_USER_AGENT</code>. This Create React App frontend uses the proxy and does not need public API secrets.
            </small>
          </div>
        )}

        {state.status === 'empty' && (
          <div className="empty-state">
            <h2>No results found.</h2>
            <p>Try checking spelling, shortening the title, or searching a broader title.</p>
            <Link className="button button-primary" to="/">Search again</Link>
          </div>
        )}

        {state.status === 'success' && (
          <div className="subtitle-preview">
            <div className="subtitle-preview-header">
              <div>
                <p className="eyebrow">Results Found</p>
                <h2>{state.results.length} subtitle preview</h2>
              </div>
              <DownloadZipButton query={query} />
            </div>
            {state.results.map((result, index) => (
              <article className="result-card" key={`${result.title}-${index}`}>
                <strong>{result.title}</strong>
                <small>{result.language}</small>
                <pre>{result.text}</pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ShowResults;
