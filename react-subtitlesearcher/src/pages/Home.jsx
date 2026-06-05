import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const trendingSearches = ['Interstellar', 'Breaking Bad', 'The Office', 'Oppenheimer', 'Game of Thrones'];

const featuredMovie = {
  id: 'oppenheimer',
  title: 'Oppenheimer',
  year: '2023',
  rating: '8.3',
  genres: ['Biography', 'Drama', 'History'],
  description:
    'A dense, dialogue-driven portrait of ambition, consequence, and the race to build a world-changing weapon.',
  poster: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
  fallbackPoster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80',
};

function EmptyState({ title = 'No results found.' }) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      <p>Try checking spelling, shortening the quote, or searching a broader title.</p>
    </div>
  );
}

function LandingHeader() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="landing-navbar">
      <Link className="landing-brand" to="/">Area</Link>
      <nav className="landing-nav-links" aria-label="Landing page navigation">
        <a href="#quote">Search a Line</a>
        <a href="#find-subtitle">Find Subtitle</a>
        <Link to="/about">About</Link>
      </nav>
      {isAuthenticated ? (
        <Link className="landing-cta" to="/account">{user?.username || 'Account'}</Link>
      ) : (
        <Link className="landing-cta" to="/login">Log In</Link>
      )}
    </header>
  );
}

