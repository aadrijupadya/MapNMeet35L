import React, { useEffect, useRef, useState } from 'react';
import './CreateActivity.css';

export default function CreateActivity() {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [coordinates, setCoordinates] = useState(null);
    const [locationName, setLocationName] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        locationName: '',
        time: '',
        participantCount: '',
        contactInfo: '',
    });

    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value });
    };


    function loadGoogleMapsScript(apiKey) {
        return new Promise((resolve, reject) => {
            if (window.google) return resolve(); // already loaded

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);
        });
    }

    useEffect(() => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

        loadGoogleMapsScript(apiKey).then(() => {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: 34.0689, lng: -118.4452 },
                zoom: 15,
            });

            const geocoder = new window.google.maps.Geocoder();

            map.addListener('click', (e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                const newCoords = { lat, lng };
                setCoordinates(newCoords);

                geocoder.geocode({ location: newCoords }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        console.log('Full Geocoding Results:', results);
                        console.log('Selected Location Details:', {
                            formatted_address: results[0].formatted_address,
                            address_components: results[0].address_components,
                            geometry: results[0].geometry,
                            place_id: results[0].place_id,
                            types: results[0].types
                        });
                        const name = results[0].formatted_address;
                        setLocationName(name);
                        setForm(prev => ({...prev, locationName: name }));
                    } else {
                        console.warn('Geocoding failed:', status, results);
                        setLocationName('Location selected');
                        setForm(prev => ({...prev, locationName: 'Location selected' }));
                    }
                });

                if (markerRef.current) {
                    markerRef.current.setPosition(e.latLng);
                } else {
                    markerRef.current = new window.google.maps.Marker({
                        position: e.latLng,
                        map,
                    });
                }
            });
        }).catch(err => {
            console.error("Failed to load Google Maps script", err);
        });
    }, []);

    const handleSubmit = async(e) => {
        e.preventDefault();

        if (!coordinates) {
            setStatus('Please select a location on the map');
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    location: JSON.stringify(coordinates),
                    locationName: locationName || 'Location selected',
                    participantCount: parseInt(form.participantCount),
                    time: new Date(form.time),
                }),
            });

            if (res.ok) {
                setStatus('Event created!');
                setForm({
                    title: '',
                    description: '',
                    location: '',
                    time: '',
                    participantCount: '',
                    contactInfo: '',
                });
                setCoordinates(null);
                if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
                }
            } else {
                setStatus('Failed to create event');
            }
        } catch (err) {
            setStatus('Error submitting form');
            console.error(err);
        }
    };

    return ( <
        div className = "create-container" >
        <
        h2 > Create New Activity < /h2> <
        form onSubmit = { handleSubmit }
        className = "create-form" > {
            ['title', 'description', 'contactInfo'].map((field) => ( <
                input key = { field }
                name = { field }
                placeholder = { field.charAt(0).toUpperCase() + field.slice(1) }
                value = { form[field] }
                onChange = { handleChange }
                required /
                >
            ))
        }

        <
        input type = "datetime-local"
        name = "time"
        value = { form.time }
        onChange = { handleChange }
        required /
        >

        <
        input type = "number"
        name = "participantCount"
        placeholder = "Participant Count"
        value = { form.participantCount }
        onChange = { handleChange }
        required min = "1" /
        >

        <
        div className = "map-instructions" > Click on the map to set location: < /div> <
        div ref = { mapRef }
        className = "map-box" / >

        <
        button type = "submit" > Submit < /button> < /
        form > {
            status && < p className = "status" > { status } < /p>} < /
            div >
        );
    }