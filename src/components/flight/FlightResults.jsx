import React, { useState, useMemo, useCallback } from 'react';
import FlightCard from './FlightCard';
import FilterSidebar from './FilterSidebar';

const FlightResults = ({ flights, isLoading, error, searchParams }) => {
    const [sortBy, setSortBy] = useState('price_asc'); // Default sort: price ascending
    const [filters, setFilters] = useState({ maxPrice: null, airlines: [] });

    // Memoize available airlines for the filter sidebar
    const availableAirlines = useMemo(() => {
        if (!flights) return [];
        const airlines = new Set(flights.map(f => f.airlineName));
        return Array.from(airlines).sort();
    }, [flights]);

    // Memoize filtered and sorted flights
    const processedFlights = useMemo(() => {
        if (!flights) return [];

        let filtered = [...flights];

        // Apply filters
        if (filters.maxPrice) {
            filtered = filtered.filter(f => f.price <= filters.maxPrice);
        }
        if (filters.airlines && filters.airlines.length > 0) {
            filtered = filtered.filter(f => filters.airlines.includes(f.airlineName));
        }
        // Add more filter logic here if needed (e.g., stops)

        // Apply sorting
        switch (sortBy) {
            case 'price_asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'duration_asc':
                filtered.sort((a, b) => a.rawDurationSeconds - b.rawDurationSeconds);
                break;
            case 'departure_asc':
                filtered.sort((a, b) => a.rawDepartureUTC - b.rawDepartureUTC);
                break;
            default:
                break;
        }

        return filtered;
    }, [flights, filters, sortBy]);

    // Callback for the filter sidebar to update filters
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);

    // Format date for Skyscanner URL (YYMMDD)
    const formatDateForSkyscanner = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear().toString().slice(2); // Get last 2 digits of year
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return year + month + day;
    };

    // Handle time period selection
    const handleTimeSelection = (timePeriod) => {
        if (!searchParams) return;
        
        // Get basic search parameters
        const { origin, destination, departureDate, returnDate, passengers = 1 } = searchParams;
        
        // Format origin/destination
        const formattedOrigin = origin?.toLowerCase();
        const formattedDest = destination?.toLowerCase();
        const formattedDate = formatDateForSkyscanner(departureDate);
        
        // Determine time range based on time period
        let departureTimeRange = '';
        switch (timePeriod) {
            case 'morning':
                departureTimeRange = '300-720'; // 5:00 AM - 11:59 AM
                break;
            case 'afternoon':
                departureTimeRange = '720-1080'; // 12:00 PM - 5:59 PM
                break;
            case 'night':
                departureTimeRange = '1080-300'; // 6:00 PM - 4:59 AM
                break;
            default:
                departureTimeRange = '';
        }
        
        // Build Skyscanner URL
        let skyscannerUrl = `https://www.skyscanner.co.in/transport/flights/${formattedOrigin}/${formattedDest}/${formattedDate}/`;
        
        // Add query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('adultsv2', passengers);
        queryParams.append('cabinclass', 'economy');
        queryParams.append('childrenv2', '');
        if (departureTimeRange) {
            queryParams.append('departure-times', departureTimeRange);
        }
        queryParams.append('inboundaltsenabled', 'false');
        queryParams.append('outboundaltsenabled', 'false');
        queryParams.append('preferdirects', 'false');
        queryParams.append('ref', 'home');
        queryParams.append('rtn', returnDate ? '1' : '0');
        
        // If return flight
        if (returnDate) {
            const formattedReturnDate = formatDateForSkyscanner(returnDate);
            skyscannerUrl = `https://www.skyscanner.co.in/transport/flights/${formattedOrigin}/${formattedDest}/${formattedDate}/${formattedReturnDate}/`;
        }
        
        // Append query parameters
        skyscannerUrl += `?${queryParams.toString()}`;
        
        // Open Skyscanner in a new tab
        window.open(skyscannerUrl, '_blank');
    };

    // --- Render Logic --- 

    if (isLoading) {
        return (
            <div className="flex justify-center items-center mt-10">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-white text-lg">Searching for flights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-10 text-center p-6 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-red-300 font-semibold">Error searching flights:</p>
                <p className="text-red-400 mt-1">{error}</p>
                <p className="text-xs text-red-500 mt-2">Please check your search criteria and network connection, or try again later.</p>
            </div>
        );
    }

    // Check if search has been performed
    const hasSearched = searchParams && Object.keys(searchParams).length > 0 && 
                         searchParams.origin && searchParams.destination && searchParams.departureDate;

    // If no search has been performed yet
    if (!hasSearched) {
        return (
            <div className="mt-10 text-center p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-300 font-semibold">Enter search details and click Search to see flight options.</p>
            </div>
        );
    }

    // Show time period selection cards after search has been performed
    return (
        <div className="mt-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-black mb-6">Select Preferred Flight Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                {/* Morning Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
                    <div className="h-40 bg-gradient-to-r from-amber-100 to-yellow-300 flex items-center justify-center">
                        <div className="text-center">
                            <div className="flex justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-amber-800">Morning</h3>
                            <p className="text-amber-700">5:00 AM - 11:59 AM</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">Start your journey early and make the most of your day.</p>
                        <button 
                            onClick={() => handleTimeSelection('morning')}
                            className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                        >
                            Check Availability
                        </button>
                    </div>
                </div>
                
                {/* Afternoon Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
                    <div className="h-40 bg-gradient-to-r from-blue-100 to-blue-300 flex items-center justify-center">
                        <div className="text-center">
                            <div className="flex justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v9m0 0h9m-9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-800">Afternoon</h3>
                            <p className="text-blue-700">12:00 PM - 5:59 PM</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">Perfect for those who prefer a mid-day departure.</p>
                        <button 
                            onClick={() => handleTimeSelection('afternoon')}
                            className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Check Availability
                        </button>
                    </div>
                </div>
                
                {/* Night Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
                    <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-300 flex items-center justify-center">
                        <div className="text-center">
                            <div className="flex justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-indigo-800">Night</h3>
                            <p className="text-indigo-700">6:00 PM - 4:59 AM</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">Travel at night and arrive refreshed the next day.</p>
                        <button 
                            onClick={() => handleTimeSelection('night')}
                            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors"
                        >
                            Check Availability
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightResults;