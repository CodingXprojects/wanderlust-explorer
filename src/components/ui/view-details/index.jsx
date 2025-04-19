import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../carousel";
import '../../../styles/image-loading.css';
import { fetchPlacePhoto } from "../service/PlacePhotoService";

// Update path to the image - use the existing file
const defaultIndiaImg = '/india-travel-poster-colorful-travel-poster-taj-mahal-lotus-temple-rickshaw-other-symbols-wonderful-land-india-cartoon-102619259.webp';

// Updated fallback strategy to use a single default image
const fallbackImages = {
  default: defaultIndiaImg,
};

// Function to determine the best fallback - simplified to use defaultIndiaImg
const getBestFallback = (placeName, category) => {
  return defaultIndiaImg;
};

// Create a map to store preloaded image states
const preloadedImages = new Map();

// List of known problematic domains to immediately use fallback
const problemDomains = [
  'img.static-bookatable.com',
  'media-cdn.tripadvisor.com',
  'www.autoworldmuseum.com'
];

// Preload an image and return a promise
const preloadImage = (url) => {
  if (!url) return Promise.resolve(defaultIndiaImg);
  if (preloadedImages.has(url)) return Promise.resolve(preloadedImages.get(url));
  
  // Check for problematic domains first
  try {
    const urlObj = new URL(url);
    if (problemDomains.some(domain => urlObj.hostname.includes(domain))) {
      console.warn(`Known problematic domain detected: ${urlObj.hostname}`);
      preloadedImages.set(url, defaultIndiaImg);
      return Promise.resolve(defaultIndiaImg);
    }
  } catch (e) {
    // Invalid URL format
    preloadedImages.set(url, defaultIndiaImg);
    return Promise.resolve(defaultIndiaImg);
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    // Set a shorter timeout to avoid hanging on slow connections
    const timeout = setTimeout(() => {
      console.warn(`Image load timeout: ${url}`);
      preloadedImages.set(url, defaultIndiaImg);
      resolve(defaultIndiaImg);
    }, 3000); // 3 second timeout (reduced from 5s)

    img.onload = () => {
      clearTimeout(timeout);
      preloadedImages.set(url, url);
      resolve(url);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn(`Failed to load image: ${url}`);
      preloadedImages.set(url, defaultIndiaImg);
      resolve(defaultIndiaImg);
    };

    img.src = url;
  });
};

