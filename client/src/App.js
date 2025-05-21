import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import About from './About';
import CreateActivity from './CreateActivity';
import Map from './Map';
import Activities from './Activities';
import NavBar from './NavBar'; // ✅ import the new component
import { GoogleOAuthProvider } from "@react-oauth/google";
import './theme.css';     // global variables and styles

function App() {
  const [user, setUser] = useState();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/validate', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.warn('Session validation failed with status:', response.status);
          setUser(null);
        }
      } catch (err) {
        console.error('Error validating session:', err);
        setUser(null);
      }
    };

    checkSession();
  }, []);

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
              <Home user={user} updateUser={updateUser} />
            </GoogleOAuthProvider>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/create-activity" element={<CreateActivity />} />
        <Route path="/map" element={<Map />} />
        <Route path="/activities" element={<Activities />} />
      </Routes>
    </Router>
  );
}

export default App;
