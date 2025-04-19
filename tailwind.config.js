/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      scale: {
        '102': '1.02',
      },
      backgroundImage: {
        // TODO: Replace #HEXCODE1 and #HEXCODE2 with your desired colors
        'gradient-translation': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Translation section gradient
        'gradient-flight': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Flight booking gradient
        'gradient-itinerary': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Itinerary section gradient
        'gradient-crowd': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Crowd monitoring gradient
        'gradient-nearby': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Nearby attractions gradient
        'gradient-chatbot': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Chatbot section gradient
        'gradient-ar': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // AR section gradient
        'gradient-header': 'linear-gradient(135deg, #HEXCODE1, #HEXCODE2)', // Header gradient
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 12px rgba(0, 0, 0, 0.3)',
        'itinerary-glow': '0 0 20px rgba(75, 85, 99, 0.4)',
        'flight-glow': '0 0 20px rgba(55, 65, 81, 0.4)',
        'crowd-glow': '0 0 20px rgba(31, 41, 55, 0.4)',
        'ar-glow': '0 0 20px rgba(17, 24, 39, 0.4)',
        'nearby-glow': '0 0 20px rgba(55, 65, 81, 0.4)',
        'translation-glow': '0 0 20px rgba(31, 41, 55, 0.4)',
      },
      fontSize: {
        'subtitle': '1.2rem',
      },
      textStroke: {
        'sm': '0.2px',  
        'md': '0.5px',
        'lg': '1px',
        'xl': '2px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-stroke-sm-black': {
          '-webkit-text-stroke': '0.2px black',
        },
        '.text-stroke-md-black': {
          '-webkit-text-stroke': '0.5px black',
        },
        '.text-stroke-lg-black': {
          '-webkit-text-stroke': '1px black',
        },
        '.text-stroke-xl-black': {
          '-webkit-text-stroke': '2px black',
        },
        '.text-stroke-sm-white': {
          '-webkit-text-stroke': '0.2px white',
        },
        '.text-stroke-md-white': {
          '-webkit-text-stroke': '0.5px white',
        },
        '.text-stroke-lg-white': {
          '-webkit-text-stroke': '1px white',
        },
        '.text-stroke-xl-white': {
          '-webkit-text-stroke': '2px white',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
