import React, { useState } from 'react';
import './Activities.css';

export default function Activities() {
  console.log('Activities component mounted'); // Debug 1 - Should appear immediately

  // Sample event data with proper numeric values for sorting
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

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort function with debug logs
  const sortEvents = (type) => {
    console.group(`Sorting by ${type}`);
    console.log('Original order:', initialEvents.map(e => e.id));
    
    const sortedEvents = [...initialEvents]; // Always start from original
    
    switch(type) {
      case 'recent':
        sortedEvents.sort((a, b) => {
          const result = b.date - a.date;
          console.log(`Comparing ${a.id}(${a.date}) and ${b.id}(${b.date}):`, result);
          return result;
        });
        break;
      case 'closest':
        sortedEvents.sort((a, b) => {
          const result = a.distance - b.distance;
          console.log(`Comparing ${a.id}(${a.distance}mi) and ${b.id}(${b.distance}mi):`, result);
          return result;
        });
        break;
      case 'participants':
        sortedEvents.sort((a, b) => {
          const result = b.participants.max - a.participants.max;
          console.log(`Comparing ${a.id}(${a.participants.max}) and ${b.id}(${b.participants.max}):`, result);
          return result;
        });
        break;
      default:
        break;
    }
    
    console.log('New order:', sortedEvents.map(e => e.id));
    console.groupEnd();
    
    // Visual feedback in UI
    document.getElementById('sort-feedback').textContent = `Sorted by ${type}`;
    setTimeout(() => {
      document.getElementById('sort-feedback').textContent = '';
    }, 1000);
    
    setActiveSort(type);
    setEvents(sortedEvents);
  };

  // Emergency debug function
  window.debugActivities = () => {
    console.log('--- DEBUG ACTIVITIES ---');
    console.log('Current state:', { events, activeSort });
    console.log('Initial events:', initialEvents);
    sortEvents('recent');
  };

  return (
    <div className="activities-page">
      {/* Debug element */}
      <div id="sort-feedback" style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#FFB400',
        padding: '5px',
        borderRadius: '4px',
        display: 'none' /* Will show via JS */
      }}></div>

      <div className="map-container">
        <div className="map-placeholder">
          Map will be implemented here
        </div>
      </div>
      
      <div className="events-container">
        <div className="sort-options">
          <button 
            onClick={() => {
              console.log('Most Recent button clicked'); // Debug 2
              sortEvents('recent');
            }}
            className={activeSort === 'recent' ? 'active' : ''}
          >
            Most Recent
          </button>
          <button 
            onClick={() => {
              console.log('Closest button clicked'); // Debug 3
              sortEvents('closest');
            }}
            className={activeSort === 'closest' ? 'active' : ''}
          >
            Closest
          </button>
          <button 
            onClick={() => {
              console.log('Most Participants button clicked'); // Debug 4
              sortEvents('participants');
            }}
            className={activeSort === 'participants' ? 'active' : ''}
          >
            Most Participants
          </button>
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