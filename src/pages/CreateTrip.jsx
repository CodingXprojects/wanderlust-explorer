import React from 'react';
import { Link } from 'react-router-dom';

const CreateTrip = () => {
  return (
    <div className="min-h-screen font-sans p-4 md:p-8 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Back Button and Title */}
        <div className="mb-6 flex items-center">
          <Link 
            to="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 mr-4"
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Plan Your Itinerary</h1>
        </div>
        
        {/* Placeholder Content */}
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-gray-700">
          <p className="text-center text-gray-300">
            Itinerary planning feature coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip; 