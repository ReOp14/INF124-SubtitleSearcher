import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ShowResults from './pages/ShowResults';
import MediaDetails from './pages/MediaDetails';
import LineSearchResults from './pages/LineSearchResults';
import About from './pages/About';
import Contact from './pages/Contact';
import Bot from './pages/Bot';

import './styles.css'; // Global styles

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      {!isHome && <Header />}
      <main className={isHome ? 'main-content home-main' : 'main-content'}>
        <Routes>
          {/* i. Home */}
          <Route path="/" element={<Home />} />

          {/* ii. Results Page for show / movies */}
          <Route path="/results/shows" element={<ShowResults />} />
          
          {/* iii. Results Page for a specific show / movie */}
          <Route path="/media/:mediaId" element={<MediaDetails />} />
          
          {/* iv. Results Page for subtitle line search */}
          <Route path="/results/lines" element={<LineSearchResults />} />
          
          {/* v, vi, vii. Static Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/bot" element={<Bot />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
