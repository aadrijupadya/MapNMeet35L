import React, { useRef, useState } from 'react';
import './CreateActivity.css';
import { Link } from 'react-router-dom';
import { getAddressFromCoords } from './utils/geocoding';

export default function CreateActivity({ userId, coordinates, onClose }) {
  const successRef = useRef(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const getDefaultDateTime = () => {
    const now = new Date();
    // adjust for timezone offset and zero out seconds+ms
    const local = new Date(now.getTime() - now.getTimezoneOffset()*60000);
    local.setSeconds(0, 0);
    return local.toISOString().slice(0,16);
  };

  const [form, setForm] = useState({  
    title: '',
    description: '',
    location: '',
    time: getDefaultDateTime(),
    endTime: getDefaultDateTime(),
    participantCount: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordinates) {
      setStatus('Missing location coordinates.');
      return;
    }

    try {
      const locationName = await getAddressFromCoords(coordinates.lat, coordinates.lng);

      const res = await fetch('http://localhost:8000/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          location: JSON.stringify(coordinates),
          locationName: locationName || '',
          participantCount: parseInt(form.participantCount),
          time: new Date(form.time),
          endTime: new Date(form.endTime),
          createdBy: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create activity');

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
      });
      alert("Successfully submitted activity!")
      onClose();
    } catch (err) {
      console.error('Error creating activity:', err);
      setStatus(err.message || 'Error submitting form');
    }
  };

  return (
    <div className="create-container">
      <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
      <div className="create-form-wrapper">
        <h2>Create Activity</h2>
        <h2>Select the location on the map</h2>
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
            placeholder="Description"
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
          {isSuccess ? (
            <Link to="/activities" className="return-button" ref={successRef}>
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
    </div>
  );
}
