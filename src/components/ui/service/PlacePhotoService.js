/**
 * Service to fetch place photos from Google Places API
 */

// Cache mechanism to avoid duplicate requests
const photoCache = new Map();

// Flag to track if the server is available
let isServerAvailable = null; // Start with unknown status
let lastServerCheckTime = 0;
const SERVER_CHECK_INTERVAL = 10000; // 10 seconds
let checkPromise = null;

/**
 * Create a fetch request with timeout
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} - Promise that resolves to the fetch response
 */
const fetchWithTimeout = (url, timeout = 5000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a timeout that aborts the fetch
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, { signal })
    .finally(() => clearTimeout(timeoutId));
};

/**
 * Checks if the server is available
 * @returns {Promise<boolean>} - True if the server is available
 */
const checkServerAvailability = async () => {
  // If we have a check in progress, return that promise
  if (checkPromise) return checkPromise;
  
  // Don't check too frequently
  const now = Date.now();
  if (isServerAvailable !== null && now - lastServerCheckTime < SERVER_CHECK_INTERVAL) {
    return isServerAvailable;
  }
  
  // Create a new check promise
  checkPromise = new Promise(async (resolve) => {
    try {
      console.log("Checking server availability...");
      const response = await fetchWithTimeout('http://localhost:5000/', 2000);
      const data = await response.json();
      const newStatus = response.ok && data.status === "healthy";
      
      console.log(`Server status: ${newStatus ? 'available' : 'unavailable'}, message: ${data.message}`);
      isServerAvailable = newStatus;
      lastServerCheckTime = now;
      resolve(newStatus);
    } catch (error) {
      console.warn('Place photos server appears to be offline:', error.message);
      isServerAvailable = false;
      lastServerCheckTime = now;
      resolve(false);
    } finally {
      // Clear the promise after a short delay
      setTimeout(() => { checkPromise = null; }, 100);
    }
  });
  
  return checkPromise;
};

/**
 * Fetches a photo for a place from the Google Places API
 * @param {string} placeName - The name of the place to fetch a photo for
 * @returns {Promise<string>} - A promise that resolves to the photo URL
 */
export const fetchPlacePhoto = async (placeName) => {
  // If we have a cached result, return it immediately
  if (photoCache.has(placeName)) {
    return photoCache.get(placeName);
  }
  
  // Check if server is available before making any requests
  if (isServerAvailable === null) {
    // First time check
    await checkServerAvailability();
  }
  
  // Skip the API call if the server is known to be unavailable
  if (isServerAvailable === false) {
    console.log(`Server unavailable, skipping photo fetch for: ${placeName}`);
    return null;
  }
  
  try {
    // Add location or landmark keywords for better results
    const enrichedQuery = placeName.toLowerCase().includes('hotel') 
      ? placeName 
      : `${placeName} landmark`;
    
    const response = await fetchWithTimeout(
      `http://localhost:5000/place-photos?query=${encodeURIComponent(enrichedQuery)}`,
      5000
    );
    
    if (!response.ok) {
      // If we get a 404 or 500, the server is running but there's an issue with the API
      if (response.status === 404 || response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`API error: ${errorData.message || response.statusText}`);
      }
      throw new Error(`Failed to fetch place photo: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.photoUrl) {
      // Cache the result
      photoCache.set(placeName, data.photoUrl);
      return data.photoUrl;
    } else {
      console.warn(`No photo found for ${placeName}: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    // Mark server as unavailable on connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch') || 
        error.name === 'AbortError') {
      isServerAvailable = false;
      lastServerCheckTime = Date.now();
    }
    console.error('Error fetching place photo:', error);
    return null;
  }
};

/**
 * Clear the photo cache
 */
export const clearPhotoCache = () => {
  photoCache.clear();
}; 