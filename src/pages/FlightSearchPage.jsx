import React, { useState, useCallback, useEffect } from 'react';
import FlightSearchForm from '../components/flight/FlightSearchForm';
import FlightResults from '../components/flight/FlightResults';
import { searchFlights, isApiConfigured } from '../services/flightApi';
import { Link } from 'react-router-dom'; // Import Link for the back button

const FlightSearchPage = () => {
    const [searchParams, setSearchParams] = useState(null); // Stores the last search parameters
    const [flights, setFlights] = useState(null); // Stores the raw results from API
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiConfigured, setApiConfigured] = useState(null);

    // Check if API is configured
    useEffect(() => {
        // Check if API is configured
        const checkApiConfig = async () => {
            const configured = await isApiConfigured();
            setApiConfigured(configured);
            
            if (!configured) {
                console.warn("Amadeus API is not configured. Update DEV_MODE and API keys in flightApi.js");
            }
        };
        
        checkApiConfig();
    }, []);

    // Callback function passed to the FlightSearchForm
    const handleSearch = useCallback(async (params) => {
        if (!apiConfigured) {
            setError("API is not configured. Please set up your API credentials first.");
            return;
        }

        setSearchParams(params); // Store the search parameters
        setIsLoading(true);
        setError(null);
        setFlights(null); // Clear previous results immediately
        console.log('Starting flight search with params:', params);

        try {
            const results = await searchFlights(params);
            console.log('Flight search successful, results:', results); 
            setFlights(results); 
            if (results.length === 0) {
                setError("No flights found matching your search criteria.");
            }
        } catch (err) {
            console.error('Flight search failed:', err);
            setError(err.message || 'An error occurred while searching for flights.');
            setFlights([]); // Set to empty array on error to show "not found" message correctly if needed
        } finally {
            setIsLoading(false);
        }
    }, [apiConfigured]); // Add apiConfigured to dependencies

    // Render API configuration message if needed
    const renderApiConfigMessage = () => {
        if (apiConfigured === false) {
            return (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">API Configuration Required</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>To use flight search features, you need to configure the Amadeus API:</p>
                                <ol className="list-decimal list-inside mt-2 ml-2 space-y-1">
                                    <li>Open <code className="bg-amber-100 px-1 rounded">src/services/flightApi.js</code></li>
                                    <li>Find the <code className="bg-amber-100 px-1 rounded">DEV_MODE</code> variable (set to <code className="bg-amber-100 px-1 rounded">true</code>)</li>
                                    <li>Replace <code className="bg-amber-100 px-1 rounded">DEV_API_KEY</code> and <code className="bg-amber-100 px-1 rounded">DEV_API_SECRET</code> values with your Amadeus API credentials</li>
                                    <li>Save the file and refresh this page</li>
                                </ol>
                                <p className="mt-2">
                                    <a 
                                        href="https://developers.amadeus.com/register" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-amber-800 underline hover:text-amber-900"
                                    >
                                        Sign up for Amadeus API credentials
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen w-full font-sans text-white bg-transparent">
            {/* Full-page background */}
            <div className="fixed inset-0 z-0  bg-cover bg-center bg-no-repeat"  style={{ backgroundImage: 'url(" https://images.pexels.com/photos/912110/pexels-photo-912110.jpeg?cs=srgb&dl=atmosphere-blue-sky-clouds-912110.jpg&fm=jpg")' }}>
                <div className="absolute inset-0"></div>
            </div>
            
            {/* Content container */}
            <div className="relative z-10 container mx-auto px-4  flex flex-col min-h-screen">
                {/* Back button */}
                <div className="mt-1">
                    <Link 
                        to="/" 
                        className="flex items-start mt-0 text-cyan-100 hover:text-blue-300 transition-all duration-300 bg-black/40 rounded-full p-2 w-fit"
                    >
                        
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                
                {/* Header section */}
                <div className="text-center my-2">
                    <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-400 mb-5">
                        Create Ever-lasting
                    </h1>
                    <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-pink-800 to-pink-400">
                        Memories With Us
                    </h2>
                </div>


                
                    <img src="http://pluspng.com/img-png/airplane-taking-off-png--3000.png" alt="plane pic " className="max-w-1/2 max-h-[50vw] relative top-[-16vh] left-0  flex items-center justify-center  z-10 bg-transparent" />
                
                
                {/* API configuration message */}
                {renderApiConfigMessage()}
                
                {/* Flight search form */}
                <div className="w-full max-w-full mt-[-30vh] bg-white  backdrop-blur-md rounded-full overflow-hidden shadow-xl z-20 border border-white/10 mb-12">
                    <FlightSearchForm 
                        onSearch={handleSearch}
                        initialParams={searchParams}
                        isLoading={isLoading}
                        disabled={!apiConfigured}
                    />
                </div>
                 
                {/* Flight results */}
                <div className="flex-grow">
                    <FlightResults 
                        flights={flights}
                        isLoading={isLoading}
                        error={error}
                        searchParams={{
                            ...searchParams,
                            isRoundTrip: searchParams?.returnDate !== null
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FlightSearchPage;