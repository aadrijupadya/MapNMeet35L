import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import './Notifications.css';

export default function Notifications({ 
  items = [], 
  onDeleteNotification, 
  onClearAll, 
  loading = false,
  error = null,
  onNotificationRead = () => {}
}) {
  const [open, setOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const isRecent = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    return diffInHours < 24; // Consider notifications from last 24 hours as recent
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation(); // Prevent the notification click event
    if (onDeleteNotification) {
      onDeleteNotification(notificationId);
    }
  };

  const handleNotificationClick = (notificationId) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
    onNotificationRead(notificationId);
  };

  const handleClearAll = (e) => {
    console.log('Clear all button clicked');
    e.stopPropagation();
    if (onClearAll) {
      console.log('Calling onClearAll prop');
      onClearAll();
    }
    setOpen(false);
  };

  const unreadCount = items.filter(item => !readNotifications.has(item.id)).length;

  return (
    <div className="notifications" ref={dropdownRef}>
      <div className="bell-container">
        <FaBell
          className="bell-icon"
          onClick={() => setOpen((prev) => !prev)}
        />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {items.length > 0 && !loading && !error && (
              <button className="clear-all" onClick={handleClearAll}>
                Clear all
              </button>
            )}
          </div>
          <div className="notif-list">
            {loading ? (
              <div className="notif-status">Loading notifications...</div>
            ) : error ? (
              <div className="notif-status error">{error}</div>
            ) : items.length > 0 ? (
              items.map((n) => (
                <div 
                  key={n.id} 
                  className="notif-item"
                  onClick={() => handleNotificationClick(n.id)}
                >
                  <div className="notif-content">
                    <p className="notif-text">{n.text}</p>
                    <span className="notif-time">{formatTimeAgo(n.timestamp)}</span>
                  </div>
                  {isRecent(n.timestamp) && !readNotifications.has(n.id) && (
                    <div className="recent-dot" />
                  )}
                  <button 
                    className="delete-notif"
                    onClick={(e) => handleDelete(e, n.id)}
                    aria-label="Delete notification"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))
            ) : (
              <div className="notif-status">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
