import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import logo from './assets/logo.png';

const NavBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div className="navbar-top">
        <img
          src={logo}
          alt="MapNMeet Logo"
          className="logo-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-links">
          <Link to="/" onClick={() => setSidebarOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setSidebarOpen(false)}>About</Link>
          <Link to="/create-activity" onClick={() => setSidebarOpen(false)}>Create Activity</Link>
          <Link to="/activities" onClick={() => setSidebarOpen(false)}>Activities</Link>
        </nav>
      </div>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </>
  );
};

export default NavBar;
