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

const placeTypes = [
  { type: ['tourist_attraction', 'park', 'beach'], title: 'Tourist Spots & Gardens' },
  { type: 'lodging', title: 'Hotels' },
  { type: 'restaurant', title: 'Restaurants' }
];

function Map({ location }) {
  const googlePlacesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: googlePlacesApiKey,
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [places, setPlaces] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useRef();
  const placesServiceRef = useRef();

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    if (location) {
      searchNearbyPlaces(location);
    }
  }, [location]);

  const validatePhoto = useCallback((photo) => {
    try {
      return photo && typeof photo.getUrl === 'function' && photo.getUrl();
    } catch (error) {
      console.error('Error validating photo:', error);
      return false;
    }
  }, []);

  const searchNearbyPlaces = useCallback((location) => {
    if (!placesServiceRef.current) return;

    setPlaces([]);
    setMarkers([]);

    placeTypes.forEach(({ type, title }) => {
      const types = Array.isArray(type) ? type : [type];
      
      // Use a smaller radius and limit results
      const request = {
        location,
        radius: 5000, // Reduced from 5000m to 3000m
        rankBy: window.google.maps.places.RankBy.RATING, // Prioritize higher rated places
        type: types[0] // Only search for the primary type
      };

      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Limit to top rated places
          const topResults = results
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 10);

          // Separate places with and without photos
          const placesWithPhotos = topResults.filter(place => 
            place.photos && place.photos.length > 0 && validatePhoto(place.photos[0])
          );
          
          const placesWithoutPhotos = topResults.filter(place => 
            !place.photos || place.photos.length === 0 || !validatePhoto(place.photos[0])
          );
          
          setPlaces(prev => {
            const existingCategoryIndex = prev.findIndex(p => p.title === title);
            if (existingCategoryIndex >= 0) {
              const updatedCategory = {
                ...prev[existingCategoryIndex],
                results: [...prev[existingCategoryIndex].results, ...placesWithPhotos],
                resultsWithoutPhotos: [
                  ...(prev[existingCategoryIndex].resultsWithoutPhotos || []),
                  ...placesWithoutPhotos
                ]
              };
              return [
                ...prev.slice(0, existingCategoryIndex),
                updatedCategory,
                ...prev.slice(existingCategoryIndex + 1)
              ];
            }
            return [...prev, { 
              type: types[0], 
              title, 
              results: placesWithPhotos,
              resultsWithoutPhotos: placesWithoutPhotos
            }];
          });

          // Only add markers for places with rating >= 3.0
          const markersToAdd = [...placesWithPhotos, ...placesWithoutPhotos]
            .filter(place => place.rating >= 3.0)
            .map(place => ({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              time: new Date(),
              info: place.name,
              place
            }));
          
          setMarkers(prev => [...prev, ...markersToAdd]);
        }
      });
    });
  }, [validatePhoto]);

  const handleSearch = useCallback(() => {
    if (!searchInput) return;

    const geocoder = new window.google.maps.Geocoder();
    
    // Clear existing markers and places before new search
    setMarkers([]);
    setPlaces([]);

    const request = {
      address: searchInput + ', India'  // Append India to help with location context
    };

    geocoder.geocode(request, (results, status) => {
      console.log('Search input:', searchInput);
      console.log('Geocoding status:', status);
      console.log('Geocoding results:', results);
      
      // Inside handleSearch()
geocoder.geocode(request, (results, status) => {
    console.log('Geocoding Status:', status); // Add this line
    console.log('Geocoding Results:', results); // Add this line
    // ... rest of the code ...
  });
      if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
        // Filter results to only include those in India
        const indiaResults = results.filter(result => {
          return result.formatted_address.includes('India');
        });
        
        if (indiaResults.length > 0) {
          const location = {
            lat: indiaResults[0].geometry.location.lat(),
            lng: indiaResults[0].geometry.location.lng()
          };
          
          console.log('Found location:', location);
          mapRef.current.panTo(location);
          mapRef.current.setZoom(13);
          
          // Search for nearby places with the new location
          searchNearbyPlaces(indiaResults[0].geometry.location);
        } else {
          alert('Please enter a location in India');
        }
      } else {
        let errorMessage = 'Could not find this location. ';
        
        switch(status) {
          case window.google.maps.GeocoderStatus.ZERO_RESULTS:
            errorMessage += 'Please try a more specific location name.';
            break;
          case window.google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
            errorMessage += 'Too many requests. Please try again later.';
            break;
          case window.google.maps.GeocoderStatus.REQUEST_DENIED:
            errorMessage += 'Please check if the Geocoding API is properly enabled.';
            break;
          default:
            errorMessage += `Error: ${status}. Please try again.`;
        }
        
        console.error('Geocoding failed:', {
          status: status,
          hasResults: results && results.length > 0,
          searchInput: searchInput
        });
        alert(errorMessage);
      }
    });
  }, [searchInput, searchNearbyPlaces]);

  const showPlaceDetails = useCallback((place) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: place.place_id,
      fields: ['name', 'rating', 'formatted_address', 'formatted_phone_number', 
               'website', 'opening_hours', 'reviews', 'photos', 'price_level']
    };

    placesServiceRef.current.getDetails(request, (placeDetails, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSelected({ ...place, details: placeDetails });
      }
    });
  }, []);

  const handlePhotoClick = useCallback((e, place) => {
    e.stopPropagation(); // Prevent triggering the card click
    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    window.open(googleMapsUrl, '_blank');
  }, []);

  const openInGoogleMaps = useCallback((place) => {
    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    window.open(googleMapsUrl, '_blank');
  }, []);

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
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a destination in India..."
          className="w-full p-3 bg-white text-gray-800 rounded-lg shadow-sm border border-gray-100 focus:ring-2 focus:ring-teal-400 focus:border-teal-500 outline-none placeholder-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="mt-2 w-full p-3 bg-gradient-to-r from-orange-400 via-teal-500 to-teal-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
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
            streetViewControl: false,
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
              onClick={() => showPlaceDetails(marker.place)}
            />
          ))}

          {selected && selected.details && (
            <InfoWindow 
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="max-w-sm bg-white text-gray-800 p-4 rounded-lg shadow-lg ">
                <h2 className="text-lg font-bold mb-2">{selected.details.name}</h2>
                {selected.details.photos && selected.details.photos.length > 0 && (
                  <img 
                    src={selected.details.photos[0].getUrl()}
                    alt={selected.details.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="text-sm">
                  <p className="mb-1 text-gray-600">{selected.details.formatted_address}</p>
                  {selected.details.rating && (
                    <p className="text-orange-500 mb-1 font-medium">
                      {selected.details.rating} ★ ({selected.details.user_ratings_total} reviews)
                    </p>
                  )}
                  {selected.details.formatted_phone_number && (
                    <p className="mb-1 text-gray-600">📞 {selected.details.formatted_phone_number}</p>
                  )}
                  {selected.details.website && (
                    <a 
                      href={selected.details.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className="mt-4 space-y-8 px-4">
        {places.map(({ type, title, results, resultsWithoutPhotos }) => {
          if (results.length === 0 && (!resultsWithoutPhotos || resultsWithoutPhotos.length === 0)) {
            return null;
          }

          return (
            <div key={type} className="place-category space-y-6">
              <h2 className="text-2xl font-bold mb-4 text-cyan-700">{title}</h2>
              
              {/* Places with photos */}
              {results.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">Featured Places</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {results.slice(0, 6).map((place) => (
                      <div 
                        key={place.place_id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group border border-cyan-50 hover:border-cyan-100"
                        onClick={() => openInGoogleMaps(place)}
                      >
                        <div className="relative h-48">
                          {validatePhoto(place.photos[0]) && (
                            <img 
                              src={place.photos[0].getUrl()}
                              alt={place.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', place.name);
                                e.target.parentElement.parentElement.style.display = 'none';
                              }}
                            />
                          )}
                          {place.rating && (
                            <div className="absolute top-2 right-2 bg-white bg-opacity-95 px-2 py-1 rounded-full text-sm font-semibold text-orange-500 z-10 shadow-sm">
                              {place.rating} ★
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium text-shadow">
                              🗺️ View in Google Maps
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{place.name}</h3>
                          {place.rating && (
                            <div className="text-sm text-gray-500 mb-2">
                              {place.user_ratings_total} reviews
                            </div>
                          )}
                          <p className="text-gray-600 text-sm line-clamp-2">{place.vicinity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Places without photos */}
              {resultsWithoutPhotos && resultsWithoutPhotos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">More Places</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {resultsWithoutPhotos.slice(0, 6).map((place) => (
                      <div 
                        key={place.place_id}
                        className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-300 cursor-pointer border border-orange-50 hover:border-cyan-100"
                        onClick={() => openInGoogleMaps(place)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{place.name}</h3>
                            {place.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-orange-500 font-semibold">{place.rating} ★</span>
                                <span className="text-sm text-gray-500">({place.user_ratings_total} reviews)</span>
                              </div>
                            )}
                            <p className="text-gray-600 text-sm line-clamp-2">{place.vicinity}</p>
                          </div>
                          <span className="text-2xl" role="img" aria-label="location pin">📍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Map;