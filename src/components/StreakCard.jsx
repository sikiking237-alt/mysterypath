import React, { useState, useEffect } from "react";
import { apiEndpoints } from "../config/apiConfig";

const StreakCard = ({
  streakDays,
  longestStreak,
  totalActivities,
  darkMode,
  onViewDetails,
}) => {
  const [localStreak, setLocalStreak] = useState(streakDays || 0);
  const [localLongest, setLocalLongest] = useState(longestStreak || 0);
  const [localActivities, setLocalActivities] = useState(totalActivities || 0);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Get user ID from localStorage
  const getUserId = () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Load streak data from backend
  useEffect(() => {
    loadStreakData();
  }, []);

  // Check for streak milestones and show celebration
  useEffect(() => {
    if (
      localStreak === 7 ||
      localStreak === 14 ||
      localStreak === 30 ||
      localStreak === 100
    ) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [localStreak]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userId = getUserId();

      if (!token) {
        // Demo mode
        setLocalStreak(12);
        setLocalLongest(27);
        setLocalActivities(142);
        return;
      }

      const response = await fetch(apiEndpoints.users.profile, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLocalStreak(data.streak_days || 0);
        setLocalLongest(data.longest_streak || 0);
        setLocalActivities(data.total_activities || 0);
      } else {
        // Demo data
        setLocalStreak(12);
        setLocalLongest(27);
        setLocalActivities(142);
      }
    } catch (error) {
      console.error("Error loading streak data:", error);
      setLocalStreak(12);
      setLocalLongest(27);
      setLocalActivities(142);
    } finally {
      setLoading(false);
    }
  };

  // Update streak when user completes an activity
  const updateStreak = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(apiEndpoints.users.profile, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLocalStreak(data.streak_days || 0);
        setLocalLongest(data.longest_streak || 0);
        setLocalActivities(data.total_activities || 0);
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

  // Calculate days until next goal (7 days)
  const daysUntilGoal = Math.max(0, 7 - localStreak);
  const goalProgress = Math.min(100, (localStreak / 7) * 100);

  // Calculate next milestone
  const getNextMilestone = () => {
    if (localStreak < 7)
      return { days: 7 - localStreak, reward: "🏅 7-Day Badge" };
    if (localStreak < 14)
      return { days: 14 - localStreak, reward: "🔥 14-Day Fire Badge" };
    if (localStreak < 30)
      return { days: 30 - localStreak, reward: "⭐ 30-Day Legend Badge" };
    if (localStreak < 100)
      return { days: 100 - localStreak, reward: "👑 100-Day Master Badge" };
    return { days: 0, reward: "🏆 Ultimate Champion" };
  };

  const nextMilestone = getNextMilestone();

  // Get streak level with enhanced styling
  const getStreakLevel = () => {
    if (localStreak >= 100)
      return {
        name: "Legendary Master",
        icon: "👑",
        color: "from-yellow-500 to-amber-700",
        bgColor: "bg-gradient-to-r from-yellow-500/20 to-amber-700/20",
      };
    if (localStreak >= 30)
      return {
        name: "Legendary",
        icon: "🏆",
        color: "from-yellow-500 to-amber-600",
        bgColor: "bg-gradient-to-r from-yellow-500/20 to-amber-600/20",
      };
    if (localStreak >= 14)
      return {
        name: "On Fire",
        icon: "🔥",
        color: "from-orange-500 to-red-600",
        bgColor: "bg-gradient-to-r from-orange-500/20 to-red-600/20",
      };
    if (localStreak >= 7)
      return {
        name: "Consistent",
        icon: "⭐",
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-gradient-to-r from-blue-500/20 to-indigo-600/20",
      };
    if (localStreak >= 3)
      return {
        name: "Getting Started",
        icon: "🌱",
        color: "from-green-500 to-emerald-600",
        bgColor: "bg-gradient-to-r from-green-500/20 to-emerald-600/20",
      };
    return {
      name: "Beginner",
      icon: "🌱",
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gradient-to-r from-gray-500/20 to-gray-600/20",
    };
  };

  const streakLevel = getStreakLevel();

  // Get motivational message based on streak
  const getMotivationalMessage = () => {
    if (localStreak === 0) return "✨ Start your streak by logging in daily!";
    if (localStreak === 1) return "🎉 Great start! Keep it going tomorrow!";
    if (localStreak === 3) return "🔥 You're on fire! 3 days strong!";
    if (localStreak === 7) return "🏆 Amazing! You've reached 7 days!";
    if (localStreak === 14) return "🌟 Incredible! 2 weeks of learning!";
    if (localStreak === 30) return "👑 Legendary! You're a learning master!";
    if (localStreak === 100)
      return "🏆 Ultimate Champion! 100 days of greatness!";
    if (localStreak > 7 && localStreak < 14)
      return `🎯 ${localStreak} days strong! You're building an amazing habit!`;
    if (localStreak >= 14 && localStreak < 30)
      return `⚡ ${localStreak} days! You're unstoppable!`;
    if (localStreak >= 30)
      return `👑 ${localStreak} days of excellence! Keep shining!`;
    return `💪 Day ${localStreak} of your learning journey!`;
  };

  if (loading) {
    return (
      <div
        className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-100"} animate-pulse`}
      >
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-100"} transition-all duration-300 hover:shadow-md`}
    >
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce text-8xl">
            {localStreak === 7 && "🏅"}
            {localStreak === 14 && "🔥"}
            {localStreak === 30 && "👑"}
            {localStreak === 100 && "🏆"}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2
            className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            🔥 Daily Learning Streak
          </h2>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Keep the momentum going!
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full bg-gradient-to-r ${streakLevel.color} text-white text-sm font-semibold shadow-sm`}
        >
          {streakLevel.icon} {streakLevel.name}
        </div>
      </div>

      {/* Main Streak Display */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <div className="text-8xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {localStreak}
          </div>
          <div className="absolute -top-2 -right-8 text-4xl animate-pulse">
            🔥
          </div>
        </div>
        <div
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-2`}
        >
          days in a row!
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone.days > 0 && (
        <div className="mb-4 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-purple-600 dark:text-purple-400">
              🎯 Next Milestone
            </span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {nextMilestone.reward}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              {nextMilestone.days} days to go!
            </span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {Math.round(
                (localStreak / (localStreak + nextMilestone.days)) * 100,
              )}
              %
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
              style={{
                width: `${(localStreak / (localStreak + nextMilestone.days)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Goal Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
            🎯 {daysUntilGoal} days to 7-day goal
          </span>
          <span className="font-semibold text-indigo-600">
            {Math.round(goalProgress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className={`text-center p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} transition-all hover:scale-105`}
        >
          <div className="text-2xl mb-1">🔥</div>
          <div
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {localStreak}
          </div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div
          className={`text-center p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} transition-all hover:scale-105`}
        >
          <div className="text-2xl mb-1">🏆</div>
          <div
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {localLongest}
          </div>
          <div className="text-xs text-gray-500">Longest</div>
        </div>
        <div
          className={`text-center p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} transition-all hover:scale-105`}
        >
          <div className="text-2xl mb-1">📊</div>
          <div
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {localActivities}
          </div>
          <div className="text-xs text-gray-500">Activities</div>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Daily Challenge
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500">
              Complete 1 lesson to earn +50 XP bonus!
            </div>
          </div>
          <button
            onClick={() =>
              alert(
                "🎯 Daily Challenge: Watch a video lesson or complete a quiz to earn bonus XP!",
              )
            }
            className="px-3 py-1 text-xs bg-amber-500 text-white rounded-full hover:bg-amber-600 transition"
          >
            Claim →
          </button>
        </div>
      </div>

      {/* Motivational Message */}
      <div
        className={`p-3 rounded-lg text-center ${darkMode ? "bg-indigo-900/20" : "bg-indigo-50"} transition-all`}
      >
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* View Details Button for Navigation */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 10px 25px -5px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <span>View Detailed Analytics</span>
          <span className="group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">
          Track your progress and get personalized insights
        </p>
      </div>

      {/* Streak Tips */}
      <div className="mt-3 text-center">
        <details className="text-xs cursor-pointer">
          <summary
            className={`${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"} transition`}
          >
            💡 Tips to maintain your streak
          </summary>
          <div
            className={`mt-2 p-2 rounded text-left ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
          >
            <ul className="space-y-1 text-xs">
              <li>• 📅 Set a daily learning reminder</li>
              <li>• 🎯 Start with small, achievable goals</li>
              <li>• 📚 Keep a dedicated study space</li>
              <li>• 🤝 Join study groups for accountability</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default StreakCard;
