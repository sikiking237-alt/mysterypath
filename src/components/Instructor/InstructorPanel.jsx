import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const InstructorProfile = ({ darkMode, onClose }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [stats, setStats] = useState({
    total_courses: 0,
    total_students: 0,
    total_revenue: 0,
    average_rating: 0,
    avg_completion_rate: 0,
    active_learners: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/profile", { 
            headers: { "Authorization": `Bearer ${token}` } 
          }),
          fetch("/api/instructor/stats", { 
            headers: { "Authorization": `Bearer ${token}` } 
          })
        ]);
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUserData(data);
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className={`max-w-md w-full mx-4 rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className={`max-w-md w-full mx-4 rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl text-center`}>
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Error</h3>
          <p className="text-gray-500">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className={`max-w-md w-full mx-4 rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
            {userData.name?.charAt(0).toUpperCase() || "I"}
          </div>
          
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {userData.name || "Instructor"}
          </h3>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs rounded-full">
              👨‍🏫 Instructor
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs rounded-full">
              💎 {userData.xp || 0} XP
            </span>
          </div>
          
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {userData.email}
          </p>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-purple-50 to-pink-50'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.total_courses || 0}</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  📚 My Courses
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.total_students || 0}</div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  👥 Students
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.avg_completion_rate || 0}%
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  📈 Completion
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.average_rating || 0}⭐
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ⭐ Rating
                </div>
              </div>
            </div>
          </div>
          
          {userData.streak_days > 0 && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-orange-50'} text-center`}>
              🔥 <span className="font-semibold">{userData.streak_days} Day Streak!</span>
              <span className="text-xs text-gray-500 ml-2">
                (Best: {userData.longest_streak || 0})
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => handleNavigation("/instructor-courses")} 
            className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 transition font-medium"
          >
            📚 My Courses
          </button>
          
          <button 
            onClick={() => handleNavigation("/instructor-students")} 
            className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 transition font-medium"
          >
            👥 Students
          </button>
        </div>
        
        <div className="mt-3">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;