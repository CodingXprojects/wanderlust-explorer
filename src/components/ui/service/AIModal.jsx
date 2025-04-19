import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI__AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Define the model with appropriate settings
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-preview-03-25",
  systemInstruction: "You are a travel planner assistant. Create detailed travel itineraries in valid JSON format. Keep responses concise and well-structured.",
});

// Create a chat session with a simplified example
export const chatSession = model.startChat({
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  },
  history: [
    {
      role: "user",
      parts: [
        {text: "Generate Travel plan for location : Mumbai, for 2 Days for Couple for Cheap budget. Include Hotels list and daily itinerary in JSON format."}
      ],
    },
    {
      role: "model",
      parts: [
        {text: "```json\n{\n  \"travelPlanName\": \"Mumbai Couple Getaway\",\n  \"location\": \"Mumbai, India\",\n  \"duration\": \"2 Days\",\n  \"travelerType\": \"Couple\",\n  \"budget\": \"Budget-Friendly\",\n  \"hotels\": [{\n    \"hotelName\": \"Hotel Residency Fort\",\n    \"address\": \"26 Rustom Sidhwa Marg, Fort, Mumbai\",\n    \"price\": \"₹2,000-3,000/night\",\n    \"imageUrl\": \"https://example.com/hotelimage.jpg\",\n    \"geoCoordinates\": {\"latitude\": 18.9322, \"longitude\": 72.8358},\n    \"rating\": \"3.5/5\",\n    \"description\": \"Budget hotel in South Mumbai\"\n  }],\n  \"itinerary\": [{\n    \"day\": 1,\n    \"theme\": \"South Mumbai Exploration\",\n    \"dailyPlan\": [{\n      \"timeSlot\": \"Morning (9:00 AM - 11:00 AM)\",\n      \"placeName\": \"Gateway of India\",\n      \"placeDetails\": \"Historic monument\",\n      \"placeImageUrl\": \"https://example.com/gateway.jpg\",\n      \"geoCoordinates\": {\"latitude\": 18.9217, \"longitude\": 72.8347},\n      \"ticketPricing\": \"Free\",\n      \"rating\": \"4.5/5\",\n      \"bestTimeToVisit\": \"Early morning\",\n      \"estimatedTravelTimeFromPrevious\": \"15 minutes walk\"\n    }]\n  }]\n}\n```"}
      ],
    },
  ],
});

