import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import About from './About';
import CreateActivity from './CreateActivity';
import Map from './Map';
import Activities from './Activities';
import NavBar from './NavBar';
import { GoogleOAuthProvider } from "@react-oauth/google";
import './theme.css';
import Profile from './Profile';
import UserProfile from './UserProfile';
import ThemeToggle from './ThemeToggle';

function App() {
  const [user, setUser] = useState();
  const [isLightMode, setIsLightMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'light';
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  // Initialize theme from localStorage
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
    }
  }, [isLightMode]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/validate?refresh=true', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error validating session:', err);
        setUser(null);
      }
    };

    checkSession();
  }, []);

  const updateUser = (newUser) => setUser(newUser);

  return (
    <Router>
      <Layout user={user} updateUser={updateUser} isLightMode={isLightMode} setIsLightMode={setIsLightMode} />
    </Router>
  );
}

function Layout({ user, updateUser, isLightMode, setIsLightMode }) {
  const location = useLocation();

  // Show NavBar if not on the home page, or if on the home page and user is logged in
  const showNavBar = location.pathname !== '/' || (location.pathname === '/' && user);

  return (
    <>
      {showNavBar && <NavBar />}
      <ThemeToggle isLightMode={isLightMode} setIsLightMode={setIsLightMode} />
      <Routes>
        {user && (
          <>
            <Route
              path="/"
              element={
                <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                  <Home user={user} updateUser={updateUser} />
                </GoogleOAuthProvider>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/create-activity" element={<CreateActivity userId={user._id} />} />
            <Route path="/map" element={<Map />} />
            <Route path="/activities" element={<Activities user={user} userId={user._id} isLightMode={isLightMode} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
          </>
        )}
        {!user && (
          <>
            <Route
              path="/"
              element={
                <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                  <Home user={user} updateUser={updateUser} />
                </GoogleOAuthProvider>
              }
            />
            <Route path="/profile/:userId" element={<UserProfile />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default App;
