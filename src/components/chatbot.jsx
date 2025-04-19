import React, { useState, useEffect } from 'react';
import './chatbot.css';

const API_CONFIG = {
    apiKey: import.meta.env.VITE_GOOGLE_GEMINI__AI_API_KEY, // Using environment variable
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", // Gemini endpoint
    model: "gemini-1.5-pro" // Gemini model
};

const TRAVEL_KNOWLEDGE = {
    popularDestinations: [
        { name: "Taj Mahal, Agra", region: "North India", description: "Iconic white marble mausoleum" },
        { name: "Kerala Backwaters", region: "South India", description: "Serene network of lagoons and lakes" },
        { name: "Jaipur", region: "Rajasthan", description: "The Pink City with magnificent forts and palaces" },
        { name: "Varanasi", region: "North India", description: "Ancient city on the banks of the Ganges" },
        { name: "Goa", region: "West India", description: "Beach paradise with Portuguese influence" }
    ],
    hiddenGems: [
        { name: "Ziro Valley", region: "Northeast India", description: "Beautiful valley home to the Apatani tribe" },
        { name: "Gokarna", region: "Karnataka", description: "Pristine beaches and temple town" },
        { name: "Mawlynnong", region: "Meghalaya", description: "Asia's cleanest village with living root bridges" },
        { name: "Spiti Valley", region: "Himachal Pradesh", description: "Cold desert mountain valley" },
        { name: "Majuli", region: "Assam", description: "World's largest river island" }
    ],
    bestTimeToVisit: {
        "North India": "October to March (avoiding extreme summer heat)",
        "South India": "October to February (pleasant temperatures, less rainfall)",
        "Northeast India": "March to June and September to November",
        "Western India": "November to February",
        "Central India": "October to March"
    },
    majorFestivals: [
        { name: "Diwali", timing: "October/November", description: "Festival of lights" },
        { name: "Holi", timing: "March", description: "Festival of colors" },
        { name: "Durga Puja", timing: "September/October", description: "Major festival in Eastern India" },
        { name: "Pushkar Camel Fair", timing: "November", description: "Vibrant camel fair in Rajasthan" }
    ]
};

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);

    const analyzeTravelIntent = (userInput) => {
        const input = userInput.toLowerCase();
        let intent = {
            type: "general",
            region: "",
            activity: "",
            timing: "",
            budget: ""
        };

        const regions = [
            "north india", "south india", "east india", "west india", "central india", 
            "northeast", "rajasthan", "kerala", "goa", "himalayas", "kashmir", "ladakh",
            "tamil nadu", "karnataka", "maharashtra", "gujarat", "delhi", "mumbai", "bangalore"
        ];
        
        const activities = ["hiking", "trekking", "beach", "food", "history", "culture", 
            "temple", "monument", "wildlife", "safari", "yoga", "meditation",
            "shopping", "festival", "ayurveda", "backwaters", "mountain"
        ];
        
        const timings = ["january", "february", "march", "april", "may", "june", "july", 
            "august", "september", "october", "november", "december",
            "winter", "summer", "monsoon", "spring"
        ];
        
        const budgets = ["budget", "cheap", "affordable", "luxury", "expensive", "mid-range"];

        // Check for matches
        for (const region of regions) {
            if (input.includes(region)) {
                intent.type = "destination";
                intent.region = region;
                break;
            }
        }

        for (const activity of activities) {
            if (input.includes(activity)) {
                intent.activity = activity;
                break;
            }
        }

        for (const time of timings) {
            if (input.includes(time)) {
                intent.timing = time;
                break;
            }
        }

        for (const budget of budgets) {
            if (input.includes(budget)) {
                intent.budget = budget;
                break;
            }
        }

        return intent;
    };

    const getBasicResponse = (userInput, intent) => {
        const query = userInput.toLowerCase();
        
        if (query.includes("popular") && query.includes("destination")) {
            return TRAVEL_KNOWLEDGE.popularDestinations.map(dest => 
                `- ${dest.name} - ${dest.description}`
            ).join('\n');
        }
        else if (query.includes("hidden") || query.includes("offbeat") || query.includes("gem")) {
            return TRAVEL_KNOWLEDGE.hiddenGems.map(gem => 
                `- ${gem.name} - ${gem.description}`
            ).join('\n');
        }
        else if (query.includes("best time") || query.includes("when to visit")) {
            return Object.entries(TRAVEL_KNOWLEDGE.bestTimeToVisit)
                .map(([region, time]) => `- ${region}: ${time}`)
                .join('\n');
        }
        // ... Include other response types as needed

        return `Thank you for your question about Indian travel! To give you the best information about ${userInput}, I'd recommend exploring specific destinations, activities, or travel periods you're interested in. India offers incredible diversity across its regions.`;
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        
        // Add user message
        setMessages(prev => [...prev, { type: 'user', text: input }]);
        const userInput = input;
        setInput('');

        // Show typing indicator
        setMessages(prev => [...prev, { type: 'bot', text: 'Typing...', isTyping: true }]);

        try {
            const travelIntent = analyzeTravelIntent(userInput);
            
            // Format conversation history with system instructions
            let formattedHistory = [
                {
                    role: "user",
                    parts: [{ text: "You are an India Travel Assistant chatbot. Provide helpful, accurate, and enthusiastic advice about traveling in India. Focus on personalized recommendations. Showcase India's rich culture, diverse geography, and vibrant heritage. Keep responses concise and conversational." }]
                },
                {
                    role: "model",
                    parts: [{ text: "I understand. I'll act as an India Travel Assistant providing helpful information about traveling in India." }]
                }
            ];

            // Add previous conversation history
            conversationHistory.forEach(msg => {
                formattedHistory.push({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.content }]
                });
            });

            // Add current user message
            formattedHistory.push({
                role: "user",
                parts: [{ text: userInput }]
            });

            const response = await fetch(`${API_CONFIG.endpoint}?key=${API_CONFIG.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: formattedHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                    },
                }),
            });

            const data = await response.json();
            
            // Remove typing indicator
            setMessages(prev => prev.filter(msg => !msg.isTyping));

            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                const botResponse = data.candidates[0].content.parts[0].text;
                setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
                setConversationHistory(prev => [...prev, 
                    { role: 'user', content: userInput },
                    { role: 'assistant', content: botResponse }
                ]);
            } else {
                // Fallback to basic response
                const basicResponse = getBasicResponse(userInput, travelIntent);
                setMessages(prev => [...prev, { type: 'bot', text: basicResponse }]);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => prev.filter(msg => !msg.isTyping));
            setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble connecting right now. Please try again later." }]);
        }
    };

    useEffect(() => {
        // Send welcome message
        setMessages([{
            type: 'bot',
            text: "Namaste! 🙏 I'm your India Travel Assistant. I can help you discover the wonders of India, from the majestic Himalayas to the serene beaches of Kerala. What would you like to know about traveling in India?"
        }]);
    }, []);

    return (
        <div className="chatbot-container ">
            <div className="chatbot-header">
                <h3>India Travel Assistant</h3>
            </div>
            <div className="chat-messages" id="chat-messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message ${msg.type === 'bot' ? 'bot-message' : 'user-message'}`}
                        dangerouslySetInnerHTML={{
                            __html: msg.text
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/\n/g, '<br>')
                        }}
                    />
                ))}
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about traveling in India..."
                />
                <button id="send-button" onClick={handleSendMessage}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                </button>
            </div>
            <div className="chatbot-suggestions">
                <button className="suggestion-btn" onClick={() => setInput('Popular destinations in India')}>Popular destinations</button>
                <button className="suggestion-btn" onClick={() => setInput('Best time to visit Rajasthan')}>Best time to visit</button>
                <button className="suggestion-btn" onClick={() => setInput('Indian cuisine guide')}>Food recommendations</button>
                <button className="suggestion-btn" onClick={() => setInput('7-day North India itinerary')}>Itinerary ideas</button>
            </div>
        </div>
    );
};

export default Chatbot;