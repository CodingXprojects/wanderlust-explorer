import axios from 'axios';
import { getCache, setCache } from '../utils/localStorage';

// --- Development Mode ---
// Set to true if you want to use environment variables for development
// Set to false if you want to use production environment variables
const DEV_MODE = true;

// --- Amadeus API Configuration --- 
// Environment variables are now used instead of hardcoded values
const getEnvVariable = (key, defaultValue = '') => {
  try {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
    // For Create React App
    if (typeof window !== 'undefined' && window.ENV_VARS) {
      return window.ENV_VARS[key] || defaultValue;
    }
    // For Node.js environments (if applicable)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch (e) {
    console.warn(`Error accessing env variable ${key}:`, e);
  }
  // Fallback for development
  return defaultValue;
};

// Use environment variables for API credentials
const AMADEUS_API_KEY = getEnvVariable('VITE_AMADEUS_API_KEY', '');
const AMADEUS_API_SECRET = getEnvVariable('VITE_AMADEUS_API_SECRET', '');

// Amadeus API URLs (confirm these are correct for testing/production)
const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_FLIGHT_OFFERS_URL = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
// Use https://api.amadeus.com/... for production environment

// --- Airline Details (Placeholder - Expand or use API) --- 
const airlineDetails = {
    // You'll need to populate this based on IATA codes returned by Amadeus
    // Example: 
    'AI': { name: 'Air India', logo: '/logos/ai.png' }, 
    '6E': { name: 'IndiGo', logo: '/logos/6e.png' },
    'UK': { name: 'Vistara', logo: '/logos/uk.png' }, 
    'SG': { name: 'SpiceJet', logo: '/logos/sg.png' }, 
    // Add more...
};

// --- Helper Functions --- 

// Format duration from ISO 8601 duration format (e.g., PT2H30M)
const formatISODuration = (isoDuration) => {
    if (!isoDuration || !isoDuration.startsWith('PT')) return 'N/A';
    const time = isoDuration.substring(2);
    let hours = 0;
    let minutes = 0;
    const hourMatch = time.match(/(\d+)H/);
    const minuteMatch = time.match(/(\d+)M/);
    if (hourMatch) hours = parseInt(hourMatch[1], 10);
    if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);
    if (hours === 0 && minutes === 0) return 'N/A';
    return `${hours}h ${minutes}m`;
};

// Check if Amadeus API is properly configured
export const isApiConfigured = async () => {
    // First, check if credentials are available
    if (
        (DEV_MODE && (AMADEUS_API_KEY === 'xxx' || AMADEUS_API_SECRET === 'xxx')) || 
        (!DEV_MODE && (!AMADEUS_API_KEY || !AMADEUS_API_SECRET))
    ) {
        console.warn('[API Check] API credentials not configured');
        return false;
    }
    
    // Try to get a token to verify credentials are valid
    try {
        await getAmadeusToken();
        console.log('[API Check] API credentials are valid');
        return true;
    } catch (error) {
        console.error('[API Check] API credentials invalid:', error.message);
        return false;
    }
};

// --- Amadeus Authentication --- 

// Store token in memory (simple approach)
// For production, consider more robust storage or state management
let amadeusToken = null;
let tokenExpiryTime = 0;

