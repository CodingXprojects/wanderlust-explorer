import React, { useState, useEffect } from 'react';

const FilterSidebar = ({ availableAirlines, onFilterChange, initialFilters }) => {
    const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || '');
    const [selectedAirlines, setSelectedAirlines] = useState(initialFilters?.airlines || []);
    // Add more filter states as needed (e.g., stops, duration)

    useEffect(() => {
        // Update parent component when filters change
        onFilterChange({
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : null,
            airlines: selectedAirlines,
        });
    }, [maxPrice, selectedAirlines, onFilterChange]);

    useEffect(() => {
        // Sync state if initialFilters change 
        setMaxPrice(initialFilters?.maxPrice || '');
        setSelectedAirlines(initialFilters?.airlines || []);
    }, [initialFilters]);

    const handleAirlineToggle = (airlineName) => {
        setSelectedAirlines(prev => 
            prev.includes(airlineName) 
                ? prev.filter(name => name !== airlineName) 
                : [...prev, airlineName]
        );
    };

    const handleResetFilters = () => {
        setMaxPrice('');
        setSelectedAirlines([]);
        // Reset other filters here
    };

    return (
        <div className="w-full md:w-64 lg:w-72 bg-black/30 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700 sticky top-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Filter Results</h3>
            
            {/* Max Price Filter */}
            <div className="mb-4">
                <label htmlFor="maxPrice" className="block text-sm font-medium text-white mb-1">Max Price (₹)</label>
                <input 
                    type="number"
                    id="maxPrice"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g., 10000"
                    className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-50 transition duration-200"
                />
            </div>

            {/* Airline Filter */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Airlines</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {availableAirlines.length > 0 ? (
                        availableAirlines.map((airline) => (
                            <label key={airline} className="flex items-center cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={selectedAirlines.includes(airline)}
                                    onChange={() => handleAirlineToggle(airline)}
                                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-100"
                                />
                                <span className="ml-2 text-sm text-white">{airline}</span>
                            </label>
                        ))
                    ) : (
                        <p className="text-xs text-gray-100">No airlines to filter.</p>
                    )}
                </div>
            </div>

            {/* Add more filters here - e.g., Stops, Departure Time */}
            {/* Example: Stops Filter */}
            {/* <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Stops</h4>
                <div className="space-y-1">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-200">Direct</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-200">1 Stop</span>
                    </label>
                    // ... etc.
                </div>
            </div> */}

            {/* Reset Button */}
            <button 
                onClick={handleResetFilters}
                className="w-full mt-4 px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-500 transition duration-200"
            >
                Reset Filters
            </button>
        </div>
    );
};

export default FilterSidebar; 