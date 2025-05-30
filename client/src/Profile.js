import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Profile.css';
import { getAddressFromCoords } from './utils/geocoding';

export default function Profile({ user }) {
  const [userEvents, setUserEvents] = useState([]);
  const [rsvpdEvents, setRsvpdEvents] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  const [locationNames, setLocationNames] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: user?.bio || '',
    instagram: user?.instagram || ''
  });
  const [updateStatus, setUpdateStatus] = useState({ message: '', type: '' });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch user's friends
    const fetchFriends = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/users/${user._id}/friends`);
        if (response.ok) {
          const data = await response.json();
          setFriends(data.friends || []);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
    
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting to update profile with data:', {
        userId: user._id,
        ...profileData
      });

      const response = await fetch('http://localhost:8000/api/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          ...profileData
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        // Update the local user object with the new data
        Object.assign(user, data.user);
        
        setUpdateStatus({ message: 'Profile updated successfully!', type: 'success' });
        // Clear success message after 2 seconds but keep modal open
        setTimeout(() => {
          setUpdateStatus({ message: '', type: '' });
        }, 2000);
      } else {
        console.error('Server error:', data.error);
        setUpdateStatus({ 
          message: data.error || 'Failed to update profile. Please try again.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateStatus({ 
        message: 'Network error. Please check your connection and try again.', 
        type: 'error' 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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
          <p className="profile-email">✉️ {user.email}</p>
          {user.contact && user.contact !== user.email && (
            <p className="profile-contact">📧 Contact: {user.contact}</p>
          )}
          {user.instagram && <p className="profile-instagram">📸 @{user.instagram}</p>}
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <button 
            className="customize-profile-btn"
            onClick={() => setShowCustomizeModal(true)}
          >
            Customize Profile
          </button>
        </div>
      </div>

      {/* Customize Profile Modal */}
      {showCustomizeModal && (
        <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowCustomizeModal(false)}>×</button>
            <h2>Customize Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="instagram">Instagram Handle:</label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={profileData.instagram}
                  onChange={handleInputChange}
                  placeholder="@username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio:</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  maxLength="280"
                />
                <small>Maximum 280 characters</small>
              </div>
              {updateStatus.message && (
                <div className={`update-status ${updateStatus.type}`}>
                  {updateStatus.message}
                </div>
              )}
              <button type="submit" className="save-profile-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}

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
          {activeTab === 'friends' ? (
            friends.map(friend => (
              <Link key={friend.id} to={`/profile/${friend.id}`} className="friend-card">
                <div className="friend-avatar">
                  {friend.profilePic ? (
                    <img src={friend.profilePic} alt={friend.name} />
                  ) : (
                    <span>{friend.name[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{friend.name}</h3>
                </div>
              </Link>
            ))
          ) : (
            (activeTab === 'created' ? userEvents : rsvpdEvents).map(event => (
              <div key={event._id} className="event-card">
                <h3>{event.title}</h3>
                <p className="event-time">{formatDate(event.time)}</p>
                <p className="event-location">{
                  event.location ? (() => {
                    try {
                      const coords = JSON.parse(event.location);
                      const address = locationNames[event._id];
                      return address
                        ? `${address} (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                        : `(${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`;
                    } catch {
                      return 'Location not available';
                    }
                  })() : 'Location not available'
                }</p>
                <p className="event-participants">{event.participantCount || 0} participants</p>
                <button
                  className="view-event-btn"
                  onClick={() => navigate(`/activities?id=${event._id}`)}
                >
                  View Event
                </button>
              </div>
            ))
          )}
          {activeTab === 'friends' && friends.length === 0 && (
            <div className="no-events">
              No friends yet
            </div>
          )}
          {(activeTab === 'created' || activeTab === 'rsvpd') && 
           (activeTab === 'created' ? userEvents : rsvpdEvents).length === 0 && (
            <div className="no-events">
              No {activeTab === 'created' ? 'created' : 'RSVP\'d'} events yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}