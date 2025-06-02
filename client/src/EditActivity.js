import React, { useState, useRef, useEffect } from 'react';
import './CreateActivity.css';
import { getAddressFromCoords } from './utils/geocoding';

export default function EditActivity({ activity, userId, onClose, onUpdate, map, markerRef }) {
  const [status, setStatus] = useState('');
  const [hasLocationChanged, setHasLocationChanged] = useState(false);
  const [originalLocation, setOriginalLocation] = useState(activity.location);
  const [originalLocationName, setOriginalLocationName] = useState(activity.locationName);

  // Helper function to convert date to local datetime-local input format
  const toLocalDateTimeString = (date) => {
    const d = new Date(date);
    // Adjust for timezone offset
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: activity.title,
    description: activity.description,
    location: activity.location,
    locationName: activity.locationName,
    time: toLocalDateTimeString(activity.time),
    endTime: toLocalDateTimeString(activity.endTime),
    participantCount: activity.participantCount,
  });

  // Initialize marker when component mounts or when activity changes
  useEffect(() => {
    if (map && activity.location) {
      try {
        const coords = JSON.parse(activity.location);
        
        // Remove existing marker if it exists
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Create new marker
        markerRef.current = new window.google.maps.Marker({
          position: coords,
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FFB400',
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 2,
          }
        });
      } catch (error) {
        console.error('Error parsing location:', error);
      }
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, activity.location]);

  // Handle map clicks for location editing
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', async (e) => {
      const pos = e.latLng;
      const coords = { lat: pos.lat(), lng: pos.lng() };

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(pos);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: pos,
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FFB400',
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 2,
          }
        });
      }

      // Get address for the new location
      try {
        const locationName = await getAddressFromCoords(coords.lat, coords.lng);
        const newLocation = JSON.stringify(coords);
        
        // Check if location has changed
        if (newLocation !== originalLocation) {
          setHasLocationChanged(true);
        }

        setForm(prev => ({
          ...prev,
          location: newLocation,
          locationName: locationName || ''
        }));
      } catch (error) {
        console.error('Error getting address:', error);
        setStatus('Error getting address for location');
      }
    });

    // Cleanup function
    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, originalLocation]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancelLocation = () => {
    if (markerRef.current && originalLocation) {
      try {
        const coords = JSON.parse(originalLocation);
        markerRef.current.setPosition(coords);
        setForm(prev => ({
          ...prev,
          location: originalLocation,
          locationName: originalLocationName
        }));
        setHasLocationChanged(false);
      } catch (error) {
        console.error('Error resetting location:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    try {
      // Convert local datetime strings back to UTC for the server
      const updateData = {
        ...form,
        time: new Date(form.time).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        userId: userId
      };

      const res = await fetch(`http://localhost:8000/api/activities/${activity._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update activity');
      }

      setStatus('Event updated successfully!');
      
      // Call the onUpdate callback with the updated activity
      onUpdate(data);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating activity:', err);
      setStatus(err.message || 'Error updating activity. Please try again.');
    }
  };

  return (
    <div className="create-container">
      <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
      <div className="create-form-wrapper">
        <h2>Edit Activity</h2>
        <div className="location-instructions">
          <p>Click anywhere on the map to change the location</p>
        </div>
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
          <div className="form-actions">
            {hasLocationChanged && (
              <button 
                type="button" 
                className="cancel-location-btn"
                onClick={handleCancelLocation}
              >
                Cancel Location Change
              </button>
            )}
            <button type="submit" className="submit-button">
              Save Changes
            </button>
          </div>
        </form>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
} 