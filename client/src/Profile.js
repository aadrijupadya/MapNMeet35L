import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { getAddressFromCoords } from './utils/geocoding';

export default function Profile({ user }) {
    const [userEvents, setUserEvents] = useState([]);
    const [rsvpdEvents, setRsvpdEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('created'); // 'created' or 'rsvpd'
    const [locationNames, setLocationNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        // Fetch user's created events
        fetch(`http://localhost:8000/api/activities/user/${user._id}`)
            .then(res => res.json())
            .then(events => {
                setUserEvents(events);
                // Fetch user's RSVP'd events
                return fetch(`http://localhost:8000/api/activities/rsvpd/${user._id}`);
            })
            .then(res => res.json())
            .then(events => {
                setRsvpdEvents(events);
            })
            .catch(err => {
                console.error('Error fetching events:', err);
            });
    }, [user, navigate]);

    useEffect(() => {
        // Fetch location names for all events
        const fetchLocationNames = async () => {
            const allEvents = [...userEvents, ...rsvpdEvents];
            const locationMap = {};

            for (const event of allEvents) {
                if (event.location) {
                    try {
                        const coords = JSON.parse(event.location);
                        const address = await getAddressFromCoords(coords.lat, coords.lng);
                        if (address) {
                            locationMap[event._id] = address;
                        }
                    } catch (error) {
                        console.error('Error parsing location for event:', event._id, error);
                    }
                }
            }

            setLocationNames(locationMap);
        };

        if (userEvents.length > 0 || rsvpdEvents.length > 0) {
            fetchLocationNames();
        }
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

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
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
                </div>

                <div className="events-list">
                    {(activeTab === 'created' ? userEvents : rsvpdEvents).map(event => (
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
                    ))}
                    {(activeTab === 'created' ? userEvents : rsvpdEvents).length === 0 && (
                        <div className="no-events">
                            No {activeTab === 'created' ? 'created' : 'RSVP\'d'} events yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 