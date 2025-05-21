import React, { useEffect, useRef, useState } from 'react';

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    // Prevent loading multiple times
    if (window.google && window.google.maps) return resolve();

    // Check if a script is already in the document
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      return resolve(); // Already loading or loaded
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        reject(new Error('Google Maps API failed to load correctly.'));
      }
    };
    script.onerror = reject;

    document.head.appendChild(script);
  });
};

export default function Map() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const infoWindowRef = useRef(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key is missing. Check your .env file.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 34.0689, lng: -118.4452 }, // UCLA
          zoom: 15,
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();

        return fetch('http://localhost:8000/api/activities');
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setActivities(data);
        addMarkers(data);
      })
      .catch((err) => {
        console.error('Error initializing map or fetching activities:', err);
      });
  }, []);

  const addMarkers = (activities) => {
    activities.forEach((activity) => {
      if (!activity.location) return;

      let coords;
      try {
        coords = typeof activity.location === 'string'
          ? JSON.parse(activity.location)
          : activity.location;
      } catch (e) {
        console.warn('Invalid location format:', activity.location);
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: mapInstance.current,
        title: activity.title,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="max-width: 200px;">
            <h3>${activity.title}</h3>
            <p>${activity.description}</p>
            <p><strong>Time:</strong> ${new Date(activity.time).toLocaleString()}</p>
            <p><strong>Contact:</strong> ${activity.contactInfo}</p>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance.current, marker);
      });
    });
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
