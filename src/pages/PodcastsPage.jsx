import React, { useState } from "react";
import { Headphones, Play, Clock, User, Share2 } from "lucide-react";

const PodcastsPage = ({ darkMode }) => {
  const [podcasts] = useState([
    { id: 1, title: "The Future of Web Development", host: "Sarah Drasner", duration: "45 min", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop" },
    { id: 2, title: "Mastering React Hooks", host: "Kent C. Dodds", duration: "32 min", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop" },
    { id: 3, title: "Data Science Ethics", host: "Cathy O'Neil", duration: "58 min", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop" },
    { id: 4, title: "UI Design Principles", host: "Gary Simon", duration: "25 min", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop" }
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg">
          <Headphones size={24} />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learning Podcasts</h1>
          <p className="text-gray-500">Expand your horizons while you're on the go</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {podcasts.map((podcast) => (
          <div 
            key={podcast.id} 
            className={`group rounded-3xl border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
          >
            <div className="relative aspect-square overflow-hidden">
              <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="p-4 bg-white rounded-full text-purple-600 shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                  <Play size={24} fill="currentColor" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className={`font-bold text-lg mb-2 line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{podcast.title}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User size={14} className="text-purple-500" />
                  <span>{podcast.host}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={14} className="text-purple-500" />
                  <span>{podcast.duration}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                  Listen Now
                </button>
                <button className={`p-2 rounded-xl border ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Playlist */}
      <div className={`mt-12 p-8 rounded-3xl border-2 border-dashed ${darkMode ? 'border-purple-500/20 bg-purple-900/10' : 'border-purple-100 bg-purple-50/50'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Weekly Mix</h2>
            <p className="text-gray-500">A collection of shorts tailored to your current enrollment in "React Mastery"</p>
          </div>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/25 hover:scale-105 transition">
            Generate My Mix
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodcastsPage;