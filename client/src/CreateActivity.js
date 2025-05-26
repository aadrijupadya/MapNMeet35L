import React, { useEffect, useRef, useState } from 'react';
import './CreateActivity.css';
import { Link } from 'react-router-dom';

export default function CreateActivity(props) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const successRef = useRef(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    time: '',
    endTime: '',
    participantCount: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  function loadGoogleMapsScript(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google) return resolve(); // already loaded

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

    useEffect(() => {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

      loadGoogleMapsScript(apiKey).then(() => {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 34.0689, lng: -118.4452 },
          zoom: 15,
        });

        map.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setCoordinates({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setPosition(e.latLng);
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: e.latLng,
              map,
            });
          }
        });
      }).catch(err => {
        console.error("Failed to load Google Maps script", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordinates) {
      setStatus('Please select a location on the map');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          location: JSON.stringify(coordinates),
          participantCount: parseInt(form.participantCount),
          time: new Date(form.time),
          endTime: new Date(form.endTime),
          createdBy: props.userId
          // creator: props.name,
          // contact: props.contact,
          // creatorEmail: props.email
        }),
      });

      if (res.ok) {
        setStatus('Event created successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        setForm({
          title: '',
          description: '',
          location: '',
          time: '',
          endTime: '',
          participantCount: '',
          contactInfo: '',
        });
        setCoordinates(null);
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
      } else {
        setStatus('Failed to create event');
      }
    } catch (err) {
      setStatus('Error submitting form');
      console.error(err);
    }
  };

  return (
    <div className="create-container">
      <h2>Create New Activity</h2>
      <form onSubmit={handleSubmit} className="create-form">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description (Event info, location name, etc.)"
          value={form.description}
          onChange={handleChange}
          required
          rows="4"
        />
        <input
          type="datetime-local"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />

        <input
          type="datetime-local"
          name="endTime"
          value={form.endTime}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="participantCount"
          placeholder="Participant Count"
          value={form.participantCount}
          onChange={handleChange}
          required
          min="1"
        />

        <div className="map-instructions">Click on the map to set location:</div>
        <div ref={mapRef} className="map-box" />

        {isSuccess ? (
          <Link 
            to="/activities" 
            className="return-button"
            ref={successRef}
          >
            Return to Activities
          </Link>
        ) : (
          <button type="submit" className="submit-button">
            Submit
          </button>
        )}
      </form>

      {status && <p className="status">{status}</p>}
    </div>
  );
}