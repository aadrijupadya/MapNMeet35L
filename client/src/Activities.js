import React, { useEffect, useRef, useState } from 'react';
import './Activities.css';
import { formToJSON } from 'axios';
import { useSearchParams } from 'react-router-dom';
import { getAddressFromCoords } from './utils/geocoding';

const loadGoogleMapsScript = (apiKey) => {
    if (window.google?.maps) return Promise.resolve();
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

export default function Activities(props) {
    const mapRef = useRef(null);
    const map = useRef(null);
    const markers = useRef({});
    const eventCards = useRef({});
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [sortBy, setSortBy] = useState('recent');
    const [activeEventId, setActiveEventId] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [searchIn, setSearchIn] = useState({
        title: true,
        description: true,
        location: true,
        time: true
    });
    const [showSearchFilters, setShowSearchFilters] = useState(false);
    const [searchParams] = useSearchParams();
    const [addresses, setAddresses] = useState({});
    const [showMyEvents, setShowMyEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Missing Google Maps API key');
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => {
                map.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 34.0689, lng: -118.4452 },
                    mapTypeControl: false,
                    zoom: 15,
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                        { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
                    ]
                });
                return fetch('http://localhost:8000/api/activities');
            })
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setFilteredEvents(data);
                addMarkers(data);
            })
            .catch(err => console.error('Error loading map or events:', err));
    }, []);

    useEffect(() => {
        const filtered = events.filter(event => {
            if (showMyEvents && props.userId) {
                const isCreatedByUser = event.createdBy?._id === props.userId;
                const isJoinedByUser = event.joinees?.some(joinee => joinee._id === props.userId);
                if (!isCreatedByUser && !isJoinedByUser) return false;
            }

            if (!searchText) return true;

            const searchLower = searchText.toLowerCase();
            const matches = [];

            if (searchIn.title && event.title) matches.push(event.title.toLowerCase().includes(searchLower));
            if (searchIn.description && event.description) matches.push(event.description.toLowerCase().includes(searchLower));
            if (searchIn.location && event.locationName) matches.push(event.locationName.toLowerCase().includes(searchLower));
            if (searchIn.time) matches.push(formatDate(event.time).toLowerCase().includes(searchLower));

            return matches.some(match => match);
        });
        setFilteredEvents(filtered);
        updateMarkers(filtered);
    }, [searchText, searchIn, events, showMyEvents, props.userId]);

    useEffect(() => {
        const eventId = searchParams.get('id');
        if (eventId && events.length > 0) {
            setActiveEventId(eventId);
            const event = events.find(e => e._id === eventId);
            if (event) {
                const card = eventCards.current[eventId];
                if (card && card.scrollIntoView) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                const marker = markers.current[eventId];
                if (marker && map.current) {
                    map.current.panTo(marker.getPosition());
                    map.current.setZoom(17);
                }
            }
        }
    }, [searchParams, events]);

    useEffect(() => {
        const fetchLocationNames = async () => {
            const locationMap = {};
            
            for (const event of events) {
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

            setAddresses(locationMap);
        };

        if (events.length > 0) {
            fetchLocationNames();
        }
    }, [events]);

    const updateMarkers = (events) => {
        if (!map.current) return;

        Object.values(markers.current).forEach(marker => marker.setMap(null));
        markers.current = {};

        addMarkers(events);
    };

    const addMarkers = (events) => {
        events.forEach(event => {
            if (!event.location) return;

            let coords;
            try {
                coords = typeof event.location === 'string' ? JSON.parse(event.location) : event.location;
            } catch (e) {
                console.warn('Invalid location for event:', event.title);
                return;
            }

            const marker = new window.google.maps.Marker({
                position: { lat: coords.lat, lng: coords.lng },
                map: map.current,
                title: event.title
            });

            const id = event._id || event.id;
            markers.current[id] = marker;

            marker.addListener('click', () => {
                setActiveEventId(id);
                const card = eventCards.current[id];
                if (card && card.scrollIntoView) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="
                  font-size: 12px;
                  font-weight: bold;
                  padding: 4px 8px;
                  max-width: 150px;
                  white-space: nowrap;
                  background-color: blue;
                  color: white;
                  border-radius: 6px;
                ">
                  ${event.title}
                </div>
              `
            });
            
            marker.addListener('mouseover', () => {
                infoWindow.open(map.current, marker);
            });

            marker.addListener('mouseout', () => {
                infoWindow.close();
            });
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const toggleFilter = (filter) => {
        setSearchIn(prev => ({
            ...prev,
            [filter]: !prev[filter]
        }));
    };

    const handleSearchFocus = () => {
        setShowSearchFilters(true);
    };

    const handleSearchBlur = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setShowSearchFilters(false);
        }
    };

    const sortEvents = (type) => {
        const sorted = [...filteredEvents];
        switch (type) {
            case 'recent':
                sorted.sort((a, b) => new Date(b.time) - new Date(a.time));
                break;
            case 'upcoming': {
                const now = new Date();
                sorted.sort((a, b) => {
                    const dateA = new Date(a.time);
                    const dateB = new Date(b.time);
                    if (dateA > now && dateB > now) return dateA - dateB;
                    if (dateA > now) return -1;
                    if (dateB > now) return 1;
                    return dateB - dateA;
                });
                break;
            }
            case 'closest':
                sorted.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
                break;
            case 'participants':
                sorted.sort((a, b) => ((b.participants?.max) || 0) - ((a.participants?.max) || 0));
                break;
            default:
                break;
        }
        setFilteredEvents(sorted);
        setSortBy(type);
        const feedback = document.getElementById('sort-feedback');
        if (feedback) {
            feedback.textContent = `Sorted by ${type}`;
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 1000);
        }
    };

    const toggleEventParticipation = async (userId, eventId, leave = false) => {
        try {
            const res = await fetch('http://localhost:8000/api/addParticipant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, activityId: eventId, remove: leave }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update participation');
            }

            const eventsRes = await fetch('http://localhost:8000/api/activities');
            const updatedEvents = await eventsRes.json();
            setEvents(updatedEvents);
            setFilteredEvents(updatedEvents);

            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = leave ? 'Left event' : 'Joined event';
                feedback.style.display = 'block';
                feedback.style.background = '#4CAF50';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        } catch (error) {
            console.error('Error:', error);
            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = error.message || 'Something went wrong';
                feedback.style.display = 'block';
                feedback.style.background = '#f44336';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setActiveEventId(event._id || event.id);
        
        const marker = markers.current[event._id || event.id];
        if (marker && map.current) {
            map.current.panTo(marker.getPosition());
            map.current.setZoom(17);
        }
    };

    const closeModal = (e) => {
        if (e) e.stopPropagation();
        setSelectedEvent(null);
    };

    return (
        <div className="activities-page">
            <a href="/create-activity" className="create-button">+</a>
            <div id="sort-feedback" style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: '#FFB400',
                padding: '5px 10px',
                borderRadius: '4px',
                display: 'none'
            }} />
            <div className="map-container">
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            </div>
            <div className="events-container">
                <div className="filter-controls">
                    <div className="search-container" onBlur={handleSearchBlur} tabIndex="0">
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchText}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            className="search-input"
                        />
                        {showSearchFilters && (
                            <div className="search-filters">
                                <div className="filter-header">Search in:</div>
                                {Object.entries(searchIn).map(([filter, isActive]) => (
                                    <label key={filter} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => toggleFilter(filter)}
                                        />
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    {props.userId && (
                        <button 
                            className={`my-events-toggle ${showMyEvents ? 'active' : ''}`}
                            onClick={() => setShowMyEvents(!showMyEvents)}
                        >
                            {showMyEvents ? 'Show All Events' : 'Show My Events'}
                        </button>
                    )}
                </div>
                <div className="sort-options">
                    <button onClick={() => sortEvents('recent')} className={sortBy === 'recent' ? 'active' : ''}>Most Recent</button>
                    <button onClick={() => sortEvents('upcoming')} className={sortBy === 'upcoming' ? 'active' : ''}>Upcoming</button>
                    <button onClick={() => sortEvents('closest')} className={sortBy === 'closest' ? 'active' : ''}>Closest</button>
                    <button onClick={() => sortEvents('participants')} className={sortBy === 'participants' ? 'active' : ''}>Most Participants</button>
                </div>
                {filteredEvents.map((event) => {
                    const id = event._id || event.id;
                    return (
                        <div
                            key={id}
                            ref={(el) => (eventCards.current[id] = el)}
                            className={`event-post ${activeEventId === id ? 'highlighted' : ''}`}
                            onClick={() => handleEventClick(event)}
                        >
                            <div className="event-creator">
                                <span className="creator-label">Created by:</span>
                                <span className="creator-name">
                                    {event.createdBy?.name || event.creator || 'Anonymous'}
                                </span>
                                <span className="creator-email">
                                    ({event.createdBy?.email || event.contact || 'No email'})
                                </span>
                            </div>
                            <div className="event-title">{event.title}</div>
                            <div className="event-location" data-emoji="📍">{
                                event.location ? (() => {
                                    try {
                                        const coords = JSON.parse(event.location);
                                        const address = addresses[id];
                                        return address 
                                            ? `${address} (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                                            : `(${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`;
                                    } catch {
                                        return 'Location not available';
                                    }
                                })() : 'Location not available'
                            }</div>
                            <div className="event-participants" data-emoji="👥">{event.participantCount ? `${event.participantCount} participants` : 'No participants set'}</div>
                            <div className="event-joinees">
                                {event.joinees && event.joinees.length > 0 ? (
                                    <ul>
                                        {event.joinees.map((joinee, index) => (
                                            <li key={index}>
                                                <span className="joinee-name">{joinee.name}</span>
                                                <span className="joinee-contact"> ({joinee.contact})</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="no-joinees">No participants yet</div>
                                )}
                            </div>
                            <div className="event-time" data-emoji="⏰">{formatDate(event.time)}</div>
                            <button
                                className="add-participant-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (event.joinees && event.joinees.some(joinee => joinee._id === props.userId)) {
                                        toggleEventParticipation(props.userId, id, true);
                                    } else {
                                        toggleEventParticipation(props.userId, id, false);
                                    }
                                }}
                                disabled={props.userId === event.createdBy?._id}
                            >
                                {event.joinees && event.joinees.some(joinee => joinee._id === props.userId) ? 'Leave' : 'Join'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="event-modal-overlay" onClick={closeModal}>
                    <div className="event-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeModal}>×</button>
                        <div className="event-modal-content">
                            <div className="event-modal-header">
                                <h2>{selectedEvent.title}</h2>
                                <div className="event-creator">
                                    <span className="creator-label">Created by:</span>
                                    <span className="creator-name">
                                        {selectedEvent.createdBy?.name || selectedEvent.creator || 'Anonymous'}
                                    </span>
                                    <span className="creator-email">
                                        ({selectedEvent.createdBy?.email || selectedEvent.contact || 'No email'})
                                    </span>
                                </div>
                            </div>
                            
                            <div className="event-modal-body">
                                <div className="event-description">
                                    <h3>Description</h3>
                                    <p>{selectedEvent.description || 'No description provided'}</p>
                                </div>
                                
                                <div className="event-details">
                                    <div className="event-detail-item">
                                        <span className="detail-label">📍 Location:</span>
                                        <span className="detail-value">
                                            {selectedEvent.location ? (() => {
                                                try {
                                                    const coords = JSON.parse(selectedEvent.location);
                                                    const address = addresses[selectedEvent._id];
                                                    return address 
                                                        ? `${address} (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                                                        : `(${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`;
                                                } catch {
                                                    return 'Location not available';
                                                }
                                            })() : 'Location not available'}
                                        </span>
                                    </div>
                                    
                                    <div className="event-detail-item">
                                        <span className="detail-label">⏰ Time:</span>
                                        <span className="detail-value">{formatDate(selectedEvent.time)}</span>
                                    </div>
                                    
                                    <div className="event-detail-item">
                                        <span className="detail-label">👥 Participants:</span>
                                        <span className="detail-value">
                                            {selectedEvent.participantCount ? `${selectedEvent.participantCount} max participants` : 'No limit set'}
                                        </span>
                                    </div>
                                </div>

                                <div className="event-joinees-section">
                                    <h3>Current Participants</h3>
                                    {selectedEvent.joinees && selectedEvent.joinees.length > 0 ? (
                                        <ul className="joinees-list">
                                            {selectedEvent.joinees.map((joinee, index) => (
                                                <li key={index} className="joinee-item">
                                                    <span className="joinee-name">{joinee.name}</span>
                                                    <span className="joinee-contact">({joinee.contact})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="no-joinees">No participants yet</p>
                                    )}
                                </div>
                            </div>

                            <div className="event-modal-footer">
                                <button
                                    className="join-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedEvent.joinees && selectedEvent.joinees.some(joinee => joinee._id === props.userId)) {
                                            toggleEventParticipation(props.userId, selectedEvent._id, true);
                                        } else {
                                            toggleEventParticipation(props.userId, selectedEvent._id, false);
                                        }
                                    }}
                                    disabled={props.userId === selectedEvent.createdBy?._id}
                                >
                                    {selectedEvent.joinees && selectedEvent.joinees.some(joinee => joinee._id === props.userId) ? 'Leave Event' : 'Join Event'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}