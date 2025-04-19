let loadPromise = null;

export const loadGoogleMaps = (apiKey) => {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // Create script only if not already present
    if (!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsCallback&loading=async`;
      script.async = true;
      script.defer = true;

      // Create a global callback
      window.__googleMapsCallback = () => {
        resolve(window.google.maps);
      };

      // Handle errors
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
        loadPromise = null; // Reset promise on error
      };

      document.head.appendChild(script);
    }
  });

  return loadPromise;
};