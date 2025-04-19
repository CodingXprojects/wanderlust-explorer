import React, { useState, useEffect } from "react";
import { AI_PROMPT } from "../constants/options";
import { useNavigate } from "react-router-dom";
import { Input } from "../input";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { SelectBudgetOptions, SelectTravelesList } from "../constants/options";
import { Button } from "../button";
import { toast } from "../sonner";
import { chatSession } from "../service/AIModal";
import { loadGoogleMaps } from "../lib/googleMapsLoader";
import '../../../styles/places-autocomplete.css';

function CreateTrip() {
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({});
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const googlePlacesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    loadGoogleMaps(googlePlacesApiKey)
      .then(() => {
        setMapsLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load Google Maps:", error);
        toast.error("Failed to load location search. Please refresh the page.");
      });
  }, [googlePlacesApiKey]);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const OnGenerateTrip = async () => {
    if (!formData.location || !formData.budget) {
      toast.error("Please fill in all required details");
      return;
    }

    // Validate number of days
    const days = parseInt(formData.noOfDays);
    if (!days || days < 1) {
      toast.error("Please enter a valid number of days (minimum 1 day)");
      return;
    }

    setIsGenerating(true);
    toast.info("Generating your travel plan. This may take a minute or two...");
    
    try {
      const FINAL_PROMPT = AI_PROMPT
        .replace("{location}", formData?.location?.label)
        .replace(/\{totalDays\}/g, days) // Replace all instances of totalDays
        .replace("{traveler}", formData?.traveler || "Solo")
        .replace("{budget}", formData?.budget);

      console.log("Sending prompt:", FINAL_PROMPT);

      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const responseText = await result?.response?.text();
      console.log("AI response length:", responseText?.length);
      
      // Try to parse the JSON from the response
      try {
        let jsonData;
        // First try to parse as direct JSON
        try {
          jsonData = JSON.parse(responseText.trim());
        } catch {
          // If direct parsing fails, try to extract JSON from markdown
          const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
          const match = responseText.match(jsonRegex);
          
          if (match && match[1]) {
            jsonData = JSON.parse(match[1].trim());
          } else {
            // Try to find JSON-like structure with more flexible matching
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const possibleJson = responseText.slice(jsonStart, jsonEnd).trim();
              jsonData = JSON.parse(possibleJson);
            } else {
              throw new Error("No valid JSON found in response");
            }
          }
        }
        
        // Validate the parsed data
        if (!jsonData || typeof jsonData !== 'object') {
          throw new Error("Invalid JSON structure");
        }
        
        if (!jsonData.itinerary || !Array.isArray(jsonData.itinerary)) {
          throw new Error("Missing or invalid itinerary data");
        }
        
        // Navigate to view-details with validated data
        navigate('/view-details', { 
          state: { 
            itineraryData: jsonData
          } 
        });
      } catch (error) {
        console.error("Failed to parse JSON data:", error);
        console.error("Response text:", responseText);
        toast.error("Unable to generate itinerary. Please try again or choose a different location.");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Error generating trip:", error);
      toast.error("An error occurred while generating your trip. Please check your internet connection and try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="sm:px-10 md:px-32 lg:px-56 xl:px-10 px-5 mt-10">
      <h2 className="font-bold text-3xl">Tell us your travel prefrences 🏕️</h2>
      <p className="mt-3 text-gray-500 text-xl ">
        Just provide some basic information
      </p>

      <div className="mt-20 flex flex-col gap-10">
        <div>
          <h2 className="text-xl my-3 font-medium">
            What is your destination of choice?
          </h2>
          <div className="location-search-container">
            {mapsLoaded ? (
              <GooglePlacesAutocomplete
                apiKey={googlePlacesApiKey}
                selectProps={{
                  value: place,
                  onChange: (v) => {
                    console.log("Selected place:", v);
                    setPlace(v);
                    handleInputChange("location", v);
                  },
                  placeholder: "Search for any destination...",
                  isClearable: true,
                  classNames: {
                    control: () => 'place-autocomplete-control'
                  }
                }}
              />
            ) : (
              <div className="w-full h-10 bg-gray-100 animate-pulse rounded-md"></div>
            )}
          </div>
          
          {/* Add additional help text */}
          <p className="text-xs text-gray-500 mt-2">
            Type any destination - city, country, or landmark - and select from the dropdown results
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-xl my-3 font-medium">
          How many days are you planning your trip?
        </h2>
        <Input
          placeholder={"Ex.3"}
          type="number"
          onChange={(e) => handleInputChange("noOfDays", e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-xl my-3 font-medium">What is your Budget?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {SelectBudgetOptions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleInputChange("budget", item.title)}
              className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg transition-shadow ${
                formData?.budget === item.title ? "shadow-lg border-blue-500 bg-blue-50" : ""
              }`}
            >
              <h2 className="text-4xl">{item.icon}</h2>
              <h2 className="font-bold text-lg">{item.title}</h2>
              <h2 className="text-sm text-gray-500">{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl my-3 font-medium">
          Who do you plan on travelling with on your next adventure?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {SelectTravelesList.map((item, index) => (
            <div
              key={index}
              onClick={() => handleInputChange("traveler", item.people)}
              className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg transition-shadow ${
                formData?.traveler === item.people ? "shadow-lg border-blue-500 bg-blue-50" : ""
              }`}
            >
              <h2 className="text-4xl">{item.icon}</h2>
              <h2 className="font-bold text-lg">{item.title}</h2>
              <h2 className="text-sm text-gray-500">{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>
      <div className="my-10 justify-end flex">
        <Button 
          onClick={OnGenerateTrip} 
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              Generating...
            </>
          ) : "Generate Trip"}
        </Button>
      </div>
    </div>
  );
}

export default CreateTrip;
