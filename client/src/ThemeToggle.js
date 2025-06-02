import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

export default function ThemeToggle() {
    const [isLightMode, setIsLightMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'light';
        }
        // Default to dark if no theme is saved, unless the system prefers light
        return window.matchMedia('(prefers-color-scheme: light)').matches;
    });

    useEffect(() => {
        if (isLightMode) {
            document.documentElement.classList.add('light-theme');
            document.documentElement.classList.remove('dark-theme'); // Ensure dark-theme is removed
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.add('dark-theme'); // Ensure dark-theme is added
            localStorage.setItem('theme', 'dark');
        }
    }, [isLightMode]); // Re-run effect when isLightMode changes

    const toggleTheme = () => {
        setIsLightMode(prevMode => !prevMode);
    };

    // Read system preference and localStorage on mount to set initial state correctly
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsLightMode(savedTheme === 'light');
        } else {
            // If no saved theme, check system preference
            setIsLightMode(window.matchMedia('(prefers-color-scheme: light)').matches);
        }

        // Listen for system theme changes (optional, but good practice)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handleChange = (e) => {
             // Only update if no theme is explicitly saved in localStorage
            if (!localStorage.getItem('theme')) {
               setIsLightMode(e.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);

    }, []); // Run only on mount


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