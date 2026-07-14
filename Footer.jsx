import React from 'react';
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = ({ darkMode }) => {
  return (
    <footer className={`border-t ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MysteryPath
            </span>
            <span className="text-xs text-gray-400">© 2024</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/legal" className={`hover:text-purple-500 transition ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Legal
            </Link>
            <Link to="/privacy-policy" className={`hover:text-purple-500 transition ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className={`hover:text-purple-500 transition ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Terms of Service
            </Link>
            <Link to="/contact" className={`hover:text-purple-500 transition ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Contact
            </Link>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-400">
            Made with <Heart size={14} className="text-red-500 fill-red-500" /> for learners
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;