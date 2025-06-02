import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Profile.css'
import Notifications from './Notifications'
import { getAddressFromCoords } from './utils/geocoding'
import ActivityCard from './components/ActivityCard'

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
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState(null)

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
      console.log("Fetching notifications for user:", user._id);
      setNotificationsLoading(true)
      setNotificationsError(null)
      try {
        console.log("Making request to notifications endpoint...");
        const response = await fetch('http://localhost:8000/api/notifications', {
          method: 'GET',
          credentials: 'include', // Important: Send cookies for session validation
          headers: {
            'Content-Type': 'application/json'
          }
        })

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        if (response.status === 401) {
          throw new Error('Please log in to view notifications')
        }

        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }

        const data = await response.json()
        console.log("Notifications response data:", data)

        if (!data.notifications) {
          console.error("Unexpected response format:", data);
          throw new Error('Invalid response format from server');
        }

        // Transform the notifications to match our frontend format
        const transformedNotifications = data.notifications.map(n => ({
          id: n._id,
          text: n.message || generateNotificationText(n),
          type: n.type,
          timestamp: n.createdAt,
          activityId: n.activityId?._id,
          activityTitle: n.activityId?.title,
          followerId: n.followerId?._id,
          followerName: n.followerId?.name,
          followerImage: n.followerId?.image
        }))
        console.log("Transformed notifications:", transformedNotifications);
        setNotifications(transformedNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotificationsError(error.message)
      } finally {
        setNotificationsLoading(false)
      }
    }

    // Helper function to generate notification text based on type and data
    const generateNotificationText = (notification) => {
      switch (notification.type) {
        case 'follow':
          return `${notification.followerId?.name || 'Someone'} started following you`
        case 'event_join':
          return `${notification.followerId?.name || 'Someone'} joined your event '${notification.activityId?.title || 'Unknown event'}'`
        case 'comment':
          return `${notification.followerId?.name || 'Someone'} commented on your event '${notification.activityId?.title || 'Unknown event'}'`
        case 'join_request':
          return `${notification.followerId?.name || 'Someone'} requested to join your event '${notification.activityId?.title || 'Unknown event'}'`
        default:
          return notification.message || 'New notification'
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

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/mass-delete', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters: {} }) // No additional filters
      })
      if (!response.ok) {
        throw new Error('Failed to clear notifications')
      }
      setNotifications([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  const handleNotificationRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

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
            loading={notificationsLoading}
            error={notificationsError}
            onNotificationRead={handleNotificationRead}
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

        {(activeTab === 'followers' || activeTab === 'following') ? (
          <div className="events-list">
            {currentItems.length === 0 ? (
              <p className="no-events">
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            ) : (
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
            )}
          </div>
        ) : (
          <>
            {currentItems.length === 0 ? (
              <p className="no-events">
                No {activeTab === 'created' ? 'created' : "RSVP'd"} events yet
              </p>
            ) : (
              <div className="events-list">
                {currentItems.map((event) => (
                  <ActivityCard 
                    key={event._id} 
                    event={event} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}