import React from 'react';
import { Link } from 'react-router-dom';
import './ActivityCard.css';

export default function ActivityCard({ event }) {
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

  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p className="event-date">{formatDate(event.time)} - {formatDate(event.endTime)}</p>
      {event.locationName ? (
        <p className="event-location">{event.locationName}</p>
      ) : (
        <p className="event-location">Location not available</p>
      )}
      <p className="event-participants">
        {event.joinees?.length || 0} / {event.participantCount || 'unlimited'} participants
      </p>
      <Link 
        to={`/activities?id=${event._id}`}
        className="view-event-btn"
      >
        View Event
      </Link>
    </div>
  );
} 