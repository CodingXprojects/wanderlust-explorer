import React from 'react';

// Simple component to display a single flight's details
const FlightCard = ({ flight, searchParams }) => {
    // Safely extract flight properties with fallbacks for missing data
    const { 
        airlineName = 'Unknown Airline', 
        airlineLogo, 
        departureAirport = 'N/A', 
        arrivalAirport = 'N/A', 
        departureTime = 'N/A', 
        arrivalTime = 'N/A', 
        duration = 'N/A', 
        price = 0, 
        bookingLink,
        stops = 0
    } = flight || {};

    // Function to build Skyscanner booking link
    const buildBookingLink = () => {
        const { departureDate, returnDate, passengers, isRoundTrip } = searchParams || {};
        
        // Format dates for Skyscanner (YYMMDD format)
        const formatDateForSkyscanner = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        };

        const formattedDepartDate = formatDateForSkyscanner(departureDate);
        const formattedReturnDate = formatDateForSkyscanner(returnDate);

        // Build URL with exact Skyscanner format
        const baseUrl = 'https://www.skyscanner.co.in/transport/flights';
        const dateParams = isRoundTrip ? `/${formattedDepartDate}/${formattedReturnDate}` : `/${formattedDepartDate}`;
        const queryParams = new URLSearchParams({
            adultsv2: passengers || 1,
            cabinclass: 'economy',
            childrenv2: '',
            inboundaltsenabled: 'false',
            outboundaltsenabled: 'false',
            preferdirects: 'false',
            ref: 'home',
            rtn: isRoundTrip ? '1' : '0'
        }).toString();

        return `${baseUrl}/${departureAirport.toLowerCase()}/${arrivalAirport.toLowerCase()}${dateParams}/?${queryParams}`;
    };

    // Function to handle the booking redirection
    const handleBookNow = () => {
        try {
            const targetUrl = buildBookingLink();
            window.open(targetUrl, '_blank');
        } catch (error) {
            console.error('Error opening Skyscanner:', error);
            alert('Sorry, there was a problem opening Skyscanner. Please try again.');
        }
    };

    // Handle price display with fallbacks
    const renderPrice = () => {
        try {
            if (typeof price === 'number' && !isNaN(price)) {
                return `₹${price.toLocaleString('en-IN')}`;
            } else if (typeof price === 'string' && price.trim() !== '') {
                return `₹${parseFloat(price).toLocaleString('en-IN')}`;
            } else {
                return 'Price unavailable';
            }
        } catch (error) {
            console.error('Error formatting price:', error);
            return 'Price unavailable';
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-shadow duration-300 hover:shadow-lg hover:border-blue-600/50">
            {/* Left Section: Airline Info & Times */}
            <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                {/* Airline Logo & Name */}
                <div className="flex items-center gap-2 min-w-[120px] justify-center md:justify-start">
                    {airlineLogo ? (
                        <img 
                            src={airlineLogo} 
                            alt={`${airlineName} logo`} 
                            className="h-8 w-8 object-contain mr-2"
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.style.display = 'none';
                                e.target.parentNode.querySelector('.fallback-logo').style.display = 'flex';
                            }} 
                        />
                    ) : null}
                    <div 
                        className={`h-8 w-8 bg-gray-600 rounded-full mr-2 flex items-center justify-center text-white text-sm font-bold fallback-logo ${airlineLogo ? 'hidden' : ''}`}
                    >
                        {airlineName?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <span className="text-sm font-medium text-gray-300 whitespace-nowrap">{airlineName}</span>
                </div>

                {/* Flight Times & Airports */}
                <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-xl font-semibold text-white">{departureTime}</span>
                        <span className="text-sm text-gray-400">{departureAirport}</span>
                    </div>
                    <div className="text-center px-2">
                        <span className="text-xs text-gray-500 block">{duration}</span>
                        <div className="w-16 h-px bg-gray-600 my-1"></div> 
                        <span className="text-xs text-gray-500 block">
                            {stops === 0 ? 'Direct' : stops === 1 ? '1 Stop' : `${stops} Stops`}
                        </span>
                    </div>
                    <div className="flex flex-col items-center md:items-end">
                        <span className="text-xl font-semibold text-white">{arrivalTime}</span>
                        <span className="text-sm text-gray-400">{arrivalAirport}</span>
                    </div>
                </div>
            </div>

            {/* Right Section: Price & Booking Button */}
            <div className="flex flex-col items-center md:items-end gap-2 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-4 w-full md:w-auto">
              
                <button 
                    onClick={handleBookNow}
                    className="px-4 py-2 rounded-md text-sm font-medium transition duration-200 w-full md:w-auto 
                               bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                >
                    {bookingLink ? 'Book Now' : 'Check Availability'}
                </button>
                {!bookingLink && (
                    <span className="text-xs text-gray-400 mt-1">Redirects to booking site</span>
                )}
            </div>
        </div>
    );
};

export default FlightCard;