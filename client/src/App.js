import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'; // ✅ make sure the path is correct, e.g. './pages/Home' if it's in a subfolder
import About from './About'
import CreateActivity from './CreateActivity';
import Map from './Map';
import Login from './Login';
import Signup from './Signup';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api')
      .then(response => response.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home message={message} />} />
        <Route path="/about" element={<About />} />
        <Route path="/create-activity" element={<CreateActivity />} />
        <Route path="/map" element={<Map />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
