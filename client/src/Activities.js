import React, { useState } from 'react';
import './Activities.css';

export default function Activities() {
  console.log('Activities component mounted'); // Debug 1 - Should appear immediately

  const initialEvents = [
    {
      id: 1,
      author: "Antonio Quintero",
      title: "Gooning in Hedrick Summit",
      location: "Hedrick Summit Lounge 7 West",
      participants: { min: 4, max: 8, display: "4-8 people" },
      date: new Date('2025-12-15T14:00:00'),
      distance: 0.5
    },
    {
      id: 2,
      author: "Aadrij Upadaya",
      title: "Basketball Pickup Game",
      location: "Hitch Courts",
      participants: { min: 10, max: 10, display: "10 people" },
      date: new Date('2025-12-14T17:00:00'),
      distance: 1.2
    },
    {
      id: 3,
      author: "Akhilesh Basetty",
      title: "Speaking of the devil",
      location: "Hedrick Hall Lounge 3 East",
      participants: { min: 15, max: 20, display: "15-20 people" },
      date: new Date('2025-12-16T08:00:00'),
      distance: 3.7
    }
  ];

  const [events, setEvents] = useState(initialEvents);
  const [activeSort, setActiveSort] = useState('recent');

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortEvents = (type) => {
    console.group(`Sorting by ${type}`);
    console.log('Original order:', initialEvents.map(e => e.id));
    
    const sortedEvents = [...initialEvents];
    
    switch(type) {
      case 'recent':
        sortedEvents.sort((a, b) => b.date - a.date);
        break;
      case 'closest':
        sortedEvents.sort((a, b) => a.distance - b.distance);
        break;
      case 'participants':
        sortedEvents.sort((a, b) => b.participants.max - a.participants.max);
        break;
      default:
        break;
    }
    
    console.log('New order:', sortedEvents.map(e => e.id));
    console.groupEnd();
    
    document.getElementById('sort-feedback').textContent = `Sorted by ${type}`;
    setTimeout(() => {
      document.getElementById('sort-feedback').textContent = '';
    }, 1000);
    
    setActiveSort(type);
    setEvents(sortedEvents);
  };

  window.debugActivities = () => {
    console.log('--- DEBUG ACTIVITIES ---');
    console.log('Current state:', { events, activeSort });
    console.log('Initial events:', initialEvents);
    sortEvents('recent');
  };

  return (
    <div className="activities-page">
      {/* ➕ Create Activity Button */}
      <a href="/create-activity" className="create-button">+</a>

      {/* Sort Feedback */}
      <div id="sort-feedback" style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#FFB400',
        padding: '5px',
        borderRadius: '4px',
        display: 'none'
      }}></div>

      {/* Map Area */}
      <div className="map-container">
        <div className="map-placeholder">
          Map will be implemented here
        </div>
      </div>

      {/* Events Area */}
      <div className="events-container">
        <div className="sort-options">
          <button onClick={() => sortEvents('recent')} className={activeSort === 'recent' ? 'active' : ''}>Most Recent</button>
          <button onClick={() => sortEvents('closest')} className={activeSort === 'closest' ? 'active' : ''}>Closest</button>
          <button onClick={() => sortEvents('participants')} className={activeSort === 'participants' ? 'active' : ''}>Most Participants</button>
        </div>

        {events.map(event => (
          <div className="event-post" key={event.id}>
            <div className="event-author">{event.author}</div>
            <div className="event-title">{event.title}</div>
            <div className="event-location">📍 {event.location} ({event.distance} miles away)</div>
            <div className="event-participants">👥 {event.participants.display}</div>
            <div className="event-time">⏰ {formatDate(event.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
