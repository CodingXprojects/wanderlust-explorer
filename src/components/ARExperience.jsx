import React from 'react';
import ARMap from './ARMap';

const ARExperience = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm overflow-auto">
      <div className="bg-white/95 w-[85%] h-[90%] rounded-xl relative backdrop-blur-md flex flex-col overflow-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl z-20"
        >
          ×
        </button>
        <div className="flex-1 p-4 overflow-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">AR Experience</h2>
            <p className="text-gray-600">
              Search for famous landmarks and monuments in India to view them in Augmented Reality
            </p>
          </div>
          <ARMap />
        </div>
      </div>
    </div>
  );
};

export default ARExperience; 