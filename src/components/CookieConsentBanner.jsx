import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

const CookieConsentBanner = ({ darkMode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already consented.
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // If no consent is found, show the banner.
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // You might want to disable non-essential cookies here.
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-[1000] transition-transform duration-500 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className={`max-w-4xl mx-auto p-5 rounded-2xl shadow-2xl border flex flex-col sm:flex-row items-center gap-4 ${darkMode ? 'bg-gray-800/90 backdrop-blur-lg border-gray-700' : 'bg-white/90 backdrop-blur-lg border-gray-200'}`}>
            <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Cookie className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="flex-grow text-center sm:text-left">
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>We Value Your Privacy</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                </p>
            </div>
            <div className="flex-shrink-0 flex gap-3">
                <button 
                    onClick={handleDecline}
                    className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    Decline
                </button>
                <button 
                    onClick={handleAccept}
                    className="px-5 py-2 rounded-lg font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                    Accept
                </button>
            </div>
        </div>
    </div>
  );
};

export default CookieConsentBanner;