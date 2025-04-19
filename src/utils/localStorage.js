// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Flag indicating if we can use localStorage
const canUseStorage = isLocalStorageAvailable();

/**
 * Sets an item in localStorage with an expiry time.
 * @param {string} key The key for the localStorage item.
 * @param {any} value The value to store (will be JSON.stringify'd).
 * @param {number} ttl Time To Live in milliseconds. If 0 or undefined, stores indefinitely.
 */
export const setCache = (key, value, ttl) => {
  if (!canUseStorage) {
    console.warn("localStorage is not available, caching disabled");
    return;
  }

  const now = new Date();
  const item = {
    value: value,
    expiry: ttl ? now.getTime() + ttl : null, // Store expiry timestamp or null
  };
  try {
    localStorage.setItem(key, JSON.stringify(item));
    console.log(`Cache set for key "${key}" with TTL ${ttl ? ttl + 'ms' : 'none'}`);
  } catch (error) {
    console.error("Error setting localStorage cache:", error);
    // Handle potential storage full errors (e.g., clear old cache)
    // clearExpiredCache(); // Optional: attempt to clear space
  }
};

/**
 * Gets an item from localStorage, checking for expiry.
 * @param {string} key The key for the localStorage item.
 * @returns {any | null} The stored value if found and not expired, otherwise null.
 */
export const getCache = (key) => {
  if (!canUseStorage) {
    console.warn("localStorage is not available, cache retrieval disabled");
    return null;
  }

  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    // Check if item has expired
    if (item.expiry && now.getTime() > item.expiry) {
      console.log(`Cache expired for key "${key}", removing.`);
      localStorage.removeItem(key); // Clean up expired item
      return null;
    }

    console.log(`Cache hit for key "${key}"`);
    return item.value;
  } catch (error) {
    console.error("Error getting localStorage cache:", error);
    return null; // Return null on parsing errors or other issues
  }
};

/**
 * Removes an item from localStorage.
 * @param {string} key The key of the item to remove.
 */
export const removeCache = (key) => {
  if (!canUseStorage) {
    console.warn("localStorage is not available, cache removal disabled");
    return;
  }

  try {
    localStorage.removeItem(key);
    console.log(`Cache removed for key "${key}"`);
  } catch (error) {
    console.error("Error removing localStorage cache:", error);
  }
};

/**
 * Clears all expired items from localStorage (optional utility).
 */
export const clearExpiredCache = () => {
    if (!canUseStorage) {
      console.warn("localStorage is not available, expired cache cleanup disabled");
      return;
    }

    console.log("Attempting to clear expired cache items...");
    const now = new Date().getTime();
    let itemsCleared = 0;
    try {
        Object.keys(localStorage).forEach((key) => {
            try {
                 const itemStr = localStorage.getItem(key);
                 if (itemStr) {
                     const item = JSON.parse(itemStr);
                     // Check if the item structure includes an expiry field
                     if (item && typeof item === 'object' && item.hasOwnProperty('expiry') && item.expiry !== null) {
                          if (now > item.expiry) {
                              localStorage.removeItem(key);
                              itemsCleared++;
                              console.log(`Cleared expired item: "${key}"`);
                          }
                     }
                 }
            } catch (parseError) {
                // Ignore keys that aren't JSON or don't match the expected structure
                // console.warn(`Could not parse localStorage item "${key}":`, parseError);
            }
        });
        console.log(`Expired cache cleanup complete. Cleared ${itemsCleared} items.`);
    } catch (error) {
        console.error("Error during expired cache cleanup:", error);
    }
};

// Optional: Run cleanup periodically or on app load
// clearExpiredCache(); 