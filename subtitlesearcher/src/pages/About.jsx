import React from 'react';

function About() {
  const developers = [
    { id: 1, name: "Dasheng Yao", role: "Fullstack Developer" },
    { id: 2, name: "Tri Ta", role: "Fullstack Developer" },
    { id: 3, name: "Scott McCloskey", role: "Fullstack Developer" },
    { id: 4, name: "Nora Bukhamseen", role: "Fullstack Developer" }
  ];

  return (
    <div className="page-container">
      <h1>About Us</h1>
      <p>
        Welcome to SubtitleSearcher! This project was built to help users quickly 
        find specific lines, quotes, and subtitles across various TV shows and movies 
        using similarity search techniques.
      </p>

      <div className="team-section" style={{ marginTop: '2rem' }}>
        <h2>Meet the Developers</h2>
        <ul className="developer-list" style={{ listStyleType: 'none', padding: 0, marginTop: '1rem' }}>
          {developers.map((dev) => (
            <li 
              key={dev.id} 
              className="developer-item"
              style={{ 
                background: 'white', 
                padding: '1rem', 
                marginBottom: '0.5rem', 
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <strong>{dev.name}</strong> <br/>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{dev.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sources-section" style={{ marginTop: '2rem' }}>
        <h2>Credits & Sources</h2>
        <p>Subtitle data provided by [Placeholder Source API / Database].</p>
      </div>
    </div>
  );
}

export default About;