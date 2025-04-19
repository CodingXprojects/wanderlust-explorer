import React, { useState } from 'react';
import Translation from "./Translation";
import { useNavigate } from "react-router-dom";
import Chatbot from "./chatbot.jsx";
import ARExperience from "./ARExperience";

const Grid = ({ onNearbyClick }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showARExperience, setShowARExperience] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans mt-0 ">
      <div className="text-center mb-3 backdrop-blur-md bg-black/70 rounded-xl">
        <h1 className="text-4xl md:text-6xl font-bold text-white dashboard-heading px-4 md:px-6 rounded-lg inline-block ">
          Wanderlust Explorer
        </h1>
        <p className="text-white text-base md:text-lg font-medium py-1 mb-4  px-3 md:px-4 rounded-lg inline-block"> 
          Discover features that elevate your travel experience in India
        </p>
      </div>

      <div className="relative w-full h-[85vh] border border-gray-800 rounded-xl backdrop-blur-md shadow-lg bg-black/30">
        {/* Top-left box - Itinerary */}
        <div 
          onClick={() => navigate('/create-trip')}
          className="absolute top-[2%] left-[2%] w-[33%] h-[31%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90 flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm cursor-pointer"
        >
          <img src="/itenary.png" alt="Itinerary" className="w-12 h-12 md:w-36 md:h-36 mt-3 -rotate-12 relative" />
          <div className="flex flex-col items-center relative top-[-4.3vh]">
            <span className="section-title text-white text-2xl md:text-4xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>Plan Your Itinerary</span>
            <span className="section-subtitle text-white/90 text-sm">Create your perfect travel plan</span>
          </div>
        </div>

        {/* Top-right box - Flight */}
        <div 
          onClick={() => navigate('/flights')}
          className="absolute top-[2%] right-[2%] w-[60%] h-[31%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90 flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm cursor-pointer"
        >
          <img src="/flight.png" alt="Flight" className="w-12 h-12 md:w-48 md:h-40  relative left-[-33%] top-8" />
          <div className="flex flex-col items-center relative top-[-11vh] pl-5">
            <span className="section-title text-white text-3xl md:text-5xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>Book Flights</span>
            <span className="section-subtitle text-white/90 text-base">Discover seamless travel across India</span>
          </div>
        </div>

        {/* Left-middle box - Crowd */}
        <div 
          onClick={() => window.location.href = "/crowd.html"}
          className="absolute top-[36%] left-[2%] w-[40%] h-[25%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90 flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm cursor-pointer"
        >
          <img src="/crowd.png" alt="Crowd" className="w-12 h-12 md:w-52 md:h-48 top-3 mb-2 relative right-[-23vh]" />
          <div className="flex flex-col items-center relative top-[-14vh] left-[-12vh]">
            <span className="section-title text-white text-2xl md:text-3xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>Check Crowd Levels</span>
            <span className="section-subtitle text-white/90 text-sm">Real-time crowd monitoring</span>
          </div>
        </div>

        {/* Right-middle box - AR */}
        <div 
          onClick={() => setShowARExperience(true)}
          className="absolute top-[36%] right-[2%] w-[37%] h-[25%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90 flex items-center justify-between overflow-hidden px-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="flex flex-col items-start">
            <span className="section-title text-white text-2xl md:text-4xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>AR Experience</span>
            <span className="section-subtitle text-white/90 text-sm">Walk through history in real-time</span>
          </div>
          <img src="/ar.png" alt="AR" className="w-12 h-12 md:w-40 md:h-40" />
        </div>

        {/* Bottom-left box - Nearby */}
        <div 
          onClick={onNearbyClick}
          className="absolute bottom-[2%] left-[2%] w-[68%] h-[33%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90 flex items-center justify-between px-8 cursor-pointer overflow-hidden backdrop-blur-sm"
        >
          <div className="flex flex-col items-start">
            <span className="section-title text-white text-3xl md:text-5xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>Nearby Attractions</span>
            <span className="section-subtitle text-white/90 text-base  px-2 rounded">Discover local wonders</span>
          </div>
          <img src="/nearby.png" alt="Nearby" className="w-16 h-16 md:w-56 rotate-[10deg] md:h-56 transform hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Bottom-right box - Translation */}
        <div 
          onClick={() => setShowTranslation(true)}
          className="absolute bottom-[2%] right-[2%] w-[25%] h-[33%] bg-black/30 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center overflow-hidden cursor-pointer backdrop-blur-sm"
        >
          <img src="/translation.png" alt="Translation" className="w-12 h-12 md:w-40 md:h-44 " />
          <div className="flex flex-col items-center relative top-[-5vh]">
            <span className="section-title text-white text-2xl md:text-4xl mb-2" style={{WebkitTextStroke: '0.2px black'}}>TravelLingo</span>
            <span className="section-subtitle text-white/90 text-sm">Break language barriers</span>
          </div>
        </div>

        {/* Center video - Chatbot */}
        <div id="chatbot-ui" className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center hidden ">
          <div className="bg-white w-[90%] md:w-[50%] h-[80%] rounded-lg shadow-lg p-4 relative">
            <button 
              onClick={() => {
                document.getElementById('chatbot-ui').classList.add('hidden');
                setMessages([]); // Clear chatbot messages
              }} 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
            >
              ×
            </button>
            <Chatbot />
          </div>
        </div>

        <div className="absolute h-[23vh] w-[23vh] top-[35.5%] left-[44.8%] inset-0 flex items-center justify-center rounded-full -z-0 cursor-pointer hover:shadow-card-hover transition-all duration-300 transform hover:scale-105 hover:bg-opacity-90" onClick={() => {
          const chatbotUI = document.getElementById('chatbot-ui');
          chatbotUI.classList.remove('hidden');
        }}>
          <video className="w-full h-full object-cover rounded-[150%] shadow-lg" muted autoPlay loop>
            <source src="/Untitled video - Made with Clipchamp.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Translation Modal */}
      {showTranslation && <Translation onClose={() => setShowTranslation(false)} />}
      
      {/* AR Experience Modal */}
      {showARExperience && <ARExperience onClose={() => setShowARExperience(false)} />}
    </div>
  );
};

export default Grid;
