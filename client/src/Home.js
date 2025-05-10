import React, { useState } from 'react';
import './Home.css';
import logo from './assets/logo.png';
import uclaBanner from './assets/Banner.png'; // your stitched UCLA image
import { useNavigate } from 'react-router-dom';

function Home() {
  const [showAbout, setShowAbout] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Top Navigation Bar (Logo Only) */}
      <header className="header">
        <div className="logo-wrapper">
          <img src={logo} alt="MapNMeet Logo" className="logo-large" />
        </div>
      </header>

      {/* Scrolling Image Banner */}
      <div className="banner-container">
        <div className="scrolling-banner">
          <img src={uclaBanner} alt="UCLA Scrolling Banner 1" />
          <img src={uclaBanner} alt="UCLA Scrolling Banner 2" />
        </div>
        <div className="banner-overlay">
          <h1>MapNMeet provides a centralized and simplified way for students to connect and engage with others around campus.</h1>
        </div>

        {/* Buttons Below the Mission Statement */}
        <div className="buttons">
          <div>
            <button onClick={() => navigate('/about')}>About</button>
            <button onClick={() => navigate('/create-activity')}>Post an Activity!</button>
            <button onClick={() => navigate('/map')}>Map</button>
          </div>
          <div>
            <button onClick={() => navigate('/signup')}>Sign Up</button>
            <button onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-backdrop" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowAbout(false)}>✕</button>
            <h2>About MapNMeet</h2>
            <p>
              HEHEHE silly project
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MapNMeet | Designed by Aadrij Upadaya, Aaditya Raj, Antonio Quintero, Akhilesh Basetty, and Daniel Tritasavit</p>
        <p>Contact: aadriju01@ucla.edu</p>
      </footer>
    </div>
  );
}

export default Home;
