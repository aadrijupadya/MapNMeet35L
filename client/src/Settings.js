import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.classList.contains('light-theme')
  );

  useEffect(() => {
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
          backgroundColor: 'var(--accent-color)',
          color: 'var(--background-color)',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Switch to {isLight ? 'Dark' : 'Light'} Mode
      </button>
    </div>
  );
}
