import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './UserProfile.css';
import { getAddressFromCoords } from './utils/geocoding';
import ActivityCard from './components/ActivityCard';

export default function UserProfile() {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [locationNames, setLocationNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`http://localhost:8000/api/users/${userId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!userResponse.ok) {
          throw new Error('User not found');
        }
        const userData = await userResponse.json();
        setProfileUser(userData);

        // Fetch user's created events
        const eventsResponse = await fetch(`http://localhost:8000/api/activities/user/${userId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setUserEvents(eventsData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    const fetchLocationNames = async () => {
      const map = {};
      for (const ev of userEvents) {
        if (ev.location) {
          try {
            const { lat, lng } = JSON.parse(ev.location);
            const addr = await getAddressFromCoords(lat, lng);
            if (addr) map[ev._id] = addr;
          } catch {}
        }
      }
      setLocationNames(map);
    };

    if (userEvents.length) fetchLocationNames();
  }, [userEvents]);

  const formatDate = (dateString) => {
    try {
      // Handle both time and endTime fields
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
    return <div className="profile-page">Loading...</div>;
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-message">
          {error}
          <Link to="/" className="back-link">Go back to home</Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-page">
        <div className="error-message">
          User not found
          <Link to="/" className="back-link">Go back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {profileUser.image ? (
              <img src={profileUser.image} alt="Profile" className="profile-img" />
            ) : (
              <span>{profileUser.name ? profileUser.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profileUser.name || 'Anonymous User'}</h1>
          <p className="profile-email">✉️ {profileUser.email}</p>
          {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
          {profileUser.instagram && (
            <p className="profile-instagram">📸 @{profileUser.instagram}</p>
          )}
        </div>
      </div>

      <div className="profile-content">
        <h2>Created Activities</h2>
        <div className="events-grid">
          {userEvents.length === 0 ? (
            <p className="no-events">No activities created yet</p>
          ) : (
            userEvents.map((event) => (
              <ActivityCard 
                key={event._id} 
                event={event} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 