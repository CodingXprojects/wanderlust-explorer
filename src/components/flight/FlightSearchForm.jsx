import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAirportSuggestions } from '../../services/flightApi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { debounce } from 'lodash'; // Use lodash debounce
import ReactDOM from 'react-dom';

// Add custom styles for the datepicker
const datepickerStyles = `
  .react-datepicker {
    font-family: 'Arial', sans-serif;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    background-color: white;
    z-index: 9999 !important;
  }
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__header {
    background-color: #f0f9ff;
    border-bottom: 1px solid #ddd;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    padding-top: 0.8rem;
  }
  .react-datepicker__current-month {
    font-weight: bold;
    color: #1e3a8a;
  }
  .react-datepicker__day-name, .react-datepicker__day {
    color: #333;
    width: 2rem;
    line-height: 2rem;
    margin: 0.2rem;
  }
  .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
    background-color: #3b82f6;
    color: white;
    border-radius: 0.3rem;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #93c5fd;
    color: white;
  }
  .react-datepicker__day:hover {
    background-color: #dbeafe;
    border-radius: 0.3rem;
  }
  .react-datepicker__triangle {
    border-bottom-color: #f0f9ff !important;
  }
  .react-datepicker__navigation {
    top: 1rem;
  }
  .react-datepicker__navigation--previous {
    border-right-color: #1e3a8a;
  }
  .react-datepicker__navigation--next {
    border-left-color: #1e3a8a;
  }
  .react-datepicker__day--today {
    font-weight: bold;
    color: #3b82f6;
  }
  .react-datepicker__day--disabled {
    color: #ccc;
  }
  .react-datepicker__month-container {
    float: left;
    background: white;
  }
  
  /* Fix for z-index issues */
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  
  /* Custom styling for portal-based elements */
  .suggestion-portal {
    position: fixed;
    z-index: 9999;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    min-width: 250px;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
  }
`;

// Portal component for suggestions
const SuggestionPortal = ({ children, targetRect }) => {
    const el = document.createElement('div');
    el.className = 'suggestion-portal';
    
    useEffect(() => {
        document.body.appendChild(el);
        
        // Position the portal to the right side of the input field
        if (targetRect) {
            el.style.top = `${targetRect.top + window.scrollY}px`;
            el.style.left = `${targetRect.right + window.scrollX -80}px`; // 10px gap between input and suggestions
            el.style.minWidth = '250px';
            el.style.maxWidth = '350px';
            el.style.maxHeight = '400px';
            el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            el.style.borderRadius = '8px';
            el.style.border = '1px solid #e5e7eb';
            el.style.zIndex = '9999';
        }
        
        return () => {
            document.body.removeChild(el);
        };
    }, [targetRect]);
    
    return ReactDOM.createPortal(children, el);
};

// Add a style for the suggestion portal
const portalStyles = `
  .suggestion-portal {
    position: fixed !important;
    z-index: 9999 !important;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    animation: fadeIn 0.2s ease-in-out;
    overflow-y: auto;
    max-height: 400px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .suggestion-portal ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  
  .suggestion-portal li {
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .suggestion-portal li:hover {
    background-color: #f3f4f6;
  }
`;