function FigmaHero() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const activate = () => {
    setActive(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submitSearch = (value = query) => {
    const cleanQuery = value.trim();
    if (cleanQuery) {
      navigate(`/results/shows?query=${encodeURIComponent(cleanQuery)}`);
    }
  };

  const handleTrending = (value) => {
    setQuery(value);
    setActive(true);
    submitSearch(value);
  };

  return (
    <section className="figma-hero" aria-labelledby="hero-title">
      <h1 id="hero-title">Your Subtitle Crew.</h1>

      <div className="figma-display-wrap">
        <div className="figma-green-block" aria-hidden="true" />
        <div className="figma-display-card">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80"
            alt="Cinematic theater screen with film reels"
          />
          <div className="figma-display-overlay">
            <p>Subtitle Discovery</p>
            <strong>Search lines,<br />scenes, and tracks</strong>
          </div>
          <form className={`figma-hero-search ${active || query ? 'is-active' : ''}`} onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}>
            <div
              className="figma-search-shell"
              onClick={activate}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') activate();
              }}
              role="button"
              tabIndex={0}
            >
              {!active && !query ? (
                <span>Search a Movie / Show</span>
              ) : (
                <>
                  <span className="search-glyph" aria-hidden="true">⌕</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onBlur={() => !query && setActive(false)}
                    placeholder="Search a Movie / Show"
                    aria-label="Search a Movie or Show"
                  />
                </>
              )}
            </div>
            <button className="landing-search-submit" type="submit" disabled={!query.trim()}>
              Search ↗
            </button>
          </form>
        </div>
      </div>

      <div className="landing-trending-row" aria-label="Trending searches">
        <span>Trending searches</span>
        {trendingSearches.map((term) => (
          <button key={term} type="button" onClick={() => handleTrending(term)}>
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}

function QuoteSearchSection() {
  const [media, setMedia] = useState('');
  const [quote, setQuote] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(
        `/api/quotes/similar?media=${encodeURIComponent(media)}&quote=${encodeURIComponent(quote)}&limit=5`,
      );

      if (!response.ok) {
        const text = await response.text();
        let detail = response.statusText || 'Request failed';
        try {
          const body = JSON.parse(text);
          detail = body.detail || detail;
        } catch {
          if (text.trim()) detail = text;
        }
        throw new Error(detail);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      setResults(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-panel quote-panel" id="quote">
      <div className="section-heading">
        <p className="eyebrow">Quote Search</p>
        <h2>What are you looking for?</h2>
      </div>

      <form className="unified-search-card" onSubmit={handleSearch}>
        <label>
          <span>Movie / Show</span>
          <input
            type="text"
            value={media}
            onChange={(event) => setMedia(event.target.value)}
            placeholder="Search title"
          />
        </label>
        <label>
          <span>Quote</span>
          <input
            type="text"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            placeholder="Search dialogue"
          />
        </label>
        <button className="button button-primary" type="submit" disabled={loading || !quote.trim()}>
          {loading ? 'Searching...' : 'Search Quote'}
        </button>
      </form>

      {error && <p className="error-copy">{error}</p>}
      {loading && <div className="skeleton-list" aria-label="Loading quote results"><span /><span /><span /></div>}
      {results && results.length === 0 && <EmptyState />}
      {results && results.length > 0 && (
        <div className="results-grid quote-results">
          {results.map((match, index) => (
            <article className="result-card" key={`${match.text || 'quote'}-${index}`}>
              <p>{match.text || 'Subtitle line unavailable'}</p>
              <small>
                {match.episode ? `Episode ${match.episode}` : media || 'Movie / show quote'}
                {match.timestamp_start ? ` · ${match.timestamp_start}` : ''}
                {match.timestamp_end ? ` - ${match.timestamp_end}` : ''}
              </small>
              {typeof match.score === 'number' && <span>Similarity {match.score.toFixed(3)}</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedMovieSection({ onFindSubtitles }) {
  const [posterSrc, setPosterSrc] = useState(featuredMovie.poster);
  const [imageLoaded, setImageLoaded] = useState(false);

  const findSubtitles = () => {
    onFindSubtitles(featuredMovie.title);
    window.requestAnimationFrame(() => {
      document.getElementById('find-subtitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section className="featured-section" aria-labelledby="featured-title">
      <p className="eyebrow">Featured Movie of the Day</p>
      <article className={`featured-card ${imageLoaded ? 'has-image' : 'is-loading-image'}`}>
        <img
          src={posterSrc}
          alt={`${featuredMovie.title} cinematic backdrop`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (posterSrc !== featuredMovie.fallbackPoster) {
              setImageLoaded(false);
              setPosterSrc(featuredMovie.fallbackPoster);
            } else {
              setImageLoaded(true);
            }
          }}
        />
        <div className="featured-overlay">
          <div className="featured-content">
            <h2 id="featured-title">{featuredMovie.title}</h2>
            <p className="movie-meta">{featuredMovie.year} · IMDb {featuredMovie.rating}</p>
            <div className="tag-row">
              {featuredMovie.genres.map((genre) => <span key={genre}>{genre}</span>)}
            </div>
            <p>{featuredMovie.description}</p>
          </div>
          <div className="featured-actions">
            <Link className="button button-light" to={`/media/${featuredMovie.id}`}>View Movie</Link>
            <button className="button button-gold" type="button" onClick={findSubtitles}>
              Find Subtitles
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

function SubtitleSearchSection({ searchSeed }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSubtitleSearch = useCallback(async (queryToSearch) => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`/api/subtitles?query=${encodeURIComponent(queryToSearch)}`);

      if (!response.ok) {
        const text = await response.text();
        let detail = response.statusText || 'Subtitle request failed';
        try {
          const body = JSON.parse(text);
          detail = body.detail || detail;
        } catch {
          if (text.trim()) detail = text;
        }
        throw new Error(detail);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      const parsedResults = data.sample ? [{ title: data.query || queryToSearch, text: data.sample, language: 'English' }] : [];
      setResults(parsedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchSeed) {
      setSearchQuery(searchSeed);
      runSubtitleSearch(searchSeed);
    }
  }, [runSubtitleSearch, searchSeed]);

  async function handleSubtitleSearch(event) {
    event.preventDefault();
    runSubtitleSearch(searchQuery);
  }

  return (
    <section className="section-panel subtitle-panel" id="find-subtitle">
      <div className="section-heading">
        <p className="eyebrow">Subtitle Locator</p>
        <h2>Find subtitles for a movie or show.</h2>
      </div>

      <form className="inline-search" onSubmit={handleSubtitleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Inception, Breaking Bad, The Bear..."
          aria-label="Movie or show title"
        />
        <button className="button button-primary" type="submit" disabled={loading || !searchQuery.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error-copy">{error}</p>}
      {loading && <div className="skeleton-list"><span /><span /></div>}
      {results && results.length === 0 && <EmptyState title="No subtitles found." />}
      {results && results.length > 0 && (
        <div className="subtitle-preview">
          <div className="subtitle-preview-header">
            <h3>Subtitle Preview</h3>
            <a
              href={`http://localhost:8000/api/media/subtitles.zip?query=${encodeURIComponent(searchQuery)}&languages=en`}
              download
              className="button button-secondary"
            >
              Download ZIP
            </a>
          </div>
          {results.slice(0, 5).map((subtitle, index) => (
            <article className="result-card" key={`${subtitle.title}-${index}`}>
              <strong>{subtitle.title || subtitle.name || `Subtitle Track ${index + 1}`}</strong>
              {subtitle.language && <small>{subtitle.language}</small>}
              {subtitle.text && <pre>{subtitle.text.slice(0, 500)}</pre>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Home() {
  const [subtitleSeed, setSubtitleSeed] = useState('');

  return (
    <div className="home-landing">
      <LandingHeader />
      <FigmaHero />
      <FeaturedMovieSection onFindSubtitles={setSubtitleSeed} />
      <QuoteSearchSection />
      <SubtitleSearchSection searchSeed={subtitleSeed} />
      <section className="landing-connect" id="connect">
        <h2>Connect with us</h2>
        <p>Learn how SubtitleSearcher turns scattered captions into fast, searchable movie moments.</p>
        <Link className="landing-cta wide" to="/contact">Learn More ↗</Link>
      </section>
    </div>
  );
}

export default Home;
