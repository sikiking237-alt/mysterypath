import React, { useState, useEffect, useRef } from "react";

const AdminProfile = ({ darkMode, onClose }) => {
  const [userData, setUserData] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    loadProfileImage();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserData(data);
        setEditName(data.name || "");
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileImage = () => {
    const saved = localStorage.getItem("admin_profile_image");
    if (saved) setImagePreview(saved);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        localStorage.setItem("admin_profile_image", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName })
      });
      setUserData({ ...userData, name: editName });
      setIsEditing(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className={`w-80 rounded-xl p-6 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className={`w-[400px] rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex justify-between items-center">
          <h3 className="text-white font-semibold text-sm">Admin Profile</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  userData.name?.charAt(0).toUpperCase() || "A"
                )}
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm px-2 py-1 rounded border w-32" />
                  <button onClick={handleSaveProfile} className="text-green-600 text-xs">💾</button>
                  <button onClick={() => { setIsEditing(false); setEditName(userData.name); }} className="text-gray-500 text-xs">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{userData.name}</span>
                  <button onClick={() => setIsEditing(true)} className="text-gray-400 text-xs">✏️</button>
                </div>
              )}
              <p className="text-xs text-gray-500">{userData.email}</p>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500">Users</div>
              <div className="font-bold text-lg">{stats.totalUsers || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500">Courses</div>
              <div className="font-bold text-lg">{stats.totalCourses || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500">Revenue</div>
              <div className="font-bold text-lg">${stats.totalRevenue || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500">Enrollments</div>
              <div className="font-bold text-lg">{stats.totalEnrollments || 0}</div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-xs space-y-1 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">XP:</span><span>{userData.xp || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Streak:</span><span>{userData.streak_days || 0} days</span></div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg">Close</button>
            <button onClick={() => { window.location.href = "/admin-settings"; onClose(); }} className="flex-1 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg">Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;