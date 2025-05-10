import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'; // ✅ make sure the path is correct, e.g. './pages/Home' if it's in a subfolder
import About from './About'
import CreateActivity from './CreateActivity';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api')
      .then(response => response.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home message={message} />} />
        <Route path="/about" element={<About />} />
        <Route path="/create-activity" element={<CreateActivity />} />
      </Routes>
    </Router>
  );
}

export default App;
