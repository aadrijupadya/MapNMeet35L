import React, { useState, useEffect } from 'react';

function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
    fetch('http://localhost:5000/api')
        .then(response => response.json())
        .then(data => setMessage(data.message));
    }, []);

    return (
        
            {message}
        
    );
}

export default App;