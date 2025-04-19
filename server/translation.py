import requests
import json

def translate(input_lang: str, output_lang: str, text: str):
    endpoint = "https://magicloops.dev/api/loop/284a7aab-329a-4c54-b5e6-030e632ea73a/run"
    headers = {"Content-Type": "application/json"}
    
    # Normalize language codes
    output_lang = output_lang.lower().strip()
    input_lang = input_lang.lower().strip()
    
    # Language code mapping (API expects these exact formats)
    language_mapping = {
        'hindi': 'Hindi',
        'tamil': 'Tamil',
        'bengali': 'Bengali',
        'telugu': 'Telugu',
        'marathi': 'Marathi',
        'gujarati': 'Gujarati'
    }
    
    # Get the correct API format for the language
    api_output_lang = language_mapping.get(output_lang, output_lang)
    
    payload = {
        "input_language": input_lang,
        "output_language": api_output_lang,
        "text": text
    }

    try:
        print(f"Sending request with payload: {json.dumps(payload, indent=2)}")
        response = requests.post(endpoint, headers=headers, json=payload)
        response.raise_for_status()
        llm_output = response.json()
        
        print("Full API Response:", json.dumps(llm_output, indent=2))
        
        if isinstance(llm_output, dict):
            # Try different possible keys in order of preference
            possible_keys = [
                api_output_lang,  # Try the exact API format first
                output_lang,      # Try the lowercase version
                'response',       # Try common response keys
                'translated_text',
                'translation'
            ]
            
            for key in possible_keys:
                if key in llm_output and isinstance(llm_output[key], str):
                    return llm_output[key]
            
            # If no direct key match, try looking in the response for any translated text
            for key, value in llm_output.items():
                if isinstance(value, str) and value != text and value != input_lang and value != output_lang:
                    return value
        
        print(f"Could not find translation in response. Output format did not match expected structure.")
        return "Translation failed. Please try again."
    
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {str(e)}")
        return f"Translation service error: {str(e)}"
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return f"An unexpected error occurred: {str(e)}"

if __name__ == "__main__":
    source_lang = input("Enter the source language: ")
    target_lang = input("Enter the target language: ")
    text_to_translate = input("Enter the text to translate: ")
    result = translate(source_lang, target_lang, text_to_translate)
    print("Translated text:", result)