const getAmadeusToken = async () => {
    const now = Date.now();
    // Return cached token if valid (with a small buffer)
    if (amadeusToken && tokenExpiryTime > now + 60 * 1000) { 
        console.log('[Amadeus Auth] Using cached token');
        return amadeusToken;
    }

    console.log('[Amadeus Auth] Fetching new token...');
    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
        console.error("[Amadeus Auth] Missing API Key or Secret in .env");
        throw new Error("API authentication credentials missing.");
    }

    try {
        const response = await axios.post(
            AMADEUS_AUTH_URL,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: AMADEUS_API_KEY,
                client_secret: AMADEUS_API_SECRET
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const tokenData = response.data;
        if (!tokenData.access_token || !tokenData.expires_in) {
            throw new Error("Invalid token response structure");
        }

        amadeusToken = tokenData.access_token;
        // Set expiry time (response gives seconds, convert to ms) with a buffer
        tokenExpiryTime = now + (tokenData.expires_in * 1000); 
        console.log('[Amadeus Auth] New token obtained');
        return amadeusToken;

    } catch (error) {
        console.error("[Amadeus Auth] Error fetching token:", error.response?.data || error.message);
        amadeusToken = null; // Invalidate token on error
        tokenExpiryTime = 0;
        throw new Error(`Amadeus authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
};

// --- Helper for analyzing API response (During Development Only) ---
const analyzeAmadeusResponse = (response) => {
  // This function will help you understand the exact response structure
  if (!response || !response.data) {
    console.error('Invalid Amadeus response to analyze');
    return;
  }

  // Check the top-level structure
  const keysAtRoot = Object.keys(response.data);
  console.log('[Amadeus Analysis] Top-level response keys:', keysAtRoot);

  // Check the data array (flight offers)
  if (response.data.data && Array.isArray(response.data.data)) {
    const firstOffer = response.data.data[0];
    console.log('[Amadeus Analysis] Number of flight offers:', response.data.data.length);
    
    if (firstOffer) {
      console.log('[Amadeus Analysis] First offer keys:', Object.keys(firstOffer));
      
      // Price info
      if (firstOffer.price) {
        console.log('[Amadeus Analysis] Price structure:', firstOffer.price);
      }
      
      // Check itineraries (outbound and possibly return flights)
      if (firstOffer.itineraries && firstOffer.itineraries.length > 0) {
        console.log('[Amadeus Analysis] Number of itineraries in first offer:', firstOffer.itineraries.length);
        
        const firstItinerary = firstOffer.itineraries[0];
        console.log('[Amadeus Analysis] First itinerary keys:', Object.keys(firstItinerary));
        
        // Check segments (each flight segment, there might be multiple for connecting flights)
        if (firstItinerary.segments && firstItinerary.segments.length > 0) {
          console.log('[Amadeus Analysis] Number of segments in first itinerary:', firstItinerary.segments.length);
          console.log('[Amadeus Analysis] First segment structure:', firstItinerary.segments[0]);
        }
      }
    }
  }
  
  // Analyze dictionaries for carrier names, aircraft, locations
  if (response.data.dictionaries) {
    console.log('[Amadeus Analysis] Dictionaries:', response.data.dictionaries);
  }
  
  console.log('[Amadeus Analysis] Full first offer (for detailed debugging):', response.data.data[0] || 'No offers found');
};

// --- Main Flight Search Function (using Amadeus) --- 

export const searchFlights = async (searchParams) => {
    const { origin, destination, departureDate, returnDate, passengers } = searchParams;

    // --- Input Validation --- 
    if (!origin || !destination || !departureDate || !passengers) {
        console.error("Search validation failed: Missing parameters", searchParams);
        throw new Error("Please provide Origin, Destination, Departure Date, and Passenger count.");
    }
    
    // --- Caching (Optional but Recommended) --- 
    const cacheKey = `amadeus_flights_${origin}_${destination}_${departureDate}_${returnDate || ''}_${passengers}`;
    const cacheTTL = 15 * 60 * 1000; // 15 minutes

    const cachedData = getCache(cacheKey);
    if (cachedData) {
        console.log('Returning cached Amadeus flight data');
        return cachedData;
    }
    console.log('No cache found or expired, fetching fresh Amadeus data...');

    // --- API Call Logic --- 
    try {
        const token = await getAmadeusToken();

        // --- Prepare Amadeus API Parameters --- 
        // **CONSULT AMADEUS DOCUMENTATION for exact parameter names and formats**
        const amadeusParams = {
            originLocationCode: origin,        // e.g., "DEL"
            destinationLocationCode: destination, // e.g., "BOM"
            departureDate: departureDate,      // Expects "YYYY-MM-DD"
            adults: passengers,
            currencyCode: 'INR',               // Request pricing in INR
            max: 25,                           // Max number of flight offers (adjust as needed)
            // Optional: 
            // returnDate: returnDate,          // Add if it's a round trip ("YYYY-MM-DD")
            // nonStop: true,                   // To get only direct flights
            // travelClass: 'ECONOMY',        // e.g., ECONOMY, BUSINESS
            // includedAirlineCodes: 'AI,6E', // Only include specific airlines
            // excludedAirlineCodes: '...', 
        };
        
        // Remove null/undefined params
        Object.keys(amadeusParams).forEach(key => (amadeusParams[key] == null) && delete amadeusParams[key]);

        console.log('[Amadeus API] Calling Flight Offers Search with params:', amadeusParams);

        // --- Make the Flight Offers Search API Call --- 
        const response = await axios.get(AMADEUS_FLIGHT_OFFERS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: amadeusParams
        });

        console.log('[Amadeus API] Response received');
        
        // Add this line to analyze the response structure
        analyzeAmadeusResponse(response);

        // **Error/Empty check Amadeus response**
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            console.warn('[Amadeus API] No flight offers found in response', response.data);
            // Cache the empty result to avoid repeated calls for same params
            setCache(cacheKey, [], cacheTTL); 
            return []; // Return empty array if no flights found
        }

        // --- Data Mapping (Placeholder - MUST be adapted) --- 
        // This mapping is a GUESS based on common structures. 
        // **You MUST inspect the actual Amadeus response.data and response.data.dictionaries**
        const flightOffers = response.data.data;
        const dictionaries = response.data.dictionaries; // Contains carrier codes, aircraft codes, etc.

        const combinedFlights = flightOffers.map(offer => {
            try {
                // --- Extract details for the first itinerary/segment (simplistic assumption) ---
                // Amadeus responses can be complex with multiple itineraries/segments
                const itinerary = offer.itineraries?.[0]; 
                const segment = itinerary?.segments?.[0]; 
                const priceInfo = offer.price;
                
                if (!itinerary || !segment || !priceInfo) {
                    console.warn("Skipping offer due to missing itinerary/segment/price:", offer);
                    return null; 
                }
                
                const airlineCode = segment.carrierCode;
                const flightNumber = segment.number;
                const departureAirport = segment.departure?.iataCode;
                const arrivalAirport = segment.arrival?.iataCode;
                const departureTimestamp = segment.departure?.at; // ISO DateTime String
                const arrivalTimestamp = segment.arrival?.at;   // ISO DateTime String
                const durationISO = itinerary.duration; // e.g., "PT5H20M"
                
                // --- Get Airline Name from Dictionary (Example) ---
                // Adjust based on actual dictionary structure
                const airlineNameFromDict = dictionaries?.carriers?.[airlineCode] || airlineCode; 
                const airlineData = airlineDetails[airlineCode] || { name: airlineNameFromDict, logo: null };

                // --- Validate essential data --- 
                if (!airlineCode || !departureAirport || !arrivalAirport || !departureTimestamp || !arrivalTimestamp || !priceInfo.total) {
                     console.warn("Skipping offer due to missing essential data fields:", offer);
                     return null;
                }

                const departureTime = new Date(departureTimestamp);
                const arrivalTime = new Date(arrivalTimestamp);

                // **Booking Link:** Amadeus usually doesn't provide direct booking links in free tier.
                // You might need to construct a search URL for the airline's website or a partner.
                // For now, setting to null.
                const bookingLink = null; 

                return {
                    id: offer.id, // Amadeus offer ID is a good unique key
                    airlineName: airlineData.name,
                    airlineLogo: airlineData.logo,
                    departureAirport: departureAirport,
                    arrivalAirport: arrivalAirport,
                    departureTime: departureTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
                    arrivalTime: arrivalTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
                    duration: formatISODuration(durationISO),
                    price: parseFloat(priceInfo.total), // Price should be a number
                    bookingLink: bookingLink, // Will be null or a constructed link
                    // Add raw data for sorting/filtering if needed
                    rawDepartureUTC: departureTime.getTime(), 
                    // Calculate raw duration in seconds if needed from ISO
                    // rawDurationSeconds: ... 
                    stops: itinerary.segments.length - 1, // Number of stops
                };
            } catch (mapError) {
                console.error("Error mapping Amadeus offer:", offer, mapError);
                return null; // Skip offer if mapping fails
            }
        }).filter(flight => flight !== null); // Remove any skipped/failed offers

        // --- Sorting --- 
        combinedFlights.sort((a, b) => a.price - b.price); // Default sort by price

        // --- Caching Result --- 
        setCache(cacheKey, combinedFlights, cacheTTL);

        console.log("Processed and returning Amadeus flights:", combinedFlights);
        return combinedFlights;

    } catch (error) {
        // Handle errors from token fetching or API call
        console.error("Error during Amadeus flight search or processing:", error);
        // Don't cache errors
        // Check if it's an Axios error for more details
        if (axios.isAxiosError(error) && error.response) {
             console.error("Amadeus API Error Response Data:", error.response.data);
             // Construct a message from Amadeus error structure if available
             const amadeusErrors = error.response.data?.errors;
             let message = `Amadeus API Error (${error.response.status}): `;
             if (amadeusErrors && amadeusErrors.length > 0) {
                 message += amadeusErrors.map(e => `(${e.code}) ${e.title} - ${e.detail || ''}`).join('; ');
             } else {
                 message += (error.message || 'Failed to fetch data.');
             }
             throw new Error(message);
        } else if (error.message.includes("authentication failed")) { 
            // Catch token specific errors
            throw error; 
        } else {
             // Other errors
             throw new Error(error.message || 'An unexpected error occurred while searching flights.');
        }
    }
};

// --- Airport Autocomplete Function (Remains the same for now) --- 

export const fetchAirportSuggestions = async (query) => {
    console.log(`[Static List] Fetching airport suggestions for: ${query}`);
    // Using a static list of airports
    const airports = [
        // Major Indian Airports
        { iata: "DEL", name: "Indira Gandhi International Airport", city: "Delhi" },
        { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai" },
        { iata: "BLR", name: "Kempegowda International Airport", city: "Bengaluru" },
        { iata: "MAA", name: "Chennai International Airport", city: "Chennai" },
        { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad" },
        { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata" },
        { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad" },
        { iata: "PNQ", name: "Pune Airport", city: "Pune" },
        { iata: "GOI", name: "Goa International Airport (Dabolim)", city: "Goa" },
        { iata: "COK", name: "Cochin International Airport", city: "Kochi" },
        { iata: "JAI", name: "Jaipur International Airport", city: "Jaipur" },
        { iata: "LKO", name: "Chaudhary Charan Singh International Airport", city: "Lucknow" },
        { iata: "GAU", name: "Lokpriya Gopinath Bordoloi International Airport", city: "Guwahati" },
        { iata: "TRV", name: "Trivandrum International Airport", city: "Thiruvananthapuram" },
        { iata: "BBI", name: "Biju Patnaik International Airport", city: "Bhubaneswar" },
        // Additional Indian Airports
        { iata: "IXC", name: "Chandigarh International Airport", city: "Chandigarh" },
        { iata: "PAT", name: "Jay Prakash Narayan International Airport", city: "Patna" },
        { iata: "IXR", name: "Birsa Munda Airport", city: "Ranchi" },
        { iata: "SXR", name: "Sheikh ul-Alam International Airport", city: "Srinagar" },
        { iata: "IXB", name: "Bagdogra Airport", city: "Siliguri" },
        { iata: "VNS", name: "Lal Bahadur Shastri International Airport", city: "Varanasi" },
        { iata: "IXJ", name: "Jammu Airport", city: "Jammu" },
        { iata: "IXL", name: "Kushok Bakula Rimpochee Airport", city: "Leh" },
        { iata: "ATQ", name: "Sri Guru Ram Dass Jee International Airport", city: "Amritsar" },
        { iata: "DIU", name: "Diu Airport", city: "Diu" },
        { iata: "IXZ", name: "Veer Savarkar International Airport", city: "Port Blair" },
        { iata: "IDR", name: "Devi Ahilya Bai Holkar Airport", city: "Indore" },
        { iata: "UDR", name: "Maharana Pratap Airport", city: "Udaipur" },
        { iata: "JDH", name: "Jodhpur Airport", city: "Jodhpur" },
        { iata: "IXA", name: "Maharaja Bir Bikram Airport", city: "Agartala" },
        { iata: "IMF", name: "Imphal International Airport", city: "Imphal" },
        { iata: "RPR", name: "Swami Vivekananda Airport", city: "Raipur" },
        { iata: "NAG", name: "Dr. Babasaheb Ambedkar International Airport", city: "Nagpur" },
        { iata: "VGA", name: "Vijayawada Airport", city: "Vijayawada" },
        { iata: "IXM", name: "Madurai Airport", city: "Madurai" },
        // More Indian Regional Airports
        { iata: "CJB", name: "Coimbatore International Airport", city: "Coimbatore" },
        { iata: "IXE", name: "Mangalore International Airport", city: "Mangalore" },
        { iata: "TRZ", name: "Tiruchirappalli International Airport", city: "Tiruchirappalli" },
        { iata: "GAY", name: "Gaya Airport", city: "Gaya" },
        { iata: "DED", name: "Dehradun Airport", city: "Dehradun" },
        { iata: "IXD", name: "Allahabad Airport", city: "Prayagraj" },
        { iata: "VTZ", name: "Visakhapatnam International Airport", city: "Visakhapatnam" },
        { iata: "BDQ", name: "Vadodara Airport", city: "Vadodara" },
        { iata: "IXS", name: "Silchar Airport", city: "Silchar" },
        { iata: "IXU", name: "Aurangabad Airport", city: "Aurangabad" },
        { iata: "BHO", name: "Raja Bhoj Airport", city: "Bhopal" },
        { iata: "GOP", name: "Gorakhpur Airport", city: "Gorakhpur" },
        { iata: "IXY", name: "Kandla Airport", city: "Gandhidham" },
        { iata: "JRH", name: "Jorhat Airport", city: "Jorhat" },
        { iata: "IXI", name: "North Lakhimpur Airport", city: "Lilabari" },
        { iata: "IXW", name: "Jamshedpur Airport", city: "Jamshedpur" },
        { iata: "KLH", name: "Kolhapur Airport", city: "Kolhapur" },
        { iata: "KQH", name: "Kishangarh Airport", city: "Ajmer" },
        { iata: "IXG", name: "Belgaum Airport", city: "Belgaum" },
        { iata: "HBX", name: "Hubli Airport", city: "Hubli" },
        { iata: "MYQ", name: "Mysore Airport", city: "Mysore" },
        { iata: "RJA", name: "Rajahmundry Airport", city: "Rajahmundry" },
        { iata: "IXZ", name: "Veer Savarkar International Airport", city: "Port Blair" },
        { iata: "IXP", name: "Pathankot Airport", city: "Pathankot" },
        { iata: "PUT", name: "Sri Sathya Sai Airport", city: "Puttaparthi" },
        { iata: "RAJ", name: "Rajkot Airport", city: "Rajkot" },
        { iata: "STV", name: "Surat Airport", city: "Surat" },
        { iata: "TEZ", name: "Tezpur Airport", city: "Tezpur" },
        { iata: "TIR", name: "Tirupati Airport", city: "Tirupati" },
        { iata: "TCR", name: "Tuticorin Airport", city: "Tuticorin" },
        { iata: "VDY", name: "Vidyanagar Airport", city: "Vidyanagar" },
        { iata: "IXH", name: "Kailashahar Airport", city: "Kailashahar" },
        { iata: "IXK", name: "Keshod Airport", city: "Keshod" },
        { iata: "IXQ", name: "Kamalpur Airport", city: "Kamalpur" },
        { iata: "IXV", name: "Along Airport", city: "Along" },
        { iata: "RGH", name: "Balurghat Airport", city: "Balurghat" },
        { iata: "CNN", name: "Kannur International Airport", city: "Kannur" },
        { iata: "SAG", name: "Shirdi Airport", city: "Shirdi" },
        { iata: "NMB", name: "Daman Airport", city: "Daman" },
        { iata: "DHM", name: "Kangra Airport", city: "Dharamshala" },
        { iata: "BHJ", name: "Bhuj Airport", city: "Bhuj" },
        { iata: "PGH", name: "Pantnagar Airport", city: "Pantnagar" },
        { iata: "DIB", name: "Dibrugarh Airport", city: "Dibrugarh" },
        { iata: "DMU", name: "Dimapur Airport", city: "Dimapur" },
        { iata: "AGX", name: "Agatti Airport", city: "Agatti Island" },
        { iata: "PYB", name: "Jeypore Airport", city: "Jeypore" },
        { iata: "PYG", name: "Pakyong Airport", city: "Gangtok" },
        { iata: "ZER", name: "Zero Airport", city: "Zero" },
        // Major International Airports
        { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York" },
        { iata: "LHR", name: "Heathrow Airport", city: "London" },
        { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris" },
        { iata: "DXB", name: "Dubai International Airport", city: "Dubai" },
        { iata: "SIN", name: "Changi Airport", city: "Singapore" },
        { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong" },
        { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt" },
        { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam" },
        { iata: "SYD", name: "Sydney Airport", city: "Sydney" },
        { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles" },
        { iata: "ORD", name: "O'Hare International Airport", city: "Chicago" },
        { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok" },
        { iata: "ICN", name: "Incheon International Airport", city: "Seoul" },
        { iata: "MEL", name: "Melbourne Airport", city: "Melbourne" },
        { iata: "BCN", name: "Josep Tarradellas Barcelona-El Prat Airport", city: "Barcelona" },
        { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid" },
        { iata: "FCO", name: "Leonardo da Vinci International Airport", city: "Rome" },
        { iata: "MUC", name: "Munich Airport", city: "Munich" },
        { iata: "ZRH", name: "Zurich Airport", city: "Zurich" },
        { iata: "IST", name: "Istanbul Airport", city: "Istanbul" },
        { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur" },
        { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto" },
        { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo" },
        { iata: "JNB", name: "O. R. Tambo International Airport", city: "Johannesburg" },
        { iata: "NRT", name: "Narita International Airport", city: "Tokyo" },
        { iata: "HND", name: "Haneda Airport", city: "Tokyo" },
        { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing" },
        { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai" }
    ];

    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase();
    return airports.filter(
        (airport) =>
            airport.iata.toLowerCase().includes(lowerCaseQuery) ||
            airport.name.toLowerCase().includes(lowerCaseQuery) ||
            airport.city.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 20); // Increased result limit from 15 to 20 to accommodate more results
};

// ---