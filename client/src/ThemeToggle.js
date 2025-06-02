import React from 'react';
import './ThemeToggle.css';

export default function ThemeToggle({ isLightMode, setIsLightMode }) {
    const toggleTheme = () => {
        setIsLightMode(prevMode => !prevMode);
        localStorage.setItem('theme', !isLightMode ? 'light' : 'dark');
    };

    return (
        <div 
            className={`theme-toggle-switch ${isLightMode ? 'light' : 'dark'}`}
            onClick={toggleTheme}
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            <span className="switch-label">DARK</span>
            <div className="switch">
                <div className="switch-thumb"></div>
            </div>
            <span className="switch-label">LIGHT</span>
        </div>
    );
} 