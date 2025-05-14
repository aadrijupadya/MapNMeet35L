import React, { useEffect, useRef, useState } from 'react';

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google) return resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function Map() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [activities, setActivities] = useState([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 34.0689, lng: -118.4452 }, // UCLA default
          zoom: 15,
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();

        fetch('http://localhost:8000/api/activities', {
            method: 'GET',
        })
          .then((res) => res.json())
          .then((data) => {
            console.log(data)
            setActivities(data);
            addMarkers(data);
          });
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
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
      } catch {
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
