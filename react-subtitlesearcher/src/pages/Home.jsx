import React from 'react';
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
  return (
    <section className="quote-section" id="quote">
      <p className="section-kicker">Search a Line</p>
      <blockquote>"May the Force be with you" (Star Wars).</blockquote>
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
  return (
    <section className="search-subtitle-section" id="find-subtitle">
      <div className="search-subtitle-topline">
        <h2>Find Subtitle for a Show</h2>
        <a className="home-button home-button-pale" href="#connect">Discover More</a>
      </div>
      <div className="search-subtitle-copy">
        <h3>Search a Movie / Show</h3>
        <p className="subtitle-label">Subtitle</p>
        <p>With our intuitive setup, you're up and running in minutes.</p>
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
