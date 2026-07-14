import React, { useState, useEffect, useRef } from "react";

const Profile = ({ darkMode, onClose }) => {
  const fileInputRef = useRef(null);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    joinDate: "",
    totalXP: 0,
    level: 1,
    coursesEnrolled: 0,
    coursesCompleted: 0,
    streakDays: 0,
    longestStreak: 0,
    totalActivities: 0,
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_URL = "/api";
  const token = localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const coursesRes = await fetch(`${API_URL}/my-learning`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        let enrolledCount = 0;
        let completedCount = 0;

        if (coursesRes.ok) {
          const courses = await coursesRes.json();
          enrolledCount = courses.length;
          completedCount = courses.filter((c) => c.progress === 100).length;
        }

        // Load saved avatar from localStorage or use default
        const savedAvatar = localStorage.getItem("userAvatar");

        setUserData({
          name: profile.name || localStorage.getItem("userName") || "User",
          email: profile.email || localStorage.getItem("userEmail") || "",
          joinDate: profile.created_at
            ? new Date(profile.created_at).toLocaleDateString()
            : "2024-01-01",
          totalXP: profile.xp || 0,
          level: Math.floor((profile.xp || 0) / 500) + 1,
          coursesEnrolled: enrolledCount,
          coursesCompleted: completedCount,
          streakDays: profile.streak_days || 0,
          longestStreak: profile.longest_streak || 0,
          totalActivities: profile.total_activities || 0,
          avatar:
            savedAvatar ||
            `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(profile.name || "User")}&bold=true&length=2`,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });

      if (response.ok) {
        setUserData({ ...userData, name: editName });
        localStorage.setItem("userName", editName);
        // Update avatar with new name
        const newAvatar = `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(editName)}&bold=true&length=2`;
        setUserData((prev) => ({ ...prev, avatar: newAvatar }));
        showNotification("Name updated successfully!", "success");
        setIsEditing(false);
      } else {
        showNotification("Failed to update name", "error");
      }
    } catch (error) {
      showNotification("Network error", "error");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file", "error");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Image must be less than 2MB", "error");
      return;
    }

    setUploading(true);

    // Convert to base64 for localStorage (simple solution)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      // Save to localStorage
      localStorage.setItem("userAvatar", base64String);
      setUserData((prev) => ({ ...prev, avatar: base64String }));
      showNotification("Profile picture updated!", "success");
      setUploading(false);
    };
    reader.onerror = () => {
      showNotification("Error reading file", "error");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    localStorage.removeItem("userAvatar");
    // Reset to default avatar based on name
    const defaultAvatar = `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(userData.name)}&bold=true&length=2`;
    setUserData((prev) => ({ ...prev, avatar: defaultAvatar }));
    showNotification("Profile picture removed", "info");
  };

  const stats = [
    {
      label: "Total XP",
      value: userData.totalXP,
      icon: "⭐",
      color: "text-amber-500",
    },
    {
      label: "Level",
      value: userData.level,
      icon: "🏆",
      color: "text-purple-500",
    },
    {
      label: "Courses Enrolled",
      value: userData.coursesEnrolled,
      icon: "📚",
      color: "text-blue-500",
    },
    {
      label: "Courses Completed",
      value: userData.coursesCompleted,
      icon: "🎓",
      color: "text-emerald-500",
    },
    {
      label: "Current Streak",
      value: userData.streakDays,
      icon: "🔥",
      color: "text-orange-500",
    },
    {
      label: "Longest Streak",
      value: userData.longestStreak,
      icon: "🏅",
      color: "text-yellow-500",
    },
    {
      label: "Total Activities",
      value: userData.totalActivities,
      icon: "📝",
      color: "text-indigo-500",
    },
    {
      label: "Member Since",
      value: userData.joinDate,
      icon: "📅",
      color: "text-gray-500",
    },
  ];

  const achievements = [
    {
      name: "First Course",
      icon: "🎯",
      achieved: userData.coursesEnrolled >= 1,
      description: "Enrolled in first course",
    },
    {
      name: "Course Master",
      icon: "🎓",
      achieved: userData.coursesCompleted >= 1,
      description: "Completed first course",
    },
    {
      name: "XP Hunter",
      icon: "⭐",
      achieved: userData.totalXP >= 500,
      description: "Earned 500 XP",
    },
    {
      name: "Streak Starter",
      icon: "🔥",
      achieved: userData.streakDays >= 3,
      description: "3-day learning streak",
    },
    {
      name: "Dedicated Learner",
      icon: "💪",
      achieved: userData.streakDays >= 7,
      description: "7-day learning streak",
    },
    {
      name: "XP Master",
      icon: "🏆",
      achieved: userData.totalXP >= 1000,
      description: "Earned 1000 XP",
    },
    {
      name: "Completion Expert",
      icon: "📖",
      achieved: userData.coursesCompleted >= 3,
      description: "Completed 3 courses",
    },
    {
      name: "Learning Legend",
      icon: "👑",
      achieved: userData.streakDays >= 30,
      description: "30-day learning streak",
    },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
          className={`rounded-2xl p-8 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-auto">
      <div
        className={`relative w-full max-w-4xl rounded-2xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"} max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex justify-between items-center p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"} bg-inherit z-10`}
        >
          <h2
            className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            My Profile
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            ✕
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg ${notification.type === "error" ? "bg-red-100 text-red-700" : notification.type === "info" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {notification.message}
          </div>
        )}

        <div className="p-6">
          {/* Avatar and Name Section - With Upload */}
          <div className="flex flex-col items-center mb-8">
            {/* Avatar with upload overlay */}
            <div className="relative group">
              <img
                src={userData.avatar}
                alt={userData.name}
                className="w-28 h-28 rounded-full border-4 border-purple-500 shadow-lg object-cover"
              />
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                  title="Upload photo"
                >
                  📷
                </button>
                {userData.avatar.includes("base64") && (
                  <button
                    onClick={removeImage}
                    className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition text-white"
                    title="Remove photo"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-purple-500 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                  placeholder="Enter your name"
                  autoFocus
                />
                <button
                  onClick={handleUpdateName}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4">
                <h3
                  className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {userData.name}
                </h3>
                <button
                  onClick={() => {
                    setEditName(userData.name);
                    setIsEditing(true);
                  }}
                  className="text-purple-500 hover:text-purple-600"
                  title="Edit name"
                >
                  ✏️
                </button>
              </div>
            )}

            <p
              className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {userData.email}
            </p>
            <p
              className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              Member since {userData.joinDate}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-purple-500 hover:text-purple-600"
            >
              Click avatar to change photo
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div
                  className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* XP Progress Bar */}
          <div
            className={`mb-8 p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
          >
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Progress to Level {userData.level + 1}
              </span>
              <span className="text-sm font-medium text-purple-600">
                {userData.totalXP % 500} / 500 XP
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(userData.totalXP % 500) / 5}%` }}
              />
            </div>
          </div>

          {/* Achievements Section */}
          <div
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
          >
            <h4
              className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              <span>🏅</span> Achievements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center transition-all ${
                    achievement.achieved
                      ? darkMode
                        ? "bg-purple-900/30 border border-purple-500"
                        : "bg-purple-50 border border-purple-200"
                      : darkMode
                        ? "bg-gray-800 opacity-50"
                        : "bg-gray-100 opacity-50"
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <div
                    className={`text-sm font-semibold ${achievement.achieved ? "text-purple-600" : "text-gray-500"}`}
                  >
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {achievement.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                window.location.href = "/my-certificates";
                onClose();
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              🎓 View Certificates
            </button>
            <button
              onClick={() => {
                window.location.href = "/my-learning";
                onClose();
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              📖 My Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
