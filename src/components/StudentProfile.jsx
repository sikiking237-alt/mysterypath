import React, { useState, useEffect } from "react";

const StudentProfile = ({ darkMode, onClose }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {userData.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData.name || "Student"}</h3>
          <p className="text-gray-500 mt-1">Student Account • Level {Math.floor((userData.xp || 0) / 500) + 1}</p>
          <p className="text-gray-400 text-sm mt-1">{userData.email}</p>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total XP</span>
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData.xp || 0}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Streak Days</span>
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData.streak_days || 0}</span>
            </div>
          </div>
        </div>
        
        <button onClick={onClose} className="mt-6 w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition">Close</button>
      </div>
    </div>
  );
};

export default StudentProfile;