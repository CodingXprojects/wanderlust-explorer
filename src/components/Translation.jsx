import React, { useState, useEffect } from 'react';

const Translation = ({ onClose }) => {
  const [inputLang, setInputLang] = useState('');
  const [outputLang, setOutputLang] = useState('');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');

  // Supported target languages with full names and codes
  const supportedLanguages = [
    { code: 'hindi', name: 'Hindi', icon: '🇮🇳' },
    { code: 'tamil', name: 'Tamil', icon: '🇮🇳' },
    { code: 'bengali', name: 'Bengali', icon: '🇮🇳' },
    { code: 'telugu', name: 'Telugu', icon: '🇮🇳' },
    { code: 'marathi', name: 'Marathi', icon: '🇮🇳' },
    { code: 'gujarati', name: 'Gujarati', icon: '🇮🇳' }
  ];

  // Common input languages for easy selection
  const commonInputLanguages = [
    { code: 'english', name: 'English', icon: '🇬🇧' },
    { code: 'spanish', name: 'Spanish', icon: '🇪🇸' },
    { code: 'french', name: 'French', icon: '🇫🇷' },
    { code: 'german', name: 'German', icon: '🇩🇪' },
    { code: 'chinese', name: 'Chinese', icon: '🇨🇳' },
    { code: 'japanese', name: 'Japanese', icon: '🇯🇵' }
  ];

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/');
      if (response.ok) {
        setServerStatus('connected');
        setError('');
      } else {
        setServerStatus('error');
        setError('Translation server is not responding properly');
      }
    } catch (err) {
      setServerStatus('error');
      setError('Cannot connect to translation server. Please ensure it is running.');
    }
  };

  const handleTranslate = async () => {
    if (serverStatus !== 'connected') {
      await checkServerStatus();
      if (serverStatus !== 'connected') {
        return;
      }
    }

    if (!outputLang) {
      setError('Please select a target language');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          input_lang: inputLang.toLowerCase(),
          output_lang: outputLang.toLowerCase(),
          text: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.translated_text === "No translation available." || data.error) {
        setError(data.error || 'Translation failed. Please check language codes and try again.');
      } else {
        setTranslatedText(data.translated_text);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to connect to translation service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-white/95 w-[90%] max-w-5xl h-[90%] rounded-2xl p-8 relative backdrop-blur-md flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">TravelLingo Translator</h2>
            <p className="text-gray-600">Translate to Indian languages with ease</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Server Status Alert */}
        {serverStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={checkServerStatus}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Language Selection */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Source Language */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Source Language</label>
            <div className="relative">
              <select
                value={inputLang}
                onChange={(e) => setInputLang(e.target.value)}
                className="w-full p-3 border rounded-xl bg-white appearance-none cursor-pointer hover:border-blue-500 transition-colors"
              >
                <option value="">Select source language</option>
                {commonInputLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
                <option value="other">Other language...</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            {inputLang === 'other' && (
              <input
                type="text"
                placeholder="Enter language name"
                value={inputLang === 'other' ? '' : inputLang}
                onChange={(e) => setInputLang(e.target.value)}
                className="mt-2 w-full p-3 border rounded-xl"
              />
            )}
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Target Language</label>
            <div className="relative">
              <select
                value={outputLang}
                onChange={(e) => setOutputLang(e.target.value)}
                className="w-full p-3 border rounded-xl bg-white appearance-none cursor-pointer hover:border-blue-500 transition-colors"
              >
                <option value="">Select target language</option>
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Translation Area */}
        <div className="flex-1 grid grid-cols-2 gap-8">
          <div className="flex flex-col">
            <label className="block text-gray-700 font-medium mb-2">Text to Translate</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 p-4 border rounded-xl resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-700 font-medium mb-2">Translated Text</label>
            <textarea
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="flex-1 p-4 border rounded-xl bg-gray-50 resize-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && serverStatus !== 'error' && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputLang || !outputLang || !inputText || serverStatus === 'error'}
          className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Translating...
            </span>
          ) : (
            'Translate'
          )}
        </button>
      </div>
    </div>
  );
};

export default Translation;