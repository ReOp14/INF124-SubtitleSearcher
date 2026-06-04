import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

function titleFromId(mediaId) {
  return decodeURIComponent(mediaId || 'Selected Media')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MediaDetails() {
  const { mediaId } = useParams();
  const [localSearch, setLocalSearch] = useState('');
  const [isVectorSearching, setIsVectorSearching] = useState(false);
  const title = useMemo(() => titleFromId(mediaId), [mediaId]);

  const handleSimilaritySearch = () => {
    setIsVectorSearching(true);
    window.setTimeout(() => {
      setIsVectorSearching(false);
    }, 900);
  };

  return (
    <div className="cinema-page interior-page">
      <section className="media-detail-hero">
        <div>
          <p className="eyebrow">Media Detail</p>
          <h1>{title}</h1>
          <p>Inspect subtitle tracks, filter visible lines, and launch similarity search for this title.</p>
        </div>
        <button
          onClick={handleSimilaritySearch}
          disabled={isVectorSearching}
          className="button button-gold"
          type="button"
        >
          {isVectorSearching ? 'Searching...' : 'Run Similarity Search'}
        </button>
      </section>

      <section className="section-panel">
        <form className="inline-search" onSubmit={(event) => event.preventDefault()}>
          <input
            type="text"
            placeholder="Filter subtitles locally..."
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            aria-label="Filter subtitles locally"
          />
        </form>

        <div className="empty-state">
          <h2>No subtitle lines loaded.</h2>
          <p>Try checking spelling, shortening the quote, or searching a broader title.</p>
        </div>
      </section>
    </div>
  );
}

export default MediaDetails;
