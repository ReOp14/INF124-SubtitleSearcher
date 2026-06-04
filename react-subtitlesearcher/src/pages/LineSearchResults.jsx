import React from 'react';
import { Link } from 'react-router-dom';

function LineSearchResults() {
  return (
    <div className="cinema-page interior-page">
      <section className="page-hero compact-hero">
        <p className="eyebrow">Quote Matches</p>
        <h1>Subtitle line results</h1>
        <p>Matched dialogue, timestamps, and episode context will appear here after a quote search.</p>
      </section>

      <section className="section-panel">
        <div className="empty-state">
          <h2>No results found.</h2>
          <p>Try checking spelling, shortening the quote, or searching a broader title.</p>
          <Link className="button button-primary" to="/#quote">Search quotes</Link>
        </div>
      </section>
    </div>
  );
}

export default LineSearchResults;