// Validate and clean image URL - improved with better fallbacks
const validateImageUrl = async (url, placeName, category) => {
  if (!url) return getBestFallback(placeName, category);
  if (url.startsWith('/')) return url; // Local images are assumed valid
  
  // Handle Wikipedia URLs specially - they often fail but are actually valid
  // Try to use a more reliable Wikipedia thumbnail URL format
  if (url.includes('wikipedia.org') && url.includes('/thumb/')) {
    try {
      // For Wikipedia URLs, use a more reliable format when possible
      const parts = url.split('/thumb/');
      if (parts.length === 2) {
        const filePath = parts[1].split('/')[0]; // Get the file name
        // Return a smaller, more reliable thumbnail URL
        const smallerThumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${filePath}?width=800`;
        return smallerThumb;
      }
    } catch (e) {
      console.warn('Error processing Wikipedia URL:', e);
    }
  }
  
  // Check for incomplete/invalid URLs
  if (!url.startsWith('http')) {
    return getBestFallback(placeName, category);
  }
  
  try {
    const urlObj = new URL(url);
    
    // Don't try to load from problematic domains
    if (problemDomains.some(domain => urlObj.hostname.includes(domain))) {
      return getBestFallback(placeName, category);
    }
    
    // Don't try to load example.com or placeholder images
    if (urlObj.hostname.includes('example.com') || 
        url.includes('placeholder') || 
        url.includes('example-image')) {
      return getBestFallback(placeName, category);
    }

    // Try to preload the image
    const validatedUrl = await preloadImage(url);
    return validatedUrl !== defaultIndiaImg ? validatedUrl : getBestFallback(placeName, category);
  } catch (error) {
    console.warn(`Invalid image URL: ${url}`, error);
    return getBestFallback(placeName, category);
  }
};

// Simplified Image component with faster loading and fewer animations
const LoadingImage = ({ src, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState(src || defaultIndiaImg);

  useEffect(() => {
    if (!src) {
      setImageUrl(defaultIndiaImg);
      setError(true);
      return;
    }

    setImageUrl(src);
    
    // Check preloaded status first to avoid unnecessary loading
    if (preloadedImages.has(src) && preloadedImages.get(src) !== src) {
      setImageUrl(preloadedImages.get(src));
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
    };

    img.onerror = () => {
      console.warn(`Image error in component: ${src}`);
      setImageUrl(defaultIndiaImg);
      setError(true);
      setIsLoaded(true);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // Return image directly with fallback
  return (
    <div className={`image-loading ${isLoaded ? 'loaded' : ''}`}>
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : ''}`}
        onError={(e) => {
          e.target.src = defaultIndiaImg;
          e.target.onerror = null; // Prevent infinite error loop
          setImageUrl(defaultIndiaImg);
          setError(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
};

function ViewDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [itineraryData, setItineraryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [validatedUrls, setValidatedUrls] = useState(new Map());
  const [googlePhotos, setGooglePhotos] = useState(new Map());
  const [loadingGooglePhotos, setLoadingGooglePhotos] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Check if the server is available when component mounts
  useEffect(() => {
    const checkServer = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('http://localhost:5000/', { 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        // Check if we got a valid JSON response
        const data = await response.json().catch(() => ({}));
        const apiKeyStatus = data.message && data.message.includes("API key loaded");
        
        setServerStatus(response.ok && apiKeyStatus ? 'online' : 'offline');
      } catch (e) {
        console.warn('Server check failed:', e);
        setServerStatus('offline');
      }
    };
    
    checkServer();
  }, []);

  useEffect(() => {
    // Check if we have data from the state
    if (location.state && location.state.itineraryData) {
      try {
        // Parse the data if it's a string, otherwise use as is
        const data = typeof location.state.itineraryData === 'string' 
          ? JSON.parse(location.state.itineraryData) 
          : location.state.itineraryData;
        
        setItineraryData(data);
        if (data?.itinerary?.[0]?.day) {
          setActiveDay(data.itinerary[0].day);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to parse itinerary data:", error);
        setLoading(false);
      }
    } else {
      // No data provided, could redirect back or show an error
      setLoading(false);
    }
  }, [location]);

  // Preload and validate all images when component mounts or itinerary changes
  useEffect(() => {
    if (!itineraryData) return;

    const validateAllImages = async () => {
      const urlsToValidate = new Map();
      const highPriorityUrls = [];
      const normalPriorityUrls = [];

      // Collect and prioritize important image URLs
      if (itineraryData.itinerary && itineraryData.itinerary.length > 0) {
        // High priority: first day's first attraction (banner image)
        const firstDay = itineraryData.itinerary[0];
        if (firstDay?.dailyPlan && firstDay.dailyPlan.length > 0) {
          const firstAttraction = firstDay.dailyPlan[0];
          if (firstAttraction.placeImageUrl) {
            highPriorityUrls.push(firstAttraction.placeImageUrl);
          }
        }

        // Active day activities get priority
        const currentDayData = itineraryData.itinerary.find(day => day.day === activeDay);
        if (currentDayData?.dailyPlan) {
          for (const activity of currentDayData.dailyPlan) {
            if (activity.placeImageUrl && !highPriorityUrls.includes(activity.placeImageUrl)) {
              highPriorityUrls.push(activity.placeImageUrl);
            }
          }
        }

        // Normal priority: all other activities
        for (const day of itineraryData.itinerary) {
          if (day.dailyPlan) {
            for (const activity of day.dailyPlan) {
              if (activity.placeImageUrl && 
                  !highPriorityUrls.includes(activity.placeImageUrl) && 
                  !normalPriorityUrls.includes(activity.placeImageUrl)) {
                normalPriorityUrls.push(activity.placeImageUrl);
              }
            }
          }
        }
      }

      // Normal priority: hotel images
      if (itineraryData.hotels) {
        for (const hotel of itineraryData.hotels) {
          if (hotel.imageUrl && !highPriorityUrls.includes(hotel.imageUrl) && !normalPriorityUrls.includes(hotel.imageUrl)) {
            normalPriorityUrls.push(hotel.imageUrl);
          }
        }
      }

      // Process high priority images first
      for (const url of highPriorityUrls) {
        const validUrl = await validateImageUrl(url, itineraryData.itinerary?.[0]?.dailyPlan?.[0]?.placeName, 'hotel');
        urlsToValidate.set(url, validUrl);
      }

      // Process remaining images
      for (const url of normalPriorityUrls) {
        const validUrl = await validateImageUrl(url, itineraryData.itinerary?.[0]?.dailyPlan?.[0]?.placeName, 'hotel');
        urlsToValidate.set(url, validUrl);
      }

      setValidatedUrls(urlsToValidate);
    };

    validateAllImages().catch(console.error);
  }, [itineraryData, activeDay]);

  // New useEffect for fetching Google Places photos
  useEffect(() => {
    if (!itineraryData) return;
    
    const fetchGooglePhotos = async () => {
      // Skip if we already know the server is offline
      if (serverStatus === 'offline') {
        console.log('Server is offline, skipping photo fetch');
        setLoadingGooglePhotos(false);
        return;
      }
      
      setLoadingGooglePhotos(true);
      const photoMap = new Map();
      
      // Create a list of place names to fetch
      const placeNames = [];
      
      try {
        // Add hotels to the list
        if (itineraryData.hotels) {
          itineraryData.hotels.forEach(hotel => {
            if (hotel.hotelName) placeNames.push({
              name: hotel.hotelName,
              type: 'hotel',
              originalUrl: hotel.imageUrl
            });
          });
        }
        
        // Add tourist spots/activities to the list
        if (itineraryData.itinerary) {
          for (const day of itineraryData.itinerary) {
            if (day.dailyPlan) {
              for (const activity of day.dailyPlan) {
                if (activity.placeName) placeNames.push({
                  name: activity.placeName,
                  type: 'attraction',
                  originalUrl: activity.placeImageUrl
                });
              }
            }
          }
        }
        
        // Process in batches to avoid overwhelming the server
        const batchSize = 2;
        let serverUnavailable = false;
        
        for (let i = 0; i < placeNames.length && !serverUnavailable; i += batchSize) {
          const batch = placeNames.slice(i, i + batchSize);
          const results = await Promise.all(batch.map(async (place) => {
            try {
              const googlePhotoUrl = await fetchPlacePhoto(place.name);
              // If we get null back multiple times, assume server is down
              if (googlePhotoUrl === null && i > batchSize * 2) {
                return { success: false, place };
              } else if (googlePhotoUrl) {
                return { 
                  success: true, 
                  place,
                  url: googlePhotoUrl 
                };
              }
              return { success: false, place };
            } catch (error) {
              console.warn(`Error fetching photo for ${place.name}:`, error);
              return { success: false, place };
            }
          }));
          
          // Check if all requests failed - might indicate server is down
          const allFailed = results.every(r => !r.success);
          if (allFailed && i > 0) {
            console.warn("All photo requests failed, server may be unavailable");
            serverUnavailable = true;
            break;
          }
          
          // Process successful results
          results.filter(r => r.success).forEach(result => {
            photoMap.set(result.place.originalUrl, result.url);
            photoMap.set(result.place.name, result.url);
          });
          
          // Small delay between batches
          if (i + batchSize < placeNames.length && !serverUnavailable) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        console.error("Error in fetchGooglePhotos:", error);
      } finally {
        setGooglePhotos(photoMap);
        setLoadingGooglePhotos(false);
      }
    };

    fetchGooglePhotos().catch(console.error);
  }, [itineraryData, serverStatus]);

  // Format time slot for display
  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return "";
    
    // Extract time if it's in format like "Morning (9:00 AM - 11:00 AM)"
    const timeRegex = /\(([^)]+)\)/;
    const match = timeSlot.match(timeRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    return timeSlot;
  };

  // Open Google Maps with coordinates
  const openGoogleMaps = (coordinates, placeName) => {
    if (!coordinates && !placeName) {
      return;
    }
    
    // Use place name as destination when available, fall back to coordinates
    const destination = placeName || `${coordinates.latitude},${coordinates.longitude}`;
    
    // Use Google Maps directions with current location as starting point (live user location)
    const url = `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  // Get summary of the itinerary
  const getItinerarySummary = () => {
    if (!itineraryData) return "";
    
    const totalDays = itineraryData.duration || 
                     (itineraryData.itinerary ? `${itineraryData.itinerary.length} Days` : "");
    const highlights = [];
    
    // Extract key places
    if (itineraryData.itinerary) {
      itineraryData.itinerary.forEach(day => {
        if (day.dailyPlan && day.dailyPlan.length > 0) {
          // Take the first activity of each day as a highlight
          const highlight = day.dailyPlan[0].placeName;
          if (highlight && !highlights.includes(highlight)) {
            highlights.push(highlight);
          }
        }
      });
    }
    
    // Limit to 3 highlights
    const topHighlights = highlights.slice(0, 3).join(', ');
    
    return `${totalDays} of exploration in ${itineraryData.location || "your destination"} with visits to ${topHighlights || "beautiful places"}.`;
  };

  const handleImageLoad = (id) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [id]: 'loaded'
    }));
    // Add loaded class to the image element
    const img = document.querySelector(`img[data-image-id="${id}"]`);
    if (img) {
      img.classList.add('loaded');
    }
  };

  const handleImageError = (id, originalUrl) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [id]: 'error'
    }));
    return validatedUrls.get(originalUrl) || defaultIndiaImg;
  };

  // Use validated URLs in render with improved fallback handling and Google photos
  const getImageUrl = (originalUrl, placeName, category) => {
    if (!originalUrl && !placeName) return defaultIndiaImg;
    
    // First try to use Google Photos if available
    if (placeName && googlePhotos.has(placeName)) {
      return googlePhotos.get(placeName);
    }
    
    if (originalUrl && googlePhotos.has(originalUrl)) {
      return googlePhotos.get(originalUrl);
    }
    
    // If we have a validated version, use it
    if (validatedUrls.has(originalUrl)) {
      return validatedUrls.get(originalUrl);
    }
    
    // Check known problematic domains for immediate fallback
    if (originalUrl) {
      try {
        const urlObj = new URL(originalUrl);
        if (problemDomains.some(domain => urlObj.hostname.includes(domain))) {
          const fallback = getBestFallback(placeName, category);
          setTimeout(() => {
            setValidatedUrls(prev => new Map([...prev, [originalUrl, fallback]]));
          }, 0);
          return fallback;
        }
      } catch (e) {
        // Invalid URL format
        return getBestFallback(placeName, category);
      }
    }
    
    // For URLs that haven't been validated yet, check if they're valid
    if (originalUrl && (originalUrl.startsWith('http') || originalUrl.startsWith('/'))) {
      // Return the original URL but also trigger validation for next render
      setTimeout(() => {
        validateImageUrl(originalUrl, placeName, category).then(validUrl => {
          setValidatedUrls(prev => new Map([...prev, [originalUrl, validUrl]]));
        });
      }, 0);
      
      // For Wikipedia URLs, try to use a more reliable format
      if (originalUrl.includes('wikipedia.org')) {
        try {
          if (originalUrl.includes('/thumb/')) {
            const parts = originalUrl.split('/thumb/');
            if (parts.length === 2) {
              const filePath = parts[1].split('/')[0]; // Get the file name
              const smallerThumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${filePath}?width=800`;
              setTimeout(() => validateImageUrl(smallerThumb, placeName, category), 0);
              return smallerThumb;
            }
          }
        } catch (e) {
          console.warn('Error processing Wikipedia URL:', e);
        }
      }
      
      return originalUrl;
    }
    
    // Default fallback for invalid URLs
    return getBestFallback(placeName, category);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-blue-600 font-medium">Preparing your adventure...</p>
        </div>
      </div>
    );
  }

  if (!itineraryData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 bg-gradient-to-r from-red-50 to-orange-50">
        <h2 className="text-2xl font-bold text-red-600">No Itinerary Data Found</h2>
        <p className="mt-2 text-gray-600 text-center max-w-md">
          We couldn't find any itinerary data to display. Please go back and try generating a trip again.
        </p>
        <button 
          onClick={() => navigate('/create-trip')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
        >
          Back to Trip Creator
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen overflow-y-auto">
      {serverStatus === 'offline' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Image service is currently offline. Some location images may not be available.
          </p>
        </div>
      )}
      
      {/* Banner with primary location image */}
      <div className="relative h-80 md:h-[30rem] rounded-xl overflow-hidden mb-10 shadow-lg">
        {/* Always use default image instead of dynamic loading */}
        <img
          src={defaultIndiaImg}
          alt={itineraryData.location || "Destination"}
          className="w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 flex flex-col justify-end p-6 md:p-10 z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
            {itineraryData.travelPlanName || "Your Travel Itinerary"}
          </h1>
          
          {/* Trip summary */}
          <p className="text-white/90 text-base md:text-lg mb-4 max-w-2xl text-center ml-52">
            {getItinerarySummary()}
          </p>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/90">
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span>{itineraryData.location || "Destination"}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              <span>{itineraryData.duration || "Duration"}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">👥</span>
              <span>{itineraryData.travelerType || "Travelers"}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">💰</span>
              <span>{itineraryData.budget || "Budget"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Options Section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold border-b-2 border-blue-500 pb-2 inline-block">
            Recommended Accommodations
          </h2>
        </div>
        
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {itineraryData.hotels && itineraryData.hotels.map((hotel, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                  <Card 
                    className={`overflow-hidden hover:shadow-lg transition-shadow h-full ${hotel.geoCoordinates || hotel.hotelName ? 'cursor-pointer' : ''}`}
                    onClick={() => openGoogleMaps(hotel.geoCoordinates, hotel.hotelName)}
                  >
                    <div className="h-52 overflow-hidden relative">
                      <LoadingImage 
                        src={getImageUrl(hotel.imageUrl, hotel.hotelName, 'hotel')}
                        alt={hotel.hotelName}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      />
                      {hotel.geoCoordinates && (
                        <div className="absolute bottom-0 right-0 bg-white/80 p-1 rounded-tl-md">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-blue-800">{hotel.hotelName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{hotel.address}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-emerald-700">{hotel.price}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                          Rating: {hotel.rating}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-3 text-gray-700">{hotel.description}</p>
                      {hotel.geoCoordinates && (
                        <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                          <span>View on Maps</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
              <CarouselPrevious className="opacity-70 hover:opacity-100" />
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
              <CarouselNext className="opacity-70 hover:opacity-100" />
            </div>
          </Carousel>
          <div className="text-center text-sm text-gray-500 mt-4">
            <span>Swipe or use arrow buttons to see more hotels</span>
          </div>
        </div>
      </section>

      {/* Day selector tabs */}
      <div className="mb-8 bg-gray-50 p-2 rounded-lg overflow-x-auto flex">
        {itineraryData.itinerary && itineraryData.itinerary.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(day.day)}
            className={`py-2 px-6 rounded-lg font-medium focus:outline-none transition-colors whitespace-nowrap ${
              activeDay === day.day
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Day {day.day}
          </button>
        ))}
      </div>

      {/* Daily Itinerary Section */}
      <section>
        {itineraryData.itinerary && itineraryData.itinerary
          .filter(day => day.day === activeDay)
          .map((day, dayIndex) => (
          <div key={dayIndex} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                {day.day}
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-800">{day.theme}</h3>
                <p className="text-sm text-gray-500">{itineraryData.location}</p>
              </div>
            </div>
            
            {day.bestSeasonToVisitVegas && (
              <div className="bg-amber-50 p-4 rounded-lg mb-6 shadow-sm border border-amber-100">
                <div className="flex gap-2 items-center">
                  <span className="text-amber-600 text-lg">☀️</span>
                  <div>
                    <span className="font-medium text-amber-800">Best Time to Visit: </span>
                    <span className="text-amber-700">{day.bestSeasonToVisitVegas}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline view with improved layout */}
            <div className="relative md:pl-24 pl-12 border-l-2 border-blue-300 space-y-8 ml-4 md:ml-20">
              {day.dailyPlan && day.dailyPlan.map((activity, activityIndex) => (
                <div key={activityIndex} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-[14px] md:-left-[14.9vh] top-5 z-10"></div>
                  
                  {/* Time indicator - now positioned better for mobile */}
                  <div className="absolute -left-[11.8rem] top-4 w-20 text-right hidden md:block">
                    <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                      {formatTimeSlot(activity.timeSlot)}
                    </span>
                  </div>
                  
                  {/* Mobile time indicator */}
                  <div className="md:hidden text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full inline-block mb-2">
                    {formatTimeSlot(activity.timeSlot)}
                  </div>

                  <Card 
                    className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${activity.geoCoordinates || activity.placeName ? 'cursor-pointer' : ''}`}
                    onClick={() => openGoogleMaps(activity.geoCoordinates, activity.placeName)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-full overflow-hidden md:col-span-1 relative">
                        <LoadingImage 
                          src={getImageUrl(activity.placeImageUrl, activity.placeName)}
                          alt={activity.placeName}
                          className="w-full h-full object-cover md:h-60"
                        />
                        {activity.geoCoordinates && (
                          <div className="absolute bottom-3 right-3 bg-white/80 p-1.5 rounded-md shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-5 md:col-span-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-xl text-blue-800">{activity.placeName}</h4>
                            <p className="text-sm text-blue-600">{activity.timeSlot}</p>
                          </div>
                          {activity.ticketPricing && activity.ticketPricing !== "N/A" && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              {activity.ticketPricing}
                            </span>
                          )}
                        </div>
                        
                        <p className="my-3 text-gray-700">{activity.placeDetails}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          {activity.bestTimeToVisit && (
                            <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Best time: {activity.bestTimeToVisit}
                            </span>
                          )}
                          {activity.estimatedTravelTimeFromPrevious && activity.estimatedTravelTimeFromPrevious !== "N/A" && (
                            <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                              </svg>
                              Travel time: {activity.estimatedTravelTimeFromPrevious}
                            </span>
                          )}
                          {activity.rating && activity.rating !== "N/A" && (
                            <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                              </svg>
                              Rating: {activity.rating}
                            </span>
                          )}
                        </div>
                        
                        {activity.geoCoordinates && (
                          <div 
                            className="mt-4 inline-block py-1.5 px-3 bg-blue-50 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleMaps(activity.geoCoordinates, activity.placeName);
                            }}
                          >
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              View on Google Maps
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Notes Section */}
      {(itineraryData.budgetNotes || itineraryData.coupleFocusNotes) && (
        <section className="mt-16 p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Planning Notes & Tips</h2>
          
          {itineraryData.budgetNotes && (
            <div className="mb-6">
              <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                <span className="mr-2">💰</span>
                Budget Considerations
              </h3>
              <p className="text-gray-700 pl-7">{itineraryData.budgetNotes}</p>
            </div>
          )}
          
          {itineraryData.coupleFocusNotes && (
            <div>
              <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                <span className="mr-2">💑</span>
                For Couples
              </h3>
              <p className="text-gray-700 pl-7">{itineraryData.coupleFocusNotes}</p>
            </div>
          )}
        </section>
      )}

      {/* Back button */}
      <div className="mt-16 text-center">
        <button 
          onClick={() => navigate('/create-trip')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Plan Another Adventure
        </button>
      </div>
    </div>
  );
}

export default ViewDetails;