import React, { useEffect, useRef, useState } from 'react';
import './Activities.css';
import { formToJSON } from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { getAddressFromCoords } from './utils/geocoding';
import CreateActivity from './CreateActivity';
import EditActivity from './EditActivity';
import { FaUserPlus, FaUserCheck } from 'react-icons/fa';

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
        location: true
    });
    const [timeRange, setTimeRange] = useState({
        start: '',
        end: ''
    });
    const [showSearchFilters, setShowSearchFilters] = useState(false);
    const [searchParams] = useSearchParams();
    const [addresses, setAddresses] = useState({});
    const [showMyEvents, setShowMyEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [clickedCoordinates, setClickedCoordinates] = useState(null);
    const [createActivityOpen, setCreateActivityOpen] = useState(false);
    const markerRef = useRef(null);
    const markerColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent')
        .trim();
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, eventId: null });
    const [editActivity, setEditActivity] = useState(null);
    const [followingStatus, setFollowingStatus] = useState({});

    useEffect(() => {
        console.log('Activities component props:', props);
        console.log('User data:', props.user);
        console.log('User ID:', props.userId);
    }, [props]);

    useEffect(() => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Missing Google Maps API key');
            return;
        }
        const uclaBounds = {
            north: 34.0810,
            south: 34.0580,
            west: -118.4590,
            east: -118.4340
        };

        loadGoogleMapsScript(apiKey)
            .then(() => {
                map.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 34.0689, lng: -118.4452 },
                    mapTypeControl: false,
                    zoom: 15,
                    restriction: {
                        latLngBounds: uclaBounds,
                        strictBounds: true
                    },
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
                    ],
                });

                map.current.addListener('click', (e) => {
                    if (createActivityOpen || editActivity) {
                        const pos = e.latLng;
                        setClickedCoordinates({ lat: pos.lat(), lng: pos.lng() });
                        
                        if (markerRef.current) {
                            markerRef.current.setPosition(pos);
                        } else {
                            markerRef.current = new window.google.maps.Marker({
                                position: pos,
                                map: map.current,
                                icon: {
                                    path: 'M0-48c-9.941 0-18 8.059-18 18 0 14.178 18 30 18 30s18-15.822 18-30c0-9.941-8.059-18-18-18z',
                                    fillColor: markerColor,
                                    fillOpacity: 0.8,
                                    scale: 1
                                }
                            });
                        }
                    }
                });
                return fetch('http://localhost:8000/api/activities');
            })
            .then(res => res.json())
            .then(data => {
                console.log('Received events data:', data.map(event => ({
                    id: event._id,
                    title: event.title,
                    locationName: event.locationName,
                    location: event.location
                })));
                setEvents(data);
                setFilteredEvents(data);
                addMarkers(data);
            })
            .catch(err => console.error('Error loading map or events:', err));
    }, [createActivityOpen, editActivity]);

    useEffect(() => {
        const fetchFollowingStatus = async () => {
            if (!props.userId) return;
            try {
                const response = await fetch(`http://localhost:8000/api/users/${props.userId}/follow`);
                if (response.ok) {
                    const data = await response.json();
                    const followingMap = {};
                    data.following.forEach(user => {
                        followingMap[user._id] = true;
                    });
                    setFollowingStatus(followingMap);
                }
            } catch (error) {
                console.error('Error fetching following status:', error);
            }
        };
        fetchFollowingStatus();
    }, [props.userId]);

    useEffect(() => {
        const filtered = events.filter(event => {
            if (showMyEvents && props.userId) {
                const isCreatedByUser = event.createdBy?._id === props.userId;
                const isJoinedByUser = event.joinees?.some(joinee => joinee._id === props.userId);
                if (!isCreatedByUser && !isJoinedByUser) return false;
            }

            // Time range filtering
            if (timeRange.start || timeRange.end) {
                const eventTime = new Date(event.time).getTime();
                if (timeRange.start && new Date(timeRange.start).getTime() > eventTime) return false;
                if (timeRange.end && new Date(timeRange.end).getTime() < eventTime) return false;
            }

            if (!searchText) return true;

            const searchLower = searchText.toLowerCase();
            const matches = [];

            if (searchIn.title && event.title) matches.push(event.title.toLowerCase().includes(searchLower));
            if (searchIn.description && event.description) matches.push(event.description.toLowerCase().includes(searchLower));
            if (searchIn.location) {
                // Search in both locationName and reverse geocoded address
                const locationMatches = [];
                
                // Check locationName if it exists
                if (event.locationName) {
                    locationMatches.push(event.locationName.toLowerCase().includes(searchLower));
                }
                
                // Check reverse geocoded address if it exists
                const address = addresses[event._id];
                if (address) {
                    locationMatches.push(address.toLowerCase().includes(searchLower));
                }
                
                // Check coordinates if they exist
                if (event.location) {
                    try {
                        const coords = JSON.parse(event.location);
                        const coordString = `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`;
                        locationMatches.push(coordString.includes(searchLower));
                    } catch (e) {
                        console.warn('Invalid location format:', event.location);
                    }
                }
                
                // If any location match is found, add it to matches
                if (locationMatches.some(match => match)) {
                    matches.push(true);
                }
            }

            return matches.some(match => match);
        });
        setFilteredEvents(filtered);
        updateMarkers(filtered);
    }, [searchText, searchIn, events, showMyEvents, props.userId, addresses, timeRange]);

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
        let sorted;
        if (type === 'following') {
            sorted = events.filter(event =>
                // Show events created by people you follow or your own events
                (event.createdBy?._id && followingStatus[event.createdBy._id]) || 
                event.createdBy?._id === props.userId
            );
        } else {
            sorted = [...events];
            switch (type) {
                case 'upcoming':
                    sorted.sort((a, b) => new Date(a.time) - new Date(b.time));
                    break;
                case 'participants':
                    sorted.sort((a, b) => ((b.joinees?.length || 0) - (a.joinees?.length || 0)));
                    break;
                default:
                    break;
            }
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

    const updateUserContact = async (userId) => {
        try {
            console.log('Updating contact for user:', userId);
            console.log('User data from props:', props.user);
            
            if (!props.user?.email) {
                console.error('No email found in user data');
                return;
            }

            const res = await fetch('http://localhost:8000/api/updateContact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId,
                    contact: props.user.email
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update contact');
            }

            const result = await res.json();
            console.log('Contact update result:', result);
        } catch (error) {
            console.error('Error updating contact:', error);
        }
    };

    const toggleEventParticipation = async (userId, eventId, leave = false) => {
        try {
            console.log('Toggle participation:', { userId, eventId, leave });
            console.log('Current user data:', props.user);

            // First update the user's contact if they're joining
            if (!leave) {
                await updateUserContact(userId);
            }

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

            // Update the selectedEvent in the modal if it's open and matches the event
            setSelectedEvent(prev => {
                if (prev && (prev._id === eventId || prev.id === eventId)) {
                    return updatedEvents.find(e => (e._id === eventId || e.id === eventId)) || prev;
                }
                return prev;
            });

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

    const removeParticipant = async (eventId, userId) => {
        try {
            const res = await fetch('http://localhost:8000/api/addParticipant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    activityId: eventId, 
                    remove: true 
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove participant');
            }

            // Refresh events after removal
            const eventsRes = await fetch('http://localhost:8000/api/activities');
            const updatedEvents = await eventsRes.json();
            setEvents(updatedEvents);
            setFilteredEvents(updatedEvents);
            
            // Update selected event if it's the one we modified
            if (selectedEvent && selectedEvent._id === eventId) {
                const updatedEvent = updatedEvents.find(e => e._id === eventId);
                if (updatedEvent) {
                    setSelectedEvent(updatedEvent);
                }
            }

            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = 'Participant removed';
                feedback.style.display = 'block';
                feedback.style.background = '#4CAF50';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        } catch (error) {
            console.error('Error removing participant:', error);
            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = error.message || 'Failed to remove participant';
                feedback.style.display = 'block';
                feedback.style.background = '#f44336';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/activities/${eventId}?userId=${props.userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete event');
            }

            // Remove the marker from the map
            if (markers.current[eventId]) {
                markers.current[eventId].setMap(null);
                delete markers.current[eventId];
            }

            // Fetch updated events from backend to ensure UI is in sync
            const eventsRes = await fetch('http://localhost:8000/api/activities');
            const updatedEvents = await eventsRes.json();
            setEvents(updatedEvents);
            setFilteredEvents(updatedEvents);

            // Close modal if the deleted event was being viewed
            if (selectedEvent && selectedEvent._id === eventId) {
                setSelectedEvent(null);
            }

            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = 'Event deleted successfully';
                feedback.style.display = 'block';
                feedback.style.background = '#4CAF50';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            const feedback = document.getElementById('sort-feedback');
            if (feedback) {
                feedback.textContent = error.message || 'Failed to delete event';
                feedback.style.display = 'block';
                feedback.style.background = '#f44336';
                setTimeout(() => feedback.style.display = 'none', 2000);
            }
        }
    };

    const handleTimeRangeChange = (type, value) => {
        setTimeRange(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const clearTimeRange = () => {
        setTimeRange({ start: '', end: '' });
    };

    const renderFollowButton = (joinee) => {
        if (!props.userId || props.userId === joinee._id) return null;
        
        const isFollowing = followingStatus[joinee._id];
        
        return (
            <button 
                className="follow-icon-button"
                onClick={async (e) => {
                    e.stopPropagation();
                    try {
                        console.log('Follow/Unfollow request:', {
                            userId: props.userId,
                            targetUserId: joinee._id,
                            joineeData: joinee
                        });
                        const response = await fetch(`http://localhost:8000/api/users/${props.userId}/follow`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                targetUserId: joinee._id
                            })
                        });
                        const data = await response.json();
                        console.log('Follow/Unfollow response:', data);
                        if (response.ok) {
                            setFollowingStatus(prev => ({
                                ...prev,
                                [joinee._id]: data.isFollowing
                            }));
                            
                            const feedback = document.getElementById('sort-feedback');
                            if (feedback) {
                                feedback.textContent = data.isFollowing ? 'Following' : 'Unfollowed';
                                feedback.style.display = 'block';
                                feedback.style.background = '#4CAF50';
                                setTimeout(() => feedback.style.display = 'none', 2000);
                            }
                        } else {
                            console.error('Follow/Unfollow error:', data.error);
                            throw new Error(data.error || 'Failed to follow/unfollow user');
                        }
                    } catch (error) {
                        console.error('Follow/Unfollow error:', error);
                        const feedback = document.getElementById('sort-feedback');
                        if (feedback) {
                            feedback.textContent = error.message || 'Something went wrong';
                            feedback.style.display = 'block';
                            feedback.style.background = '#f44336';
                            setTimeout(() => feedback.style.display = 'none', 2000);
                        }
                    }
                }}
                title={isFollowing ? "Unfollow user" : "Follow user"}
            >
                {isFollowing ? <FaUserCheck className="follow-icon" /> : <FaUserPlus className="follow-icon" />}
            </button>
        );
    };

    return (
        <div className="activities-page">
            {createActivityOpen ? (
                <CreateActivity 
                    userId={props.userId}
                    coordinates={clickedCoordinates}
                    onClose={() => {
                        setCreateActivityOpen(false);
                        markerRef.current = null;
                    }}
                />
            ) : (
                <a onClick={() => setCreateActivityOpen(true)} className="create-button" >+</a>
            )}
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
                                <div className="time-range-filter">
                                    <div className="filter-header">Time Range:</div>
                                    <div className="time-inputs">
                                        <div className="time-input-group">
                                            <label>From:</label>
                                            <input
                                                type="datetime-local"
                                                value={timeRange.start}
                                                onChange={(e) => handleTimeRangeChange('start', e.target.value)}
                                            />
                                        </div>
                                        <div className="time-input-group">
                                            <label>To:</label>
                                            <input
                                                type="datetime-local"
                                                value={timeRange.end}
                                                onChange={(e) => handleTimeRangeChange('end', e.target.value)}
                                            />
                                        </div>
                                        {(timeRange.start || timeRange.end) && (
                                            <button 
                                                className="clear-time-range"
                                                onClick={clearTimeRange}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                    <button onClick={() => sortEvents('upcoming')} className={sortBy === 'upcoming' ? 'active' : ''}>Upcoming </button>
                    <button onClick={() => sortEvents('participants')} className={sortBy === 'participants' ? 'active' : ''}>Most Participants</button>
                    <button onClick={() => sortEvents('following')} className={sortBy === 'following' ? 'active' : ''}>Following Only</button>
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
                                                <div className="joinee-info">
                                                    <span className="joinee-name">{joinee.name}</span>
                                                    <div className="joinee-actions">
                                                        {renderFollowButton(joinee)}
                                                        {props.userId === event.createdBy?._id && (
                                                            <button 
                                                                className="remove-participant-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeParticipant(event._id, joinee._id);
                                                                }}
                                                                title="Remove participant"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className="joinee-contact">({joinee.contact})</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="no-joinees">No participants yet</div>
                                )}
                            </div>
                            <div className="event-time" data-emoji="⏰">{formatDate(event.time)}</div>
                            <div className="event-actions">
                                {props.userId !== event.createdBy?._id ? (
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
                                    >
                                        {event.joinees && event.joinees.some(joinee => joinee._id === props.userId) ? 'Leave' : 'Join'}
                                    </button>
                                ) : (
                                    <div className="button-group">
                                        <button
                                            className="edit-event-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditActivity(event);
                                            }}
                                        >
                                            Edit Event
                                        </button>
                                        <button
                                            className="delete-event-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm({ show: true, eventId: id });
                                            }}
                                        >
                                            Delete Event
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                    <div className="joinees-list-container">
                                        {selectedEvent.joinees && selectedEvent.joinees.length > 0 ? (
                                            <ul className="joinees-list">
                                                {selectedEvent.joinees.map((joinee, index) => (
                                                    <li key={index} className="joinee-item">
                                                        <div className="joinee-info">
                                                            <span className="joinee-name">{joinee.name}</span>
                                                            <div className="joinee-actions">
                                                                {renderFollowButton(joinee)}
                                                                {props.userId === selectedEvent.createdBy?._id && (
                                                                    <button 
                                                                        className="remove-participant-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeParticipant(selectedEvent._id, joinee._id);
                                                                        }}
                                                                        title="Remove participant"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <span className="joinee-contact">({joinee.contact})</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="no-joinees">No participants yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="event-modal-footer">
                                {props.userId !== selectedEvent.createdBy?._id && (
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
                                    >
                                        {selectedEvent.joinees && selectedEvent.joinees.some(joinee => joinee._id === props.userId) ? 'Leave Event' : 'Join Event'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm.show && (
                <div className="event-modal-overlay" onClick={() => setDeleteConfirm({ show: false, eventId: null })}>
                    <div className="event-modal" onClick={e => e.stopPropagation()}>
                        <div className="event-modal-content" style={{ textAlign: 'center' }}>
                            <h2>Are you sure you want to delete this event?</h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '2rem' }}>
                                <button
                                    className="delete-event-button"
                                    onClick={() => {
                                        deleteEvent(deleteConfirm.eventId);
                                        setDeleteConfirm({ show: false, eventId: null });
                                    }}
                                >
                                    Delete
                                </button>
                                <button
                                    className="add-participant-button"
                                    onClick={() => setDeleteConfirm({ show: false, eventId: null })}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editActivity && (
                <EditActivity
                    activity={editActivity}
                    userId={props.userId}
                    onClose={() => {
                        setEditActivity(null);
                        if (markerRef.current) {
                            markerRef.current.setMap(null);
                            markerRef.current = null;
                        }
                    }}
                    onUpdate={(updatedActivity) => {
                        setEvents(prevEvents => 
                            prevEvents.map(event => 
                                event._id === updatedActivity._id ? updatedActivity : event
                            )
                        );
                        setFilteredEvents(prevEvents => 
                            prevEvents.map(event => 
                                event._id === updatedActivity._id ? updatedActivity : event
                            )
                        );
                        setEditActivity(null);
                        if (markerRef.current) {
                            markerRef.current.setMap(null);
                            markerRef.current = null;
                        }
                    }}
                    map={map.current}
                    markerRef={markerRef}
                />
            )}
        </div>
    );
}