import React, { useState, useRef, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import './Notifications.css';

export default function Notifications({ items = [] }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="notifications" ref={dropdownRef}>
      <FaBell
        className="bell-icon"
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <ul className="notif-dropdown">
          {items.length > 0 ? (
            items.map((n) => (
              <li key={n.id}>{n.text}</li>
            ))
          ) : (
            <li className="no-notifs">No notifications</li>
          )}
        </ul>
      )}
    </div>
  );
}
