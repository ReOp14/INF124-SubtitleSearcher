import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const logos = ['Framebase', 'Logipsum', 'SceneKit', 'Captionly', 'LineLabs'];

const features = [
  {
    icon: 'S',
    title: 'Movie name / show name',
    description: 'Here to display movie / show clips',
  },
  {
    icon: 'Q',
    title: 'Movie name / show name',
    description: 'Here to display movie / show clips',
  },
  {
    icon: 'T',
    title: 'Movie name / show name',
    description: 'Here to display movie / show clips',
  },
  {
    icon: 'L',
    title: 'Movie name / show name',
    description: 'Here to display movie / show clips',
  },
];

const lineRows = ['01', '02', '03', '04'];

function Navbar() {
  return (
    <header className="home-navbar">
      <Link className="home-brand" to="/">Area</Link>
      <nav className="home-nav-links" aria-label="Homepage navigation">
        <a href="#quote">Search a Line</a>
        <a href="#find-subtitle">Find Subtitle</a>
        <Link to="/about">About</Link>
      </nav>
      <a className="home-button home-button-small" href="#connect">Learn More +</a>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <h1 id="home-title">Your Subtitle Crew.</h1>
      <div className="hero-media-wrap">
        <div className="hero-accent-block" aria-hidden="true" />
        <div className="hero-media-card">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
            alt="Rolling green hills under a blue sky"
          />
          <div className="hero-media-overlay">
            <span>Reports / Overview</span>
            <strong>78%</strong>
            <p>Efficiency Improvements</p>
          </div>
          <div className="hero-chart" aria-hidden="true">
            {Array.from({ length: 13 }).map((_, index) => (
              <span key={index} style={{ '--bar-height': `${30 + (index % 6) * 12}px` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  return (
    <section className="logo-strip" aria-label="API supported by">
      <p>API supported by:</p>
      <div className="logo-row">
        {logos.map((logo) => (
          <span key={logo}>{logo}</span>
        ))}
      </div>
    </section>
  );
}

function QuoteSection() {
  const [media, setMedia] = useState('Star Wars');
  const [quote, setQuote] = useState('May the Force be with you');
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
        `/api/quotes/similar?media=${encodeURIComponent(media)}&quote=${encodeURIComponent(
          quote,
        )}&limit=5`,
      );

      if (!response.ok) {
        const text = await response.text();
        let detail = response.statusText || 'Request failed';
        try {
          const body = JSON.parse(text);
          detail = body.detail || detail;
        } catch {
          if (text.trim()) {
            detail = text;
          }
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
    <section className="quote-section" id="quote">
      <p className="section-kicker">Search a Line</p>
      <form className="quote-search-form" onSubmit={handleSearch}>
        <label>
          Media
          <input
            type="text"
            value={media}
            onChange={(event) => setMedia(event.target.value)}
            placeholder="Star Wars"
          />
        </label>
        <label>
          Quote
          <input
            type="text"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            placeholder="May the Force be with you"
          />
        </label>
        <button type="submit" disabled={loading || !quote.trim()}>
          {loading ? 'Searching…' : 'Search Quote'}
        </button>
      </form>

      {error && <p className="muted-copy" style={{ color: 'var(--red)' }}>{error}</p>}

      {results && (
        <div className="quote-results">
          <h3>Search Results</h3>
          {results.length === 0 ? (
            <p>No matches found.</p>
          ) : (
            <ul>
              {results.map((match, index) => (
                <li key={index}>
                  <div>
                    <strong>{match.text || 'No text available'}</strong>
                  </div>
                  <div>
                    <small>
                      {match.episode ? `Episode ${match.episode}` : 'Movie / show quote'}
                      {match.timestamp_start ? ` • ${match.timestamp_start}` : ''}
                      {match.timestamp_end ? ` - ${match.timestamp_end}` : ''}
                    </small>
                  </div>
                  {typeof match.score === 'number' && (
                    <div>
                      <small>Similarity: {match.score.toFixed(3)}</small>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="muted-copy">Subtitle from subtitles.com</p>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="feature-grid" aria-label="Featured subtitle tools">
      {features.map((feature) => (
        <article className="feature-item" key={feature.icon}>
          <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </article>
      ))}
    </section>
  );
}

function CinematicImageSection() {
  return (
    <section className="cinematic-section" aria-label="Cinematic subtitle still">
      <img
        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80"
        alt="A warm cinematic view of film reels"
      />
    </section>
  );
}

function LineAppearanceSection() {
  return (
    <section className="line-appearance-section">
      <div className="line-appearance-copy">
        <h2>Movie / Show Line Appearance</h2>
        <p>The same quote appeared many times in the show / movie "name"</p>
        <div className="line-table" aria-label="Line appearance times">
          {lineRows.map((row) => (
            <div className="line-table-row" key={row}>
              <span>{row}</span>
              <strong>Time - line</strong>
            </div>
          ))}
        </div>
        <a className="home-button home-button-pale" href="#find-subtitle">Discover More</a>
      </div>
      <div className="line-appearance-image">
        <img
          src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"
          alt="Minimal cream display podiums"
        />
      </div>
    </section>
  );
}

function SearchSubtitleSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubtitleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`/api/subtitles?query=${encodeURIComponent(searchQuery)}`);

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
      
      const parsedResults = data.sample? [
      {
        title: data.query,
        text: data.sample,
        language: 'English'
      }
      ]: [];

      setResults(parsedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="search-subtitle-section" id="find-subtitle">
      <div className="search-subtitle-topline">
        <h2>Find Subtitle for a Show</h2>
        <a className="home-button home-button-pale" href="#connect">Discover More</a>
      </div>
      
      <div className="search-subtitle-copy">
        <h3>Search a Movie / Show</h3>
        <p className="subtitle-label">Subtitle Locator</p>
        <p>With our intuitive setup, you're up and running in minutes.</p>

        <form onSubmit={handleSubtitleSearch} style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="e.g., Inception, Breaking Bad..."
            style={{ padding: '10px', flex: '1', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            className="home-button home-button-small" 
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p style={{ color: 'var(--red)', marginTop: '10px' }}>{error}</p>}

        {results && (
          <div className="subtitle-results" style={{ marginTop: '20px', textAlign: 'left' }}>
        {results.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Preview First 5 Subtitle Files</h4>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              {results.slice(0, 5).map((subtitle, index) => (
                <li
                  key={index}
                  style={{
                    padding: '12px',
                    borderBottom: index !== 4 ? '1px solid #eee' : 'none',
                    background: '#fafafa'
                  }}
                >
                  <strong>
                    {subtitle.title ||
                      subtitle.name ||
                      `Subtitle File ${index + 1}`}
                  </strong>

                  {subtitle.language && (
                    <span style={{ marginLeft: '8px', color: '#666' }}>
                      ({subtitle.language})
                    </span>
                  )}

                  {subtitle.episode && (
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>
                      Episode: {subtitle.episode}
                    </div>
                  )}

                  {subtitle.text && (
                    <pre
                      style={{
                        marginTop: '10px',
                        background: '#f4f4f4',
                        padding: '10px',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.8rem',
                        maxHeight: '120px',
                        overflow: 'auto'
                      }}
                    >
                      {subtitle.text.slice(0, 500)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>

            <a
              href={`http://localhost:8000/api/media/subtitles.zip?query=${encodeURIComponent(searchQuery)}&languages=en`}
              download
              className="home-button home-button-pale"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              📥 Download ZIP After Preview
            </a>
          </div>
        )}

            <h4>Available Subtitles</h4>
            {results.length === 0 ? (
              <p>No subtitles found for this title.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {results.map((subtitle, index) => (
                  <li key={index} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                    <strong>{subtitle.title || subtitle.name || subtitle.text || 'Generic Subtitle Track'}</strong>
                    {subtitle.language && <span> ({subtitle.language})</span>}
                    {subtitle.episode && <small style={{ display: 'block', color: '#666' }}>Episode: {subtitle.episode}</small>}
                    {subtitle.download_url && (
                      <div style={{ marginTop: '4px' }}>
                        <a href={subtitle.download_url} download style={{ color: 'blue', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Download .SRT
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <img
        className="search-subtitle-image"
        src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1800&q=80"
        alt="Projected movie scene in a theater"
      />
    </section>
  );
}

function ContactSection() {
  return (
    <section className="contact-section" id="connect">
      <h2>Connect with us</h2>
      <p>Schedule a quick call to learn how Area can turn your regional data into a powerful advantage.</p>
      <a className="home-button home-button-wide" href="/contact">Learn More +</a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="home-footer">
      <nav aria-label="Footer navigation">
        <a href="#quote">Benefits</a>
        <a href="#find-subtitle">Specifications</a>
        <a href="#connect">How-to</a>
      </nav>
      <div className="home-footer-bottom">
        <div className="footer-mark" aria-hidden="true">A</div>
        <p>&copy; Area. 2025</p>
        <p>All Rights Reserved</p>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <HeroSection />
      <LogoStrip />
      <QuoteSection />
      <FeatureGrid />
      <CinematicImageSection />
      <LineAppearanceSection />
      <SearchSubtitleSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default Home;