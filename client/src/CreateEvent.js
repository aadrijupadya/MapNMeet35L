import React, { useState } from 'react';
import './CreateEvent.css';

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    time: '',
    participantCount: '',
    contactInfo: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          participantCount: parseInt(form.participantCount),
          time: new Date(form.time),
        }),
      });

      if (res.ok) {
        setStatus('Event created!');
        setForm({
          title: '',
          description: '',
          location: '',
          time: '',
          participantCount: '',
          contactInfo: '',
        });
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
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit} className="create-form">
        {['title', 'description', 'location', 'contactInfo'].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={handleChange}
            required
          />
        ))}

        <input
          type="datetime-local"
          name="time"
          value={form.time}
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

        <button type="submit">Submit</button>
      </form>
      {status && <p className="status">{status}</p>}
    </div>
  );
}
