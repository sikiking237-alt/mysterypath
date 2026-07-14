import React from "react";
import { useNavigate } from "react-router-dom";

const Toolkit = ({ darkMode, userData, onNavigate }) => {
  const navigate = useNavigate();
  
  // Use either the passed onNavigate or the local navigate
  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const tools = [
    {
      id: 1,
      title: "Course Progress",
      icon: "📊",
      description: "Track your learning journey",
      color: "#6366f1",
      action: () => handleNavigation("/"),
      stat: `${userData?.totalProgress || 0}% Complete`,
      tooltip: "View your overall course progress"
    },
    {
      id: 2,
      title: "Learning Streak",
      icon: "🔥",
      description: "Daily consistency",
      color: "#f59e0b",
      action: () => handleNavigation("/"),
      stat: `${userData?.streakDays || 0} Days`,
      tooltip: "Your current learning streak"
    },
    {
      id: 3,
      title: "XP Points",
      icon: "⭐",
      description: "Total experience earned",
      color: "#10b981",
      action: () => handleNavigation("/"),
      stat: `${userData?.xp || 0} XP`,
      tooltip: "Experience points earned"
    },
    {
      id: 4,
      title: "Certificates",
      icon: "🎓",
      description: "Achievements unlocked",
      color: "#8b5cf6",
      action: () => handleNavigation("/my-certificates"),
      stat: `${userData?.certificates || 0} Earned`,
      tooltip: "View your certificates"
    },
    {
      id: 5,
      title: "Study Timer",
      icon: "⏱️",
      description: "Focus session tracker",
      color: "#ef4444",
      action: () => {
        // You can implement a modal or navigate to a timer page
        alert("Study Timer: 25 minutes focus session started!");
      },
      stat: "Start Session",
      tooltip: "Start a focused study session"
    },
    {
      id: 6,
      title: "Notes Library",
      icon: "📝",
      description: "Your saved notes",
      color: "#06b6d4",
      action: () => handleNavigation("/notes"),
      stat: "View Notes",
      tooltip: "Access your saved notes"
    },
    {
      id: 7,
      title: "Community",
      icon: "💬",
      description: "Join discussions",
      color: "#ec4899",
      action: () => handleNavigation("/community"),
      stat: "Join Now",
      tooltip: "Connect with other learners"
    },
    {
      id: 8,
      title: "Help Center",
      icon: "❓",
      description: "Get support",
      color: "#64748b",
      action: () => handleNavigation("/support"),
      stat: "Learn More",
      tooltip: "Get help and support"
    }
  ];

  const quickActions = [
    { icon: "📚", label: "Browse Courses", action: () => handleNavigation("/courses"), color: "#6366f1", tooltip: "Explore all courses" },
    { icon: "🏆", label: "Leaderboard", action: () => handleNavigation("/achievements"), color: "#f59e0b", tooltip: "See top learners" },
    { icon: "🎯", label: "Daily Goal", action: () => handleNavigation("/"), color: "#10b981", tooltip: "Set your daily goal" },
    { icon: "📧", label: "Invite Friend", action: () => alert("Share invite link with friends"), color: "#8b5cf6", tooltip: "Invite friends to join" }
  ];

  // Rest of your component remains the same...
  const achievements = [
    { icon: "🌱", name: "First Step", description: "Enrolled in first course", earned: userData?.enrolledCourses > 0, date: "Just now", tooltip: "Complete your first enrollment" },
    { icon: "🔥", name: "On Fire", description: "7-day learning streak", earned: userData?.streakDays >= 7, date: "Active", tooltip: "Maintain a 7-day streak" },
    { icon: "⭐", name: "XP Hunter", description: "Earn 500 XP", earned: userData?.xp >= 500, date: userData?.xp >= 500 ? "Achieved" : "In Progress", tooltip: "Earn 500 XP points" },
    { icon: "🎓", name: "Course Master", description: "Complete 3 courses", earned: userData?.completedCourses >= 3, date: userData?.completedCourses >= 3 ? "Achieved" : "In Progress", tooltip: "Complete 3 courses" }
  ];

  const weeklyData = [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3 },
    { day: "Wed", hours: 1.5 },
    { day: "Thu", hours: 4 },
    { day: "Fri", hours: 2 },
    { day: "Sat", hours: 5 },
    { day: "Sun", hours: 3.5 }
  ];

  const maxHours = Math.max(...weeklyData.map(d => d.hours));
  const totalHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "700",
          color: darkMode ? "white" : "#1f2937",
          marginBottom: "8px"
        }}>
          Welcome back, {userData?.name}! 👋
        </h1>
        <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "16px" }}>
          Here's your learning dashboard and toolkit
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "32px"
      }}>
        {[
          { label: "Total Courses", value: userData?.totalCourses || 0, icon: "📚", color: "#6366f1", tooltip: "Total available courses" },
          { label: "Enrolled", value: userData?.enrolledCourses || 0, icon: "📖", color: "#10b981", tooltip: "Courses you've enrolled in" },
          { label: "Completed", value: userData?.completedCourses || 0, icon: "🎓", color: "#f59e0b", tooltip: "Courses you've completed" },
          { label: "Study Hours", value: totalHours, icon: "⏰", color: "#8b5cf6", suffix: "h", tooltip: "Total study hours this week" }
        ].map((stat, i) => (
          <div key={i} data-tooltip={stat.tooltip} style={{
            background: darkMode ? "#1e293b" : "white",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "transform 0.2s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "32px" }}>{stat.icon}</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>
                {stat.value}{stat.suffix || ""}
              </span>
            </div>
            <h3 style={{ color: darkMode ? "#cbd5e1" : "#475569", fontSize: "14px", fontWeight: "500" }}>
              {stat.label}
            </h3>
          </div>
        ))}
      </div>

      {/* Weekly Progress Chart */}
      <div style={{
        background: darkMode ? "#1e293b" : "white",
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: darkMode ? "white" : "#1f2937" }}>
            📊 Weekly Learning Activity
          </h3>
          <span style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "14px" }}>
            Total {totalHours} hours this week
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          {weeklyData.map((day, i) => (
            <div key={i} data-tooltip={`${day.hours} hours on ${day.day}`} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: `${(day.hours / maxHours) * 150}px`,
                background: "linear-gradient(180deg, #667eea, #764ba2)",
                borderRadius: "8px 8px 4px 4px",
                marginBottom: "8px",
                transition: "height 0.3s",
                position: "relative"
              }}>
                <div style={{
                  position: "absolute",
                  top: "-20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "11px",
                  color: darkMode ? "#94a3b8" : "#64748b",
                  whiteSpace: "nowrap"
                }}>
                  {day.hours}h
                </div>
              </div>
              <div style={{ fontSize: "12px", color: darkMode ? "#94a3b8" : "#64748b" }}>{day.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Toolkit Grid */}
      <h2 style={{
        fontSize: "24px",
        fontWeight: "700",
        color: darkMode ? "white" : "#1f2937",
        marginBottom: "20px"
      }}>
        🛠️ Learning Toolkit
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "40px"
      }}>
        {tools.map(tool => (
          <div
            key={tool.id}
            onClick={tool.action}
            data-tooltip={tool.tooltip}
            style={{
              background: darkMode ? "#1e293b" : "white",
              borderRadius: "20px",
              padding: "24px",
              cursor: "pointer",
              transition: "all 0.3s",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "100px",
              height: "100px",
              background: `radial-gradient(circle, ${tool.color}10, transparent)`,
              borderRadius: "50%"
            }} />
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{tool.icon}</div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: darkMode ? "white" : "#1f2937", marginBottom: "8px" }}>
              {tool.title}
            </h3>
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "14px", marginBottom: "16px" }}>
              {tool.description}
            </p>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              background: `${tool.color}20`,
              color: tool.color,
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              {tool.stat}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Achievements */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px"
      }}>
        {/* Quick Actions */}
        <div style={{
          background: darkMode ? "#1e293b" : "white",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: darkMode ? "white" : "#1f2937", marginBottom: "16px" }}>
            ⚡ Quick Actions
          </h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.action}
                data-tooltip={action.tooltip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: darkMode ? "#0f172a" : "#f8fafc",
                  border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%"
                }}
              >
                <span style={{ fontSize: "24px" }}>{action.icon}</span>
                <span style={{ flex: 1, textAlign: "left", color: darkMode ? "white" : "#1f2937", fontWeight: "500" }}>
                  {action.label}
                </span>
                <span style={{ color: action.color }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div style={{
          background: darkMode ? "#1e293b" : "white",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: darkMode ? "white" : "#1f2937", marginBottom: "16px" }}>
            🏆 Recent Achievements
          </h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {achievements.map((achievement, i) => (
              <div
                key={i}
                data-tooltip={achievement.tooltip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: achievement.earned ? (darkMode ? "#0f172a" : "#f8fafc") : "transparent",
                  borderRadius: "12px",
                  opacity: achievement.earned ? 1 : 0.5,
                  border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: achievement.earned ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : darkMode ? "#334155" : "#e2e8f0",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  {achievement.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: darkMode ? "white" : "#1f2937" }}>{achievement.name}</div>
                  <div style={{ fontSize: "12px", color: darkMode ? "#94a3b8" : "#64748b" }}>{achievement.description}</div>
                </div>
                <div style={{
                  fontSize: "11px",
                  color: achievement.earned ? "#10b981" : (darkMode ? "#64748b" : "#94a3b8"),
                  fontWeight: "500"
                }}>
                  {achievement.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Tip */}
      <div data-tooltip="Daily learning advice" style={{
        marginTop: "32px",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea15, #764ba215)",
        borderRadius: "16px",
        border: `1px solid ${darkMode ? "rgba(102,126,234,0.3)" : "rgba(102,126,234,0.2)"}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "32px" }}>💡</span>
          <div>
            <h4 style={{ fontWeight: "600", color: darkMode ? "white" : "#1f2937", marginBottom: "4px" }}>Daily Learning Tip</h4>
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "14px" }}>
              "Consistency beats intensity. Just 30 minutes of learning each day can transform your skills in 3 months!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolkit;