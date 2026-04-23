import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('show'); // show, movie, line
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;

    // Route based on search type
    if (searchType === 'line') {
      navigate(`/results/lines?query=${searchTerm}`);
    } else {
      navigate(`/results/shows?query=${searchTerm}&type=${searchType}`);
    }
  };

  return (
    <div className="page-container">
      <h1>Find Subtitles Instantly</h1>
      <form onSubmit={handleSearch} className="search-form">
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value)}
          aria-label="Select search type"
        >
          <option value="show">TV Show</option>
          <option value="movie">Movie</option>
          <option value="line">Specific Line</option>
        </select>
        
        <input 
          type="text" 
          placeholder="Enter show, movie, or quote..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}

export default Home;