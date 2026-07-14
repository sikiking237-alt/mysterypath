import React, { useState, useEffect, useRef } from "react";

const AdminProfile = ({ darkMode, onClose }) => {
  const [userData, setUserData] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    activeInstructors: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    loadProfileImage();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      // Fetch user profile
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fetch admin stats
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserData(data);
        setEditName(data.name || "");
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProfileImage = () => {
    const saved = localStorage.getItem("admin_profile_image");
    if (saved) setImagePreview(saved);
  };

  const showMessage = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage("Image too large (max 2MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        localStorage.setItem("admin_profile_image", reader.result);
        showMessage("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName })
      });
      if (response.ok) {
        setUserData({ ...userData, name: editName });
        setIsEditing(false);
        showMessage("Profile updated!");
      } else {
        showMessage("Update failed", "error");
      }
    } catch (error) {
      showMessage("Network error", "error");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className={`max-w-md w-full mx-4 rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      {/* Toast notification */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} animate-fade-in`}>
          {notification.msg}
        </div>
      )}

      <div 
        className={`max-w-2xl w-full mx-4 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Admin Profile</h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition text-2xl leading-none font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userData.name?.charAt(0).toUpperCase() || "A"
                )}
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md hover:scale-110 transition"
                title="Change picture"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <h3 className="text-xl font-bold mt-3">{userData.name || "Admin User"}</h3>
            <p className="text-sm text-gray-500">{userData.email}</p>
            <span className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">Administrator</span>
          </div>

          {/* Profile Info */}
          <div className="rounded-xl p-4 mb-6 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Profile Information</h4>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-sm text-red-600">✏️ Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="text-sm text-green-600">💾 Save</button>
                  <button onClick={() => { setIsEditing(false); setEditName(userData.name); }} className="text-sm text-gray-500">❌ Cancel</button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Full Name</span>
                {isEditing ? (
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-3 py-1 rounded-lg text-sm border" />
                ) : (
                  <span className="text-sm font-medium">{userData.name}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium">{userData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">XP Points</span>
                <span className="text-sm font-medium">{userData.xp || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Streak Days</span>
                <span className="text-sm font-medium">{userData.streak_days || 0}</span>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Platform Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl">👥</div>
                <div className="text-xl font-bold">{stats.totalUsers || 0}</div>
                <div className="text-xs text-gray-500">Total Users</div>
              </div>
              <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl">📚</div>
                <div className="text-xl font-bold">{stats.totalCourses || 0}</div>
                <div className="text-xs text-gray-500">Total Courses</div>
              </div>
              <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl">💰</div>
                <div className="text-xl font-bold">${stats.totalRevenue?.toLocaleString() || 0}</div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
              <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl">📖</div>
                <div className="text-xl font-bold">{stats.totalEnrollments || 0}</div>
                <div className="text-xs text-gray-500">Enrollments</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">Close</button>
            <button onClick={() => { window.location.href = "/admin-settings"; onClose(); }} className="flex-1 py-2.5 rounded-xl font-medium bg-gradient-to-r from-red-600 to-orange-600 text-white hover:opacity-90 transition">Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;