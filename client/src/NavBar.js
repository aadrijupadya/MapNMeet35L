import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import logo from './assets/logo.png';

const NavBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="MapNMeet Logo" className="sidebar-logo" />
          <span>MapNMeet</span>
        </div>

        <nav className="sidebar-section">
          <span className="section-title">MENU</span>
          <Link to="/" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setSidebarOpen(false)}>About</Link>
          <Link to="/activities" onClick={() => setSidebarOpen(false)}>Activities</Link>
          <Link to="/profile" onClick={() => setSidebarOpen(false)}>Profile</Link>
        </nav>
      </div>

      <div className="navbar-top">
        <img
          src={logo}
          alt="MapNMeet Logo"
          className="logo-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default NavBar;
