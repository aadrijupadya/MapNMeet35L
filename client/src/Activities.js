import React, { useEffect, useRef, useState } from 'react';
import './Activities.css';
import { formToJSON } from 'axios';

const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) return resolve();
        if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve();
            } else {
                reject(new Error('Google Maps API failed to load correctly.'));
            }
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

export default function Activities(props) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRefs = useRef({});
    const eventRefs = useRef({});
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [activeSort, setActiveSort] = useState('recent');
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilters, setSearchFilters] = useState({
        title: true,
        description: true,
        location: true,
        time: true
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Google Maps API key is missing.');
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => {
                mapInstance.current = new window.google.maps.Map(mapRef.current, {
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
            .then((res) => res.json())
            .then((data) => {
                setEvents(data);
                setFilteredEvents(data);
                addMarkers(data);
            })
            .catch((err) => {
                console.error('Map or API error:', err);
            });
    }, []);

    useEffect(() => {
        const filtered = events.filter(event => {
            if (!searchQuery) return true;

            const searchLower = searchQuery.toLowerCase();
            const matches = [];

            if (searchFilters.title && event.title) {
                matches.push(event.title.toLowerCase().includes(searchLower));
            }
            if (searchFilters.description && event.description) {
                matches.push(event.description.toLowerCase().includes(searchLower));
            }
            if (searchFilters.location && event.locationName) {
                matches.push(event.locationName.toLowerCase().includes(searchLower));
            }
            if (searchFilters.time) {
                matches.push(formatDate(event.time).toLowerCase().includes(searchLower));
            }

            return matches.some(match => match);
        });
        setFilteredEvents(filtered);
    }, [searchQuery, searchFilters, events]);

    const addMarkers = (activities) => {
        activities.forEach((activity) => {
            if (!activity.location) return;
            let coords;
            try {
                coords = typeof activity.location === 'string' ? JSON.parse(activity.location) : activity.location;
            } catch (e) {
                console.warn('Invalid location:', activity.location);
                return;
            }

            const marker = new window.google.maps.Marker({
                position: { lat: coords.lat, lng: coords.lng },
                map: mapInstance.current,
                title: activity.title
            });

            const id = activity._id || activity.id;
            markerRefs.current[id] = marker;

            marker.addListener('click', () => {
                setSelectedEventId(id);
                setTimeout(() => {
                    const ref = eventRefs.current[id];
                    if (ref && ref.scrollIntoView) {
                        ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
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
                  ${activity.title}
                </div>
              `
            });
            
            marker.addListener('mouseover', () => {
                infoWindow.open(mapInstance.current, marker);
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
        setSearchQuery(e.target.value);
    };

    const toggleFilter = (filter) => {
        setSearchFilters(prev => ({
            ...prev,
            [filter]: !prev[filter]
        }));
    };

    const handleSearchFocus = () => {
        setShowFilters(true);
    };

    const handleSearchBlur = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setShowFilters(false);
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
        setActiveSort(type);
        const feedback = document.getElementById('sort-feedback');
        if (feedback) {
            feedback.textContent = `Sorted by ${type}`;
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 1000);
        }
    };

    const addParticipant = async (userId, activityId, remove) => {
        const response = await fetch('http://localhost:8000/api/addParticipant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, activityId, remove }),
        })

        if (!response.ok) {
            console.log(`Failed to add participant: ${response.error}`);
        } else {
            console.log("Participant added successfully")
        }
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
                <div className="search-container" onBlur={handleSearchBlur} tabIndex="0">
                    <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        className="search-input"
                    />
                    {showFilters && (
                        <div className="search-filters">
                            <div className="filter-header">Search in:</div>
                            {Object.entries(searchFilters).map(([filter, isActive]) => (
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
                <div className="sort-options">
                    <button onClick={() => sortEvents('recent')} className={activeSort === 'recent' ? 'active' : ''}>Most Recent</button>
                    <button onClick={() => sortEvents('upcoming')} className={activeSort === 'upcoming' ? 'active' : ''}>Upcoming</button>
                    <button onClick={() => sortEvents('closest')} className={activeSort === 'closest' ? 'active' : ''}>Closest</button>
                    <button onClick={() => sortEvents('participants')} className={activeSort === 'participants' ? 'active' : ''}>Most Participants</button>
                </div>
                {filteredEvents.map((event) => {
                    const id = event._id || event.id;
                    return (
                        <div
                            key={id}
                            ref={(el) => (eventRefs.current[id] = el)}
                            className={`event-post ${selectedEventId === id ? 'highlighted' : ''}`}
                            onClick={() => {
                                setSelectedEventId(id);
                                const marker = markerRefs.current[id];
                                if (marker && mapInstance.current) {
                                    mapInstance.current.panTo(marker.getPosition());
                                    mapInstance.current.setZoom(17);
                                }
                            }}
                        >
                            <div className="event-author">{event.author}</div>
                            <div className="event-title">{event.title}</div>
                            <div className="event-location">📍{
                                event.location ?  (() => {
                                  try {                                  
                                    const coords = JSON.parse(event.location) 
                                    return `(${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)})`
                                  } catch {
                                    return event.location;
                                    }})() : 'Location not available'
                            }</div>
                            <div className="event-participants">👥{event.participantCount ? `${event.participantCount} participants` : 'No participants set'}</div>
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
                            <div className="event-time">⏰{formatDate(event.time)}</div>
                            <button
                                className="add-participant-button"
                                onClick={() => {
                                    if (event.joinees && event.joinees.some(joinee => joinee._id === props.userId)) {
                                        console.log("Leave event logic");
                                    } else {
                                        addParticipant(props.userId, id);
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
        </div>
    );
}