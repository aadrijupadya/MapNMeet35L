import React, { useEffect, useRef, useState } from 'react';
import './Activities.css';

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();

    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      return resolve();
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

export default function Activities() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const [events, setEvents] = useState([]);
  const [activeSort, setActiveSort] = useState('recent');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const eventRefs = useRef({});

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key is missing.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 34.0689, lng: -118.4452 }, // UCLA
          mapTypeControl: false,
          zoom: 15,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
        });

        return fetch('http://localhost:8000/api/activities');
      })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        addMarkers(data);
      })
      .catch((err) => {
        console.error('Map or API error:', err);
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
        console.warn('Invalid location:', activity.location);
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: mapInstance.current,
        title: activity.title,
      });

      marker.addListener('click', () => {
        const id = activity._id || activity.id;
        setSelectedEventId(id);

        setTimeout(() => {
          const ref = eventRefs.current[id];
          if (ref && ref.scrollIntoView) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortEvents = (type) => {
    const sorted = [...events];
    switch (type) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.time) - new Date(a.time));
        break;
      case 'closest':
        sorted.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
        break;
      case 'participants':
        sorted.sort((a, b) => (b.participants?.max || 0) - (a.participants?.max || 0));
        break;
    }

    setEvents(sorted);
    setActiveSort(type);

    const feedback = document.getElementById('sort-feedback');
    if (feedback) {
      feedback.textContent = `Sorted by ${type}`;
      setTimeout(() => (feedback.textContent = ''), 1000);
    }
  };

  return (
    <div className="activities-page">
      <a href="/create-activity" className="create-button">+</a>

      <div id="sort-feedback" style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#FFB400',
        padding: '5px 10px',
        borderRadius: '4px',
        display: 'none'
      }}></div>

      {/* Map Section */}
      <div className="map-container">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Events Section */}
      <div className="events-container">
        <div className="sort-options">
          <button onClick={() => sortEvents('recent')} className={activeSort === 'recent' ? 'active' : ''}>Most Recent</button>
          <button onClick={() => sortEvents('closest')} className={activeSort === 'closest' ? 'active' : ''}>Closest</button>
          <button onClick={() => sortEvents('participants')} className={activeSort === 'participants' ? 'active' : ''}>Most Participants</button>
        </div>

        {events.map((event) => {
          const id = event._id || event.id;
          return (
            <div
              key={id}
              ref={(el) => (eventRefs.current[id] = el)}
              className={`event-post ${selectedEventId === id ? 'highlighted' : ''}`}
            >
              <div className="event-author">{event.author}</div>
              <div className="event-title">{event.title}</div>
              <div className="event-location">
                📍 {event.locationName || 'Unknown'} {event.distance ? `(${event.distance} mi)` : ''}
              </div>
              <div className="event-participants">
                👥 {event.participants?.display || `${event.participants?.min || '?'}-${event.participants?.max || '?'}`}
              </div>
              <div className="event-time">⏰ {formatDate(event.time)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
