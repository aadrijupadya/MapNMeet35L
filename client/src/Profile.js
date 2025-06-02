import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Profile.css'
import Notifications from './Notifications'
import { getAddressFromCoords } from './utils/geocoding'

export default function Profile({ user }) {
  const [userEvents, setUserEvents] = useState([])
  const [rsvpdEvents, setRsvpdEvents] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [activeTab, setActiveTab] = useState('created')
  const [locationNames, setLocationNames] = useState({})
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [profileData, setProfileData] = useState({
    bio: user?.bio || '',
    instagram: user?.instagram || ''
  })
  const [updateStatus, setUpdateStatus] = useState({ message: '', type: '' })
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Antonio Quintero started following you",
      type: "follow",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      text: "Sarah Johnson joined your event 'Basketball at Wooden'",
      type: "event_join",
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 3,
      text: "Michael Chen commented on your event 'Study Group at Powell'",
      type: "comment",
      timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: 4,
      text: "Emily Davis started following you",
      type: "follow",
      timestamp: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
    },
    {
      id: 5,
      text: "Your event 'Soccer Practice' has reached 10 participants!",
      type: "milestone",
      timestamp: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
    },
    {
      id: 6,
      text: "James Wilson requested to join your event 'Movie Night'",
      type: "join_request",
      timestamp: new Date(Date.now() - 18000000).toISOString() // 5 hours ago
    },
    {
      id: 7,
      text: "Lisa Brown started following you",
      type: "follow",
      timestamp: new Date(Date.now() - 21600000).toISOString() // 6 hours ago
    },
    {
      id: 8,
      text: "Your event 'Hiking Trip' is starting in 1 hour",
      type: "reminder",
      timestamp: new Date(Date.now() - 25200000).toISOString() // 7 hours ago
    }
  ])

  const navigate = useNavigate()
  const notifRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    const fetchUserData = async () => {
      try {
        // Fetch followers and following
        const followResponse = await fetch(
          `http://localhost:8000/api/users/${user._id}/follow`
        )
        if (followResponse.ok) {
          const data = await followResponse.json()
          setFollowers(data.followers || [])
          setFollowing(data.following || [])
        }

        // Fetch events
        const eventsResponse = await fetch(`http://localhost:8000/api/activities/user/${user._id}`)
        const events = await eventsResponse.json()
        setUserEvents(events)

        const rsvpdResponse = await fetch(`http://localhost:8000/api/activities/rsvpd/${user._id}`)
        const rsvpdEvents = await rsvpdResponse.json()
        setRsvpdEvents(rsvpdEvents)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/users/${user._id}/notifications`
        )
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }
    fetchNotifications()
  }, [user, navigate])

  useEffect(() => {
    const fetchLocationNames = async () => {
      const all = [...userEvents, ...rsvpdEvents]
      const map = {}
      for (const ev of all) {
        if (ev.location) {
          try {
            const { lat, lng } = JSON.parse(ev.location)
            const addr = await getAddressFromCoords(lat, lng)
            if (addr) map[ev._id] = addr
          } catch {}
        }
      }
      setLocationNames(map)
    }
    if (userEvents.length || rsvpdEvents.length) fetchLocationNames()
  }, [userEvents, rsvpdEvents])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifications((prev) => [...prev]) // no-op just to force re-render
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/updateProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id, ...profileData })
      })
      const data = await response.json()
      if (response.ok) {
        Object.assign(user, data.user)
        setUpdateStatus({ message: 'Profile updated successfully!', type: 'success' })
        setTimeout(() => {
          setUpdateStatus({ message: '', type: '' })
        }, 2000)
      } else {
        setUpdateStatus({
          message: data.error || 'Failed to update profile. Please try again.',
          type: 'error'
        })
      }
    } catch {
      setUpdateStatus({
        message: 'Network error. Please check your connection and try again.',
        type: 'error'
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const currentItems =
    activeTab === 'created' ? userEvents :
    activeTab === 'rsvpd' ? rsvpdEvents :
    activeTab === 'followers' ? followers :
    activeTab === 'following' ? following : []

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {user.image ? (
              <img src={user.image} alt="Profile" className="profile-img" />
            ) : (
              <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>
        </div>
        <div className="profile-info">
          <h1>{user.name || 'Anonymous User'}</h1>
          <p className="profile-email">✉️ {user.email}</p>
          {user.contact && user.contact !== user.email && (
            <p className="profile-contact">📧 Contact: {user.contact}</p>
          )}
          {user.instagram && (
            <p className="profile-instagram">📸 @{user.instagram}</p>
          )}
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <button
            className="customize-profile-btn"
            onClick={() => setShowCustomizeModal(true)}
          >
            Customize Profile
          </button>
        </div>

        <div ref={notifRef}>
          <Notifications 
            items={notifications} 
            onDeleteNotification={handleDeleteNotification}
            onClearAll={handleClearAllNotifications}
          />
        </div>
      </div>

      {showCustomizeModal && (
        <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setShowCustomizeModal(false)}
            >
              ×
            </button>
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
              <button type="submit" className="save-profile-btn">
                Save Changes
              </button>
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
            className={activeTab === 'followers' ? 'active' : ''}
            onClick={() => setActiveTab('followers')}
          >
            Followers ({followers.length})
          </button>
          <button
            className={activeTab === 'following' ? 'active' : ''}
            onClick={() => setActiveTab('following')}
          >
            Following ({following.length})
          </button>
        </div>

        <div className="events-list">
          {(activeTab === 'followers' || activeTab === 'following') ? (
            currentItems.map((person) => (
              <Link
                key={person._id}
                to={`/profile/${person._id}`}
                className="friend-card"
              >
                <div className="friend-avatar">
                  {person.image ? (
                    <img src={person.image} alt={person.name} />
                  ) : (
                    <span>{person.name[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="friend-info">
                  <h3>{person.name}</h3>
                  {person.email && <p className="friend-email">{person.email}</p>}
                </div>
              </Link>
            ))
          ) : (
            (activeTab === 'created' ? userEvents : rsvpdEvents).map((event) => (
              <div key={event._id} className="event-card">
                <h3>{event.title}</h3>
                <p className="event-time">{formatDate(event.time)}</p>
                <p className="event-location">
                  {event.location
                    ? (() => {
                        try {
                          const coords = JSON.parse(event.location)
                          const address = locationNames[event._id]
                          return address
                            ? `${address} (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                            : `(${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                        } catch {
                          return 'Location not available'
                        }
                      })()
                    : 'Location not available'}
                </p>
                <p className="event-participants">
                  {event.participantCount || 0} participants
                </p>
                <button
                  className="view-event-btn"
                  onClick={() => navigate(`/activities?id=${event._id}`)}
                >
                  View Event
                </button>
              </div>
            ))
          )}
          {activeTab === 'followers' && followers.length === 0 && (
            <div className="no-events">No followers yet</div>
          )}
          {activeTab === 'following' && following.length === 0 && (
            <div className="no-events">Not following anyone yet</div>
          )}
          {(activeTab === 'created' || activeTab === 'rsvpd') &&
            (activeTab === 'created' ? userEvents : rsvpdEvents).length === 0 && (
              <div className="no-events">
                No {activeTab === 'created' ? 'created' : "RSVP'd"} events yet
              </div>
            )}
        </div>
      </div>
    </div>
  );
}