const FlightSearchForm = ({ onSearch, initialParams, isLoading, disabled }) => {
    const [origin, setOrigin] = useState(initialParams?.origin || '');
    const [destination, setDestination] = useState(initialParams?.destination || '');
    const [departureDate, setDepartureDate] = useState(initialParams?.departureDate ? new Date(initialParams.departureDate) : new Date());
    const [returnDate, setReturnDate] = useState(initialParams?.returnDate ? new Date(initialParams.returnDate) : null);
    const [passengers, setPassengers] = useState(initialParams?.passengers || 1);
    const [isRoundTrip, setIsRoundTrip] = useState(!!initialParams?.returnDate);
    
    // References for input elements
    const originInputRef = useRef(null);
    const destInputRef = useRef(null);
    
    // Origin airport suggestions
    const [originInput, setOriginInput] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
    const [isOriginLoading, setIsOriginLoading] = useState(false);
    const [originInputRect, setOriginInputRect] = useState(null);
    
    // Destination airport suggestions
    const [destInput, setDestInput] = useState('');
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showDestSuggestions, setShowDestSuggestions] = useState(false);
    const [isDestLoading, setIsDestLoading] = useState(false);
    const [destInputRect, setDestInputRect] = useState(null);
    
    // Log initial load to check API service
    useEffect(() => {
        console.log("FlightSearchForm mounted, testing airport API");
        const testAPI = async () => {
            try {
                const testResult = await fetchAirportSuggestions("New");
                console.log("API Test result:", testResult);
            } catch (error) {
                console.error("API test failed:", error);
            }
        };
        testAPI();
    }, []);

    // Store element rectangles for positioning portals
    const updateOriginRect = () => {
        if (originInputRef.current) {
            setOriginInputRect(originInputRef.current.getBoundingClientRect());
        }
    };
    
    const updateDestRect = () => {
        if (destInputRef.current) {
            setDestInputRect(destInputRef.current.getBoundingClientRect());
        }
    };

    // Debounced fetch for origin
    const debouncedFetchOrigin = useCallback(
        debounce(async (query) => {
            if (query.length > 1) {
                setIsOriginLoading(true);
                console.log("Fetching origin airports for:", query);
                try {
                    const results = await fetchAirportSuggestions(query);
                    console.log("Origin results:", results);
                    setOriginSuggestions(results);
                    setShowOriginSuggestions(true);
                    updateOriginRect();
                } catch (error) {
                    console.error("Error fetching origin airports:", error);
                    setOriginSuggestions([]);
                } finally {
                    setIsOriginLoading(false);
                }
            } else {
                setOriginSuggestions([]);
                setShowOriginSuggestions(false);
            }
        }, 300),
        []
    );
    
    // Debounced fetch for destination
    const debouncedFetchDest = useCallback(
        debounce(async (query) => {
            if (query.length > 1) {
                setIsDestLoading(true);
                console.log("Fetching destination airports for:", query);
                try {
                    const results = await fetchAirportSuggestions(query);
                    console.log("Destination results:", results);
                    setDestSuggestions(results);
                    setShowDestSuggestions(true);
                    updateDestRect();
                } catch (error) {
                    console.error("Error fetching destination airports:", error);
                    setDestSuggestions([]);
                } finally {
                    setIsDestLoading(false);
                }
            } else {
                setDestSuggestions([]);
                setShowDestSuggestions(false);
            }
        }, 300),
        []
    );

    // Handle origin input change
    const handleOriginChange = (e) => {
        const query = e.target.value;
        setOriginInput(query);
        setOrigin(''); // Clear the IATA code when typing
        debouncedFetchOrigin(query);
    };
    
    // Handle destination input change
    const handleDestChange = (e) => {
        const query = e.target.value;
        setDestInput(query);
        setDestination(''); // Clear the IATA code when typing
        debouncedFetchDest(query);
    };
    
    // Handle origin suggestion click
    const handleOriginSuggestionClick = (airport) => {
        console.log("Selected origin airport:", airport);
        setOriginInput(`${airport.city} (${airport.iata})`);
        setOrigin(airport.iata);
        setShowOriginSuggestions(false);
        setOriginSuggestions([]);
    };
    
    // Handle destination suggestion click
    const handleDestSuggestionClick = (airport) => {
        console.log("Selected destination airport:", airport);
        setDestInput(`${airport.city} (${airport.iata})`);
        setDestination(airport.iata);
        setShowDestSuggestions(false);
        setDestSuggestions([]);
    };

    // Format date to YYYY-MM-DD for API calls
    const formatDate = (date) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!origin || !destination || !departureDate) {
            alert('Please fill in Origin, Destination, and Departure Date.');
            return;
        }
        onSearch({
            origin, 
            destination, 
            departureDate: formatDate(departureDate), 
            returnDate: isRoundTrip ? formatDate(returnDate) : null, 
            passengers
        });
    };

    useEffect(() => {
        console.log("initialParams changed:", initialParams);
        // Sync state if initialParams change (e.g., navigating back)
        setOrigin(initialParams?.origin || '');
        setDestination(initialParams?.destination || '');
        setDepartureDate(initialParams?.departureDate ? new Date(initialParams.departureDate) : new Date());
        const initialReturn = initialParams?.returnDate ? new Date(initialParams.returnDate) : null;
        setReturnDate(initialReturn);
        setIsRoundTrip(!!initialReturn);
        setPassengers(initialParams?.passengers || 1);
        
        // Try to set display values for origin/destination
        const setDisplayValues = async () => {
            if (initialParams?.origin) {
                try {
                    const results = await fetchAirportSuggestions(initialParams.origin);
                    console.log("Origin fetch results:", results);
                    const airport = results.find(a => a.iata === initialParams.origin);
                    if (airport) {
                        setOriginInput(`${airport.city} (${airport.iata})`);
                    } else {
                        setOriginInput(initialParams.origin);
                    }
                } catch (error) {
                    console.error("Error setting origin display:", error);
                    setOriginInput(initialParams.origin);
                }
            }
            
            if (initialParams?.destination) {
                try {
                    const results = await fetchAirportSuggestions(initialParams.destination);
                    console.log("Destination fetch results:", results);
                    const airport = results.find(a => a.iata === initialParams.destination);
                    if (airport) {
                        setDestInput(`${airport.city} (${airport.iata})`);
                    } else {
                        setDestInput(initialParams.destination);
                    }
                } catch (error) {
                    console.error("Error setting destination display:", error);
                    setDestInput(initialParams.destination);
                }
            }
        };
        
        setDisplayValues();
    }, [initialParams]);

    // Format display date
    const formatDisplayDate = (date) => {
        if (!date) return "Add date";
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className={`w-full max-w-7xl mx-auto h-[13vh] bg-white rounded-3xl   z-20 ${disabled ? 'opacity-70' : ''} relative z-10 overflow-visible mt-6 sticky`}>
            {/* Inject custom datepicker styles */}
            <style>{datepickerStyles}</style>
            
            {/* Add portal styles */}
            <style>{portalStyles}</style>
            
            {/* Additional stability styles for the popup elements */}
            <style>
            {`
                .suggestion-portal {
                    position: fixed !important;
                    z-index: 9999 !important;
                }
                .react-datepicker-popper {
                    position: fixed !important;
                    z-index: 9999 !important;
                }
                .react-datepicker-wrapper,
                .react-datepicker__input-container,
                .react-datepicker__input-container input {
                    display: block;
                    width: 100%;
                }
                
                /* Prevent form shifting on focus/interaction */
                input:focus, select:focus {
                    outline: none;
                    box-shadow: none;
                }
            `}
            </style>
            
            <form onSubmit={handleSubmit} className="w-full py-3 px-6" style={{ transform: 'translateZ(0)' }}>
                <div className="flex flex-col md:flex-row items-center gap-2">
                    {/* Trip Type Toggle - Small button above or next to the form */}
                    <div className="hidden md:flex items-center mr-2">
                        <div className="bg-gray-100 p-0.5 rounded-full flex items-center text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRoundTrip(false);
                                setReturnDate(null);
                            }}
                            disabled={disabled}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                !isRoundTrip 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            One Way
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRoundTrip(true)}
                            disabled={disabled}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                isRoundTrip 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Round Trip
                        </button>
                    </div>
                </div>

                    {/* From */}
                    <div className="flex-1 min-w-0 border-r border-gray-200 relative">
                        <label className="block text-xs font-medium text-gray-500">From</label>
                        <input
                            ref={originInputRef}
                            type="text"
                            value={originInput}
                            onChange={handleOriginChange}
                            onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                            onFocus={() => {
                                if(originInput.length > 1) {
                                    setShowOriginSuggestions(true);
                                    updateOriginRect();
                                }
                            }}
                            placeholder="Country, city or airport"
                            className="w-full px-2 py-1 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-none text-sm font-medium"
                        />
                        
                        {/* Loading indicator */}
                        {isOriginLoading && (
                            <div className="absolute right-2 top-7 text-gray-400">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        
                        {/* Suggestions dropdown - Using Portal */}
                        {showOriginSuggestions && originSuggestions.length > 0 && originInputRect && (
                            <SuggestionPortal targetRect={originInputRect}>
                                <ul className="w-full bg-white rounded-lg max-h-60 overflow-y-auto z-20">
                                    {originSuggestions.map((airport) => (
                                        <li
                                            key={airport.iata}
                                            onClick={() => handleOriginSuggestionClick(airport)}
                                            className="px-3 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center text-sm"
                                        >
                                            <span className="font-medium">{airport.city}</span>
                                            <span className="mx-1 text-gray-400">-</span>
                                            <span className="text-xs text-gray-400">{airport.name}</span>
                                            <span className="ml-auto bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">{airport.iata}</span>
                                        </li>
                                    ))}
                                </ul>
                            </SuggestionPortal>
                        )}
                        
                        {/* No results message */}
                        {showOriginSuggestions && !isOriginLoading && originSuggestions.length === 0 && originInput.length > 1 && originInputRect && (
                            <SuggestionPortal targetRect={originInputRect}>
                                <div className="px-3 py-2 text-xs text-gray-500 flex items-center z-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    No airports found matching your search.
                                </div>
                            </SuggestionPortal>
                        )}
                    </div>

                    {/* Swap button */}
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                const tempIata = origin;
                                const tempInput = originInput;
                                setOrigin(destination);
                                setOriginInput(destInput);
                                setDestination(tempIata);
                                setDestInput(tempInput);
                            }}
                            className="p-1 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    </div>

                    {/* To */}
                    <div className="flex-1 min-w-0 border-r border-gray-200 relative">
                        <label className="block text-xs font-medium text-gray-500">To</label>
                        <input
                            ref={destInputRef}
                            type="text"
                            value={destInput}
                            onChange={handleDestChange}
                            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                            onFocus={() => {
                                if(destInput.length > 1) {
                                    setShowDestSuggestions(true);
                                    updateDestRect();
                                }
                            }}
                            placeholder="Country, city or airport"
                            className="w-full px-2 py-1 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-none text-sm font-medium"
                        />
                        
                        {/* Loading indicator */}
                        {isDestLoading && (
                            <div className="absolute right-2 top-7 text-gray-400">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        
                        {/* Suggestions dropdown */}
                        {showDestSuggestions && destSuggestions.length > 0 && destInputRect && (
                            <SuggestionPortal targetRect={destInputRect}>
                                <ul className="w-full bg-white rounded-lg max-h-60 overflow-y-auto">
                                    {destSuggestions.map((airport) => (
                                        <li
                                            key={airport.iata}
                                            onClick={() => handleDestSuggestionClick(airport)}
                                            className="px-3 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center text-sm"
                                        >
                                            <span className="font-medium">{airport.city}</span>
                                            <span className="mx-1 text-gray-400">-</span>
                                            <span className="text-xs text-gray-400">{airport.name}</span>
                                            <span className="ml-auto bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">{airport.iata}</span>
                                        </li>
                                    ))}
                                </ul>
                            </SuggestionPortal>
                        )}
                        
                        {/* No results message */}
                        {showDestSuggestions && !isDestLoading && destSuggestions.length === 0 && destInput.length > 1 && destInputRect && (
                            <SuggestionPortal targetRect={destInputRect}>
                                <div className="px-3 py-2 text-xs text-gray-500 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    No airports found matching your search.
                                </div>
                            </SuggestionPortal>
                        )}
                    </div>
                    
                    {/* Depart */}
                    <div className="flex-1 min-w-0 border-r border-gray-200">
                        <label className="block text-xs font-medium text-gray-500">Depart</label>
                            <DatePicker 
                                selected={departureDate}
                                onChange={(date) => setDepartureDate(date)}
                                minDate={new Date()}
                            dateFormat="dd MMM yyyy"
                            placeholderText="Add date"
                            className="w-full px-2 py-1 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-none text-sm font-medium"
                            wrapperClassName="w-full"
                                popperClassName="z-[9999]"
                                popperPlacement="bottom-start"
                            withPortal
                            portalId="departure-date-portal"
                            customInput={
                                <input
                                    value={formatDisplayDate(departureDate)}
                                    readOnly
                                    className="w-full cursor-pointer"
                                />
                            }
                            />
                        </div>
                        
                    {/* Return */}
                    <div className="flex-1 min-w-0 border-r border-gray-200">
                        <label className="block text-xs font-medium text-gray-500">Return</label>
                            <DatePicker 
                                selected={returnDate}
                                onChange={(date) => setReturnDate(date)}
                                minDate={departureDate || new Date()}
                            dateFormat="dd MMM yyyy"
                                disabled={!isRoundTrip}
                            placeholderText="Add date"
                            className={`w-full px-2 py-1 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-none text-sm font-medium ${!isRoundTrip ? 'text-gray-400' : ''}`}
                            wrapperClassName="w-full"
                                popperClassName="z-[9998]"
                                popperPlacement="bottom-start"
                            withPortal
                            portalId="return-date-portal"
                            customInput={
                                <input
                                    value={isRoundTrip ? formatDisplayDate(returnDate) : "Add date"}
                                    readOnly
                                    className={`w-full cursor-pointer ${!isRoundTrip ? 'text-gray-400' : ''}`}
                                />
                            }
                            />
                        </div>
                        
                    {/* Passengers */}
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500">Travellers and cabin class</label>
                            <div className="relative">
                                <select
                                    value={passengers}
                                    onChange={(e) => setPassengers(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-transparent border-0 text-gray-900 focus:ring-0 focus:outline-none text-sm font-medium appearance-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <option key={num} value={num}>{num} Adult{num > 1 ? 's' : ''}, Economy</option>
                                    ))}
                                </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                    </svg>
                        </div>
                    </div>
                </div>

                {/* Search Button */}
                    <button 
                        type="submit"
                        disabled={isLoading || !origin || !destination || disabled}
                        className={`px-8 py-3.5 text-base font-semibold rounded-full transition-all duration-300 ${
                            isLoading || !origin || !destination || disabled 
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Searching...
                            </div>
                        ) : disabled ? 'Search' : 'Search'}
                    </button>
                </div>

                {/* Mobile Trip Type Toggle */}
                <div className="flex md:hidden justify-center mt-3">
                    <div className="bg-gray-100 p-0.5 rounded-full flex items-center text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRoundTrip(false);
                                setReturnDate(null);
                            }}
                            disabled={disabled}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                !isRoundTrip 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            One Way
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRoundTrip(true)}
                            disabled={disabled}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                isRoundTrip 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Round Trip
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default FlightSearchForm;