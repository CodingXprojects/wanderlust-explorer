import React, { useState } from 'react'
import Grid from "./grid";
import Map from "./Map";

export const Landing = () => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className='w-full min-h-[100%] overflow-hidden relative'>
      <video autoPlay muted loop className="video-background opacity-100 brightness-150">
        <source src="/Incredible-India-4K.webm" type="video/mp4" />
      </video>
      <div className="relative z-10">
        {showMap ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm">
            <div className="bg-white/90 w-[85%] h-[90%] rounded-xl p-4 relative backdrop-blur-md">
              <button 
                onClick={() => setShowMap(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
              <Map />
            </div>
          </div>
        ) : (
          <Grid onNearbyClick={() => setShowMap(true)} />
        )}
      </div>
    </div>
  )
}

export default Landing;