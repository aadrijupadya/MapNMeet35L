import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'; // ✅ make sure the path is correct, e.g. './pages/Home' if it's in a subfolder
import About from './About'
import CreateActivity from './CreateActivity';
import Map from './Map';
import Login from './Login';
import Signup from './Signup';
import { GoogleOAuthProvider } from "@react-oauth/google";

import Activities from './Activities';

function App() {
  const [user, setUser] = useState()

  useEffect(() => {
    const checkSession = async () => {
      try {

        const response = await fetch('http://localhost:8000/api/auth/validate', {
          method: 'GET',
          credentials: 'include', // Ensures cookies are sent with the request
          headers: {
            'Content-Type': 'application/json', // Ensure proper headers are sent
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.warn('Session validation failed with status:', response.status);
          setUser(null); // No valid session
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
      <Routes>
        <Route path="/" element={<GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <Home user={user} updateUser={updateUser}/></GoogleOAuthProvider>} />
        <Route path="/about" element={<About />} />
        <Route path="/create-activity" element={<CreateActivity />} />
        <Route path="/map" element={<Map />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activities" element={<Activities />} />
      </Routes>
    </Router>
  );
}

export default App;
