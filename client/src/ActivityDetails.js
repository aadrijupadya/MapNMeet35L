import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAddressFromCoords } from './utils/geocoding';
import './ActivityDetails.css';

export default function ActivityDetails() {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/activities/${id}`);
        if (!response.ok) {
          throw new Error('Activity not found');
        }
        const data = await response.json();
        setActivity(data);

        // Get location name if coordinates exist
        if (data.location) {
          try {
            const { lat, lng } = JSON.parse(data.location);
            const addr = await getAddressFromCoords(lat, lng);
            if (addr) setLocationName(addr);
          } catch (err) {
            console.error('Error parsing location:', err);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date not available';
    }
  };

  if (loading) {
    return <div className="activity-details-page">Loading...</div>;
  }

  if (error) {
    return (
      <div className="activity-details-page">
        <div className="error-message">
          {error}
          <Link to="/" className="back-link">Go back to home</Link>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="activity-details-page">
        <div className="error-message">
          Activity not found
          <Link to="/" className="back-link">Go back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-details-page">
      <div className="activity-header">
        <h1>{activity.title}</h1>
        <Link 
          to={`/profile/${activity.createdBy._id}`} 
          className="creator-info"
        >
          <div className="creator-avatar">
            {activity.createdBy.image ? (
              <img src={activity.createdBy.image} alt="Creator" />
            ) : (
              <span>{activity.createdBy.name[0].toUpperCase()}</span>
            )}
          </div>
          <span>Created by {activity.createdBy.name}</span>
        </Link>
      </div>

      <div className="activity-content">
        <div className="activity-info">
          <div className="info-item">
            <span className="icon">⏰</span>
            <div className="info-text">
              <h3>Time</h3>
              <p>{formatDate(activity.time)}</p>
              {activity.endTime && (
                <p>Ends at {formatDate(activity.endTime)}</p>
              )}
            </div>
          </div>

          <div className="info-item">
            <span className="icon">📍</span>
            <div className="info-text">
              <h3>Location</h3>
              <p>{activity.locationName || locationName || 'Location not specified'}</p>
            </div>
          </div>

          <div className="info-item">
            <span className="icon">👥</span>
            <div className="info-text">
              <h3>Participants</h3>
              <p>{activity.joinees?.length || 0} / {activity.participantCount || 'unlimited'}</p>
            </div>
          </div>

          {activity.description && (
            <div className="info-item">
              <span className="icon">📝</span>
              <div className="info-text">
                <h3>Description</h3>
                <p>{activity.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="participants-section">
          <h2>Participants</h2>
          <div className="participants-grid">
            {activity.joinees?.map(participant => (
              <Link 
                to={`/profile/${participant._id}`}
                key={participant._id} 
                className="participant-card"
              >
                <div className="participant-avatar">
                  {participant.image ? (
                    <img src={participant.image} alt={participant.name} />
                  ) : (
                    <span>{participant.name[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="participant-name">{participant.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 