import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '50vh',
  borderRadius: '0.75rem',
  overflow: 'hidden',
};

const center = {
  lat: 20.5937,
  lng: 78.9629,
};

const mapOptions = {
  styles: [
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#a5d7e0" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#e8f5e9" }]
    }
  ]
};

function ARMap({ location }) {
  const googlePlacesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: googlePlacesApiKey,
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useRef();
  const placesServiceRef = useRef();
  const [arLink, setArLink] = useState('');

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    if (location) {
      searchForLocation(location);
    }
  }, [location]);

  const searchForLocation = useCallback((location) => {
    if (!placesServiceRef.current) return;
    setMarkers([]);
    
    const marker = {
      lat: location.lat(),
      lng: location.lng(),
      time: new Date(),
    };
    
    setMarkers([marker]);
    
    // Generate AR link for the location
    const arGoogleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat()},${location.lng()}&heading=0&pitch=0`;
    setArLink(arGoogleMapsUrl);
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchInput) return;

    const geocoder = new window.google.maps.Geocoder();
    
    // Clear existing markers before new search
    setMarkers([]);
    setSelected(null);
    setArLink('');

    const request = {
      address: searchInput + ', India'  // Append India to help with location context
    };

    geocoder.geocode(request, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
        // Filter results to only include those in India
        const indiaResults = results.filter(result => {
          return result.formatted_address.includes('India');
        });
        
        if (indiaResults.length > 0) {
          const location = indiaResults[0].geometry.location;
          
          mapRef.current.panTo(location);
          mapRef.current.setZoom(15);
          
          // Place a marker and generate AR link
          searchForLocation(location);
          
          // Get place details to show in selected
          if (placesServiceRef.current) {
            const request = {
              location: location,
              radius: 500,
              type: 'tourist_attraction'
            };
            
            placesServiceRef.current.nearbySearch(request, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                setSelected({
                  lat: location.lat(),
                  lng: location.lng(),
                  place: results[0],
                  name: results[0].name,
                  address: results[0].vicinity,
                  
                });
              } else {
                // If no tourist attraction found, just use the geocoded result
                setSelected({
                  lat: location.lat(),
                  lng: location.lng(),
                  name: indiaResults[0].formatted_address.split(',')[0],
                  address: indiaResults[0].formatted_address
                });
              }
            });
          }
        } else {
          alert('Please enter a location in India');
        }
      } else {
        alert('Could not find this location. Please try another search term.');
      }
    });
  }, [searchInput, searchForLocation]);

  const handleViewInAR = useCallback(() => {
    if (arLink) {
      window.open(arLink, '_blank');
    }
  }, [arLink]);

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="map-container h-full overflow-y-auto">
      
      <div className="search-container p-4 mb-4">
       {selected && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{selected.name}</h3>
          <p className="text-gray-600 mb-4">{selected.address}</p>
        </div>
       )} 
      
   
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a landmark or monument in India..."
          className="w-full p-3 bg-white text-gray-800 rounded-lg shadow-sm border border-gray-100 focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none placeholder-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="mt-2 w-full p-3 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Search
        </button>
      </div>
      
      <div className="relative rounded-xl h-auto">
        <GoogleMap 
          mapContainerStyle={mapContainerStyle}
          zoom={5}
          center={center}
          onLoad={onMapLoad}
          options={{
            ...mapOptions,
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            zoomControlOptions: {
              position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
            },
            fullscreenControlOptions: {
              position: window.google.maps.ControlPosition.RIGHT_TOP,
            },
          }}
        >
          {markers.map((marker) => (
            <Marker
              key={`${marker.lat}-${marker.lng}-${marker.time.toISOString()}`}
              position={{ lat: marker.lat, lng: marker.lng }}
            />
          ))}
        </GoogleMap>
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-center gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              View in Google Maps
            </a>
            
            <button
              onClick={handleViewInAR}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
            >
              <span>View in AR</span>
              <span role="img" aria-label="AR">🥽</span>
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              The AR view allows you to experience this location in immersive street view. 
              Use your device's gyroscope to look around in 360° view.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ARMap; 