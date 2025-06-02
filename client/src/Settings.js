import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings() {
  const [isLight, setIsLight] = useState(() => {
    // Check localStorage first, then fallback to checking class
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'light';
    }
    return document.documentElement.classList.contains('light-theme');
  });

  useEffect(() => {
    // Update localStorage and class when theme changes
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (isLight) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight(prev => !prev);
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <button
        onClick={toggleTheme}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-bg)',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Switch to {isLight ? 'Dark' : 'Light'} Mode
      </button>
    </div>
  );
}
