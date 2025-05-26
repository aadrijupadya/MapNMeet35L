export const getAddressFromCoords = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            // Get the most relevant result (usually the first one)
            const result = data.results[0];
            
            // Extract different parts of the address
            const addressComponents = result.address_components;
            let streetNumber = '';
            let route = '';
            let neighborhood = '';
            let locality = '';
            
            addressComponents.forEach(component => {
                if (component.types.includes('street_number')) {
                    streetNumber = component.long_name;
                } else if (component.types.includes('route')) {
                    route = component.long_name;
                } else if (component.types.includes('neighborhood')) {
                    neighborhood = component.long_name;
                } else if (component.types.includes('locality')) {
                    locality = component.long_name;
                }
            });

            // Construct a readable address
            let address = '';
            if (streetNumber && route) {
                address = `${streetNumber} ${route}`;
            } else if (route) {
                address = route;
            } else if (neighborhood) {
                address = neighborhood;
            } else if (locality) {
                address = locality;
            } else {
                // Fallback to formatted address if specific components aren't available
                address = result.formatted_address;
            }

            return address;
        }
        return null;
    } catch (error) {
        console.error('Error getting address:', error);
        return null;
    }
}; 