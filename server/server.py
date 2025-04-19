from flask import Flask, request, jsonify
from flask_cors import CORS
from translation import translate
import logging
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Google Places API key - modified to get from environment directly 
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
logger.info(f"API key loaded: {'Successfully loaded' if GOOGLE_PLACES_API_KEY else 'Failed to load'}")

app = Flask(__name__)
# Enable CORS for all origins in development
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type"]
    }
})

# Add a health check endpoint
@app.route('/', methods=['GET'])
def health_check():
    api_status = "API key loaded" if GOOGLE_PLACES_API_KEY else "API key missing"
    return jsonify({"status": "healthy", "message": f"Server is running. {api_status}"}), 200

@app.route('/translate', methods=['POST', 'OPTIONS'])
def translate_text():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        logger.info(f"Received translation request: {data}")
        
        input_lang = data.get('input_lang')
        output_lang = data.get('output_lang')
        text = data.get('text')
        
        if not all([input_lang, output_lang, text]):
            logger.error("Missing required parameters")
            return jsonify({'error': 'Missing required parameters'}), 400
        
        translated_text = translate(input_lang, output_lang, text)
        logger.info(f"Translation successful: {translated_text}")
        return jsonify({'translated_text': translated_text})
    
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/place-photos', methods=['GET'])
def get_place_photos():
    try:
        # Get place name from query parameters
        place_name = request.args.get('query')
        if not place_name:
            return jsonify({'error': 'Missing place name parameter'}), 400
        
        logger.info(f"Searching for images of place: {place_name}")
        
        # Step 1: Search for the place to get place_id
        search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        search_params = {
            'input': place_name,
            'inputtype': 'textquery',
            'fields': 'photos,place_id,name',
            'key': GOOGLE_PLACES_API_KEY
        }
        
        search_response = requests.get(search_url, params=search_params)
        search_data = search_response.json()
        
        logger.info(f"Place search response: {search_data}")
        
        if search_data.get('status') != 'OK' or not search_data.get('candidates'):
            return jsonify({
                'status': 'not_found',
                'message': f"No place found for: {place_name}"
            }), 404
        
        # Get the first candidate
        place = search_data['candidates'][0]
        
        # Check if the place has photos
        if not place.get('photos'):
            return jsonify({
                'status': 'no_photos',
                'message': f"No photos available for: {place_name}"
            }), 404
        
        # Get photo reference
        photo_reference = place['photos'][0]['photo_reference']
        
        # Construct the photo URL
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_reference}&key={GOOGLE_PLACES_API_KEY}"
        
        return jsonify({
            'status': 'success',
            'place_name': place.get('name', place_name),
            'photoUrl': photo_url
        })
    
    except Exception as e:
        logger.error(f"Place photos error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Server starting on http://127.0.0.1:5000")
    try:
        app.run(host='127.0.0.1', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")