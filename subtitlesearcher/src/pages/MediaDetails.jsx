import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function MediaDetails() {
  const { mediaId } = useParams(); // Gets the ID from the URL
  const [localSearch, setLocalSearch] = useState('');
  const [isVectorSearching, setIsVectorSearching] = useState(false);

  // Placeholder data
  const subtitles = [
    { id: 1, time: '00:01:23', text: 'Hello there.' },
    { id: 2, time: '00:01:25', text: 'General Kenobi!' },
  ];

  const handleSimilaritySearch = () => {
    setIsVectorSearching(true);
    // TODO: Make API call to Node.js backend to query vector DB
    // If not found, backend should create new entry as per your outline
    setTimeout(() => {
      alert("Vector DB Search Complete! (Placeholder)");
      setIsVectorSearching(false);
    }, 1500);
  };

  // Local Ctrl+F style filter
  const filteredSubtitles = subtitles.filter(sub => 
    sub.text.toLowerCase().includes(localSearch.toLowerCase())
  );

  return (
    <div className="page-container">
      <h2>Media Details (ID: {mediaId})</h2>
      
      <div className="controls-section">
        {/* iii. 1. Local Search */}
        <input 
          type="text" 
          placeholder="Filter subtitles locally..." 
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />

        {/* iii. 2. Similarity Search */}
        <button 
          onClick={handleSimilaritySearch} 
          disabled={isVectorSearching}
          className="vector-btn"
        >
          {isVectorSearching ? 'Searching Vector DB...' : 'Run Similarity Search'}
        </button>
      </div>

      {/* iii. 3. List of subtitles with timestamps */}
      <div className="subtitle-list">
        <h3>Subtitles</h3>
        {filteredSubtitles.map(sub => (
          <div key={sub.id} className="subtitle-item">
            <span className="timestamp">[{sub.time}]</span>
            <p>{sub.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaDetails;