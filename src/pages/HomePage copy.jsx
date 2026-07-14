import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import StreakCard from "../components/StreakCard";
import ActivityLog from "../components/ActivityLog";
import Toolkit from "../components/Toolkit";
import Courses from "../components/Courses";
import Chat from "../components/Chat";
import Leaderboard from "../components/Leaderboard";

const HomePage = ({ userName, onLogout, darkMode, setDarkMode }) => {
  const [userData, setUserData] = useState({
    name: userName,
    xp: 0,
    streak: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    studyHours: 0
  });

  useEffect(() => {
    // Load user data from localStorage or API
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData({
      name: userName || user.name || 'Student',
      xp: user.xp || 1250,
      streak: user.streak || 3,
      enrolledCourses: 3,
      completedCourses: 1,
      studyHours: 21.5
    });
  }, [userName]);

  const weeklyData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3 },
    { day: 'Wed', hours: 1.5 },
    { day: 'Thu', hours: 4 },
    { day: 'Fri', hours: 2 },
    { day: 'Sat', hours: 5 },
    { day: 'Sun', hours: 3.5 }
  ];

  const achievements = [
    { title: "First Step", description: "Enrolled in first course", status: "completed", time: "Just now", icon: "🌱" },
    { title: "On Fire", description: "7-day learning streak", status: "active", time: "Active", icon: "🔥" },
    { title: "XP Hunter", description: "Earn 500 XP", status: "achieved", time: "Achieved", icon: "⭐" },
    { title: "Course Master", description: "Complete 3 courses", status: "in-progress", time: "In Progress", icon: "🎓" }
  ];

  const stats = [
    { title: "Total Courses", value: "3", icon: "📚" },
    { title: "Enrolled", value: "3", icon: "📖" },
    { title: "Completed", value: "0", icon: "🎓" },
    { title: "Study Hours", value: "21.5h", icon: "⏰" }
  ];

  const toolkitItems = [
    { title: "Course Progress", description: "Track your learning journey", value: "48% Complete", icon: "📊", link: "/my-learning" },
    { title: "Learning Streak", description: "Daily consistency", value: "0 Days", icon: "🔥", link: "/my-learning" },
    { title: "XP Points", description: "Total experience earned", value: "3200 XP", icon: "⭐", link: "/profile" },
    { title: "Certificates", description: "Achievements unlocked", value: "0 Earned", icon: "🎓", link: "/my-certificates" },
    { title: "Study Timer", description: "Focus session tracker", value: "Start Session", icon: "⏱️", link: "#" },
    { title: "Notes Library", description: "Your saved notes", value: "View Notes", icon: "📝", link: "#" },
    { title: "Community", description: "Join discussions", value: "Join Now", icon: "💬", link: "#" },
    { title: "Help Center", description: "Get support", value: "Learn More", icon: "❓", link: "#" }
  ];

  const features = [
    { icon: "🎓", title: "Expert Instructors", description: "Learn from industry professionals" },
    { icon: "⚡", title: "Learn at Your Pace", description: "Lifetime access, flexible schedule" },
    { icon: "🏆", title: "Get Certified", description: "Earn recognized certificates" },
    { icon: "💬", title: "Community Support", description: "Join vibrant learner community" },
    { icon: "📱", title: "Mobile Friendly", description: "Learn anywhere, anytime" },
    { icon: "🎯", title: "Career Focused", description: "Skills that matter for your career" }
  ];

  const quickActions = [
    { title: "Browse Courses", icon: "📚", link: "/courses" },
    { title: "Leaderboard", icon: "🏆", link: "/leaderboard" },
    { title: "Daily Goal", icon: "🎯", link: "#" },
    { title: "Invite Friend", icon: "📧", link: "#" }
  ];

  return (
    <div style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Hero Section - No margin/padding at top */}
      <div style={{ marginTop: -20, paddingTop: 0 }}>
        <Hero darkMode={darkMode} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {userData.name}! 👋
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Here's your learning dashboard and toolkit
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Weekly Activity Chart */}
        <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 Weekly Learning Activity</h2>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total 21.5 hours this week</p>
          <div className="flex justify-between items-end h-48 gap-2">
            {weeklyData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-lg transition-all duration-500" style={{ height: `${(item.hours / 5) * 100}px` }}>
                  <div className="w-full bg-indigo-600 rounded-t-lg h-full" style={{ height: `${(item.hours / 5) * 100}%` }}></div>
                </div>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.day}</span>
                <span className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>{item.hours}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak and Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StreakCard streak={userData.streak} darkMode={darkMode} />
          <ActivityLog activities={[]} darkMode={darkMode} />
        </div>

        {/* Toolkit Section */}
        <Toolkit darkMode={darkMode} />

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <button key={idx} onClick={() => window.location.href = action.link} className={`p-3 rounded-lg text-center transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="text-2xl mb-1">{action.icon}</div>
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{action.title}</div>
                <div className="text-xs text-gray-500 mt-1">→</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏆 Recent Achievements</h2>
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{achievement.title}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{achievement.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${achievement.status === 'completed' ? 'bg-green-100 text-green-700' : achievement.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {achievement.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Learning Tip */}
        <div className={`p-4 rounded-xl mb-8 ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'} border ${darkMode ? 'border-indigo-800' : 'border-indigo-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Learning Tip</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>"Consistency beats intensity. Just 30 minutes of learning each day can transform your skills in 3 months!"</p>
            </div>
          </div>
        </div>

        {/* Why Choose MysteryPath */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Why Choose MysteryPath?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className={`p-6 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Courses Section */}
        <Courses darkMode={darkMode} />

        {/* Live Chat */}
        <div className={`rounded-xl p-6 mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>💬 Live Chat</h2>
          <Chat darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;