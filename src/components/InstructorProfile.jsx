import React, { useState, useEffect } from "react";

const InstructorProfile = ({ darkMode, onClose }) => {
  const [userData, setUserData] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/instructor/stats", { headers: { Authorization: `Bearer ${token}` } })
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className={`max-w-md w-full mx-4 rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {userData.name?.charAt(0).toUpperCase() || "I"}
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData.name || "Instructor"}</h3>
          <p className="text-purple-600 mt-1">👨‍🏫 Instructor Account</p>
          <p className="text-gray-400 text-sm mt-1">{userData.email}</p>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total_courses || 0}</div>
                <div className="text-xs text-gray-500">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total_students || 0}</div>
                <div className="text-xs text-gray-500">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${stats.total_revenue || 0}</div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.average_rating || 0}⭐</div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
            </div>
          </div>
        </div>
        
        <button onClick={onClose} className="mt-6 w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition">Close</button>
      </div>
    </div>
  );
};

export default InstructorProfile;
