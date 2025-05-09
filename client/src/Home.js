import React, { useState } from 'react';
import './Home.css';
import logo from './assets/logo.png';
import uclaBanner from './assets/ucla-banner.jpg'; // your stitched UCLA image

function Home() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="home-container">
      {/* Top Navigation Bar */}
      <header className="header">
        <img src={logo} alt="MapNMeet Logo" className="logo" />
        <nav className="nav">
          <button onClick={() => setShowAbout(true)}>About</button>
          <button onClick={() => alert("Navigate to Sign Up")}>Sign Up</button>
          <button onClick={() => alert("Navigate to Login")}>Login</button>
        </nav>
      </header>

      {/* Scrolling Image Banner */}
      <div className="banner-container">
        <div className="scrolling-banner">
          <img src={uclaBanner} alt="UCLA Scrolling Banner" />
        </div>
        <div className="banner-overlay">
          <h1>Connecting Bruins on Campus, One Map at a Time.</h1>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-backdrop" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowAbout(false)}>✕</button>
            <h2>About MapNMeet</h2>
            <p>
              MapNMeet is a campus-based app designed to help UCLA students connect, find meetups, and explore campus events. The app integrates real-time mapping, project coordination tools, and student networking features based on our project proposal.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 MapNMeet | Designed by [Your Name]</p>
        <p>Contact: mapnmeet@ucla.edu</p>
      </footer>
    </div>
  );
}

export default Home;






/*import React from 'react'

const Home = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
      <p className="text-lg text-gray-700">
        This is a simple React page rendered using React Router.
      </p>
    </div>
  )
}

export default Home */
