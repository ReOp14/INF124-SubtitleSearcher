import React from 'react';

const developers = [
  { id: 1, name: 'Dasheng Yao', role: 'Fullstack Developer', tags: ['Search Systems', 'Frontend', 'Architecture'] },
  { id: 2, name: 'Tri Ta', role: 'Fullstack Developer', tags: ['Interface Polish', 'React', 'UX'] },
  { id: 3, name: 'Scott McCloskey', role: 'Fullstack Developer', tags: ['Data Flow', 'Backend', 'Testing'] },
  { id: 4, name: 'Nora Bukhamseen', role: 'Fullstack Developer', tags: ['Product Details', 'Research', 'QA'] },
];

const stack = [
  { title: 'Frontend', body: 'React routes, responsive components, and a shared cinematic design system.' },
  { title: 'Backend', body: 'Node and Express endpoints that keep subtitle search and quote retrieval stable.' },
  { title: 'Search Engine', body: 'Similarity search patterns tuned for dialogue and timestamp discovery.' },
  { title: 'Subtitle Sources', body: 'Subtitle datasets and OpenSubtitles-style integrations for track previews.' },
];

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('');
}

function About() {
  return (
    <div className="cinema-page interior-page">
      <section className="page-hero">
        <p className="eyebrow">About SubtitleSearcher</p>
        <h1>Subtitle search built for the way people remember movies.</h1>
        <p>
          SubtitleSearcher helps viewers find dialogue, scene timing, and subtitle files when all they have is a
          title, a fragment of a quote, or a half-remembered moment.
        </p>
      </section>

      <section className="story-section">
        <div className="section-heading">
          <p className="eyebrow">Mission</p>
          <h2>Dialogue is messy. Search should not be.</h2>
        </div>
        <p>
          Subtitle data is fragmented across formats, languages, episodes, timestamps, and inconsistent file names.
          This project turns that complexity into a focused discovery workflow: search broadly, inspect quickly,
          and move from memory to subtitle evidence with less friction.
        </p>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Team</p>
          <h2>Meet the developers.</h2>
        </div>
        <div className="profile-grid">
          {developers.map((developer) => (
            <article className="profile-card" key={developer.id}>
              <span className="developer-avatar" aria-hidden="true">{initials(developer.name)}</span>
              <h3>{developer.name}</h3>
              <p>{developer.role}</p>
              <div className="tag-row">
                {developer.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Tech Stack</p>
          <h2>The platform pieces.</h2>
        </div>
        <div className="info-grid">
          {stack.map((item) => (
            <article className="info-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;
