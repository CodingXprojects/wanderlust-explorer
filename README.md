# Wanderlust Explorer

![Wanderlust Explorer](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0-blue)

A comprehensive travel companion application designed to enhance your travel experience in India. Wanderlust Explorer offers a suite of tools and features to help travelers plan their journey, find flights, navigate language barriers, and discover attractions.

## ✨ Features

- **Flight Finder**: Input your departure and arrival cities, travel dates, and number of passengers to browse available flights.
- **Custom Itinerary Builder**: Click on **"Plan Your Itinerary"** to design a travel schedule tailored to your preferences.
- **Language Translator**: Use the **TravelLingo** tool to convert common phrases into regional Indian languages for smoother communication.
- **Augmented Reality Previews**: Virtually explore destinations through our **AR feature** before you travel.
- **AI Travel Assistant**: Chat with our **intelligent assistant** for curated travel tips and personalized suggestions.


## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **APIs**: Amadeus Flight API, Google Maps API, Google Gemini API
- **Backend**: Node.js, Python (for translation service)
- **Other Tools**: Git, npm

## 🚀 Installation

Follow these steps to set up the project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wanderlust-explorer.git
   cd wanderlust-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add:
   ```
   VITE_GOOGLE_GEMINI__AI_API_KEY=your_gemini_api_key
   VITE_GOOGLE_PLACES_API_KEY=your_google_api_key
   VITE_AMADEUS_API_KEY=your_amadeus_api_key
   VITE_AMADEUS_API_SECRET=your_amadeus_api_secret
   ```

4. **Add required video files**
   Due to size limitations, video files are not included in the repository. You'll need to:
   - Add your own video files to these locations:
     - `/public/Untitled video - Made with Clipchamp.mp4` (for the chatbot animation)
     - `/public/Incredible-India-4K.webm` (for background animations)

5. **Start the development server**
   ```bash
   npm run dev
   
   ```
   Also start backend server
      ```bash
   cd server
      python server.py
   
   ```
   

## 📋 Usage

- **Flight Search**: Enter your origin, destination, dates, and passenger count to find available flights
- **Itinerary Planning**: Click on "Plan Your Itinerary" to create a customized travel plan
- **Translation**: Access the TravelLingo feature to translate phrases into local Indian languages
- **AR Experience**: Use the AR feature to virtually explore destinations before visiting
- **Chatbot Assistant**: Engage with the AI chatbot for personalized travel recommendations

## 📱 Screenshots

![image](https://github.com/user-attachments/assets/9b1ffcbb-2592-42e0-8361-fafebba78a78)


## 📝 Notes

- This application focuses on travel within India, providing specialized information for Indian destinations.
- The chatbot is trained with specific knowledge about Indian travel destinations, festivals, and cultural insights.
- For the best experience, allow location access when prompted to discover nearby attractions.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ for travelers exploring the wonders of India.
