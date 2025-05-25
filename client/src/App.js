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

function App() {
  const [user, setUser] = useState();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/validate', {
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
      <Layout user={user} updateUser={updateUser} />
    </Router>
  );
}

function Layout({ user, updateUser }) {
  const location = useLocation();

  // Only show NavBar if not on the home page
  const showNavBar = location.pathname !== '/';

  return (
    <>
      {showNavBar && <NavBar />}
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
            <Route path="/activities" element={<Activities userId={user._id}/>} />
            <Route path="/profile" element={<Profile user={user} />} />
          </>
        )}
        {!user && (
          <Route
            path="/"
            element={
              <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <Home user={user} updateUser={updateUser} />
              </GoogleOAuthProvider>
            }
          />
        )}
      </Routes>
    </>
  );
}

export default App;
