import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Trash2, PlayCircle } from "lucide-react";

const WishlistPage = ({ darkMode }) => {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("course_wishlist");
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  const removeFromWishlist = (courseId) => {
    const updated = wishlist.filter(c => c.id !== courseId);
    setWishlist(updated);
    localStorage.setItem("course_wishlist", JSON.stringify(updated));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="text-pink-500 fill-pink-500" size={32} />
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Wishlist</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <Heart className="mx-auto mb-4 opacity-20" size={64} />
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your wishlist is empty</h3>
          <p className="text-gray-500 mt-2 mb-6">Explore our catalog and save courses you're interested in!</p>
          <button 
            onClick={() => navigate("/courses")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((course) => (
            <div key={course.id} className={`rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <img src={course.image_url} alt={course.title} className="w-full h-40 object-cover" />
              <div className="p-5">
                <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.instructor}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/course-player/${course.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    <PlayCircle size={16} /> View Course
                  </button>
                  <button 
                    onClick={() => removeFromWishlist(course.id)}
                    className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-400' : 'border-gray-200 hover:bg-gray-50 text-gray-500'} transition`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;