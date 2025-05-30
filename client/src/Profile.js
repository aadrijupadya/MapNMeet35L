import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Profile.css';
import { getAddressFromCoords } from './utils/geocoding';

export default function Profile({ user }) {
  const [userEvents, setUserEvents] = useState([]);
  const [rsvpdEvents, setRsvpdEvents] = useState([]);
  const [friends] = useState([
    { id: 'audit-raj', name: 'Audit Raj', profilePic: null }
  ]);
  const [activeTab, setActiveTab] = useState('created');
  const [locationNames, setLocationNames] = useState({});
  const [profilePic, setProfilePic] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetch(`http://localhost:8000/api/activities/user/${user._id}`)
      .then(r => r.json())
      .then(events => {
        setUserEvents(events);
        return fetch(`http://localhost:8000/api/activities/rsvpd/${user._id}`);
      })
      .then(r => r.json())
      .then(events => setRsvpdEvents(events))
      .catch(console.error);
  }, [user, navigate]);

  useEffect(() => {
    const fetchLocationNames = async () => {
      const all = [...userEvents, ...rsvpdEvents];
      const map = {};
      for (const ev of all) {
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
    if (userEvents.length || rsvpdEvents.length) fetchLocationNames();
  }, [userEvents, rsvpdEvents]);

  const formatDate = date =>
    new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const handleProfilePicChange = e => {
    const file = e.target.files[0];
    if (file) setProfilePic(URL.createObjectURL(file));
  };

  const currentItems =
    activeTab === 'created'
      ? userEvents
      : activeTab === 'rsvpd'
      ? rsvpdEvents
      : friends;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="profile-img" />
            ) : (
              <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>
          <label htmlFor="profilePicUpload" className="upload-overlay">+</label>
          <input
            type="file"
            accept="image/*"
            id="profilePicUpload"
            onChange={handleProfilePicChange}
            className="upload-input"
          />
        </div>
        <div className="profile-info">
          <h1>{user.name || 'Anonymous User'}</h1>
          <p className="profile-email">{user.email}</p>
          {user.contact && <p className="profile-contact">✉️ {user.contact}</p>}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={activeTab === 'created' ? 'active' : ''}
            onClick={() => setActiveTab('created')}
          >
            Created Events ({userEvents.length})
          </button>
          <button
            className={activeTab === 'rsvpd' ? 'active' : ''}
            onClick={() => setActiveTab('rsvpd')}
          >
            RSVP'd Events ({rsvpdEvents.length})
          </button>
          <button
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends.length})
          </button>
        </div>

        <div className="events-list">
          {currentItems.map(item =>
            activeTab === 'friends' ? (
              <Link
                to={`/profile/${item.id}`}
                key={item.id}
                className="friend-card"
              >
                <div className="friend-avatar">
                  {item.profilePic ? (
                    <img src={item.profilePic} alt={item.name} />
                  ) : (
                    <span>{item.name[0]}</span>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{item.name}</h3>
                </div>
              </Link>
            ) : (
              <div key={item._id} className="event-card">
                <h3>{item.title}</h3>
                <p className="event-time">{formatDate(item.time)}</p>
                <p className="event-location">
                  {item.location
                    ? (() => {
                        try {
                          const { lat, lng } = JSON.parse(item.location);
                          const addr = locationNames[item._id];
                          return addr
                            ? `${addr} (${lat.toFixed(2)}, ${lng.toFixed(2)})`
                            : `(${lat.toFixed(2)}, ${lng.toFixed(2)})`;
                        } catch {
                          return 'Location not available';
                        }
                      })()
                    : 'Location not available'}
                </p>
                <p className="event-participants">
                  {item.participantCount || 0} participants
                </p>
                <button
                  className="view-event-btn"
                  onClick={() => navigate(`/activities?id=${item._id}`)}
                >
                  View Event
                </button>
              </div>
            )
          )}

          {currentItems.length === 0 && (
            <div className="no-events">
              {activeTab === 'created' && 'No created events yet'}
              {activeTab === 'rsvpd' && "No RSVP'd events yet"}
              {activeTab === 'friends' && 'No friends yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
