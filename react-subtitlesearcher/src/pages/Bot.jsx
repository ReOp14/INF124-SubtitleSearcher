import React from 'react';

const prompts = [
  'Find the scene where Walter White says...',
  "Show me every use of 'Winter is Coming'",
  'Find similar movie quotes',
  'Search subtitles for a courtroom monologue',
];

const plannedFeatures = [
  'Quote search assistance',
  'Scene discovery',
  'Subtitle recommendations',
  'Show recommendations',
];

function Bot() {
  return (
    <div className="cinema-page interior-page">
      <section className="bot-hero-card">
        <div>
          <p className="coming-soon-badge">Coming Soon</p>
          <p className="eyebrow">Subtitle AI Assistant</p>
          <h1>Ask the subtitle bot.</h1>
          <p>
            A future assistant for exploring quotes, scenes, recommendations, and subtitle search ideas from one
            focused command surface.
          </p>
          <div className="bot-capabilities">
            <span>Find quotes</span>
            <span>Find scenes</span>
            <span>Recommend shows</span>
            <span>Search subtitles</span>
          </div>
        </div>
        <div className="roadmap-card">
          <p className="eyebrow">Subtitle AI Assistant</p>
          <h2>Status: Coming Soon</h2>
          <div className="roadmap-list" aria-label="Planned features">
            {plannedFeatures.map((feature) => (
              <div className="roadmap-row" key={feature}>
                <span aria-hidden="true">+</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
          <p className="roadmap-release">Expected Availability: Future Release</p>
          <button className="button button-secondary" type="button" disabled>
            Notify Me When Available
          </button>
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Example Prompts</p>
          <h2>Future prompt examples.</h2>
        </div>
        <div className="prompt-grid">
          {prompts.map((prompt) => (
            <article className="prompt-card" key={prompt}>
              {prompt}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Bot;
