import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Trophy, TrendingUp, CheckCircle, Play, Star, Award, Zap, Medal, Video, ExternalLink } from "lucide-react";
import Certificate from "./Certificate";

const Dashboard = ({ userName, darkMode, userXP, userStreak, userLevel, enrolledCourses = [], completedCourses = [], onUpdateProgress, onCompleteCourse }) => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCertificate, setShowCertificate] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);

  // Default courses if none provided
  const defaultCourses = [
    { id: 1, title: "Web Development Bootcamp", progress: 65, instructor: "Dr. Sarah Johnson", nextLesson: "React Hooks Deep Dive", xpReward: 100, category: "Development" },
    { id: 2, title: "UI/UX Design Fundamentals", progress: 30, instructor: "Emily Rodriguez", nextLesson: "Wireframing Basics", xpReward: 100, category: "Design" }
  ];

  const courses = enrolledCourses.length > 0 ? enrolledCourses : defaultCourses;
  const completed = completedCourses || [];

  // Calculate stats
  const totalCourses = courses.length;
  const completedCount = completed.length;
  const averageProgress = totalCourses > 0 ? courses.reduce((sum, c) => sum + (c.progress || 0), 0) / totalCourses : 0;
  const totalXP = userXP || 0;
  const currentStreak = userStreak || 0;
  const currentLevel = userLevel || 1;
  
  // XP needed for next level
  const xpForCurrentLevel = (currentLevel - 1) * 500;
  const xpForNextLevel = currentLevel * 500;
  const xpProgress = ((totalXP - xpForCurrentLevel) / 500) * 100;

  // Check and award achievements
  useEffect(() => {
    const newAchievements = [];
    
    if (totalCourses >= 1) newAchievements.push({ id: 1, title: "First Steps", description: "Enrolled in your first course", icon: "🌱", earned: true });
    if (completedCount >= 1) newAchievements.push({ id: 2, title: "Course Master", description: "Completed your first course", icon: "🎓", earned: true });
    if (totalXP >= 500) newAchievements.push({ id: 3, title: "XP Hunter", description: "Earned 500 XP points", icon: "⚡", earned: true });
    if (totalXP >= 1000) newAchievements.push({ id: 4, title: "XP Legend", description: "Earned 1000 XP points", icon: "🏆", earned: true });
    if (currentLevel >= 3) newAchievements.push({ id: 5, title: "Rising Star", description: "Reached Level 3", icon: "⭐", earned: true });
    if (currentLevel >= 5) newAchievements.push({ id: 6, title: "Elite Learner", description: "Reached Level 5", icon: "👑", earned: true });
    
    setAchievements(newAchievements);
    fetchLiveClasses();
  }, [totalCourses, completedCount, totalXP, currentLevel]);

  const fetchLiveClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/live-classes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLiveClasses(Array.isArray(data) ? data : (data.classes || []));
      }
    } catch (e) {
      console.error("Error fetching live classes", e);
    }
  };

  const handleContinueCourse = (course) => {
    navigate(`/course-player/${course.id}`);
  };

  const handleCompleteCourse = (course) => {
    if (course.progress < 100) {
      if (window.confirm(`Complete "${course.title}" and claim ${course.xpReward || 100} XP?`)) {
        onUpdateProgress?.(course.id, 100);
        onCompleteCourse?.(course.id);
        setShowCertificate({ courseName: course.title, date: new Date().toLocaleDateString() });
        setTimeout(() => setShowCertificate(null), 5000);
      }
    }
  };

  const getLevelBadge = () => {
    if (currentLevel >= 10) return "👑 Grand Master";
    if (currentLevel >= 7) return "🏆 Expert";
    if (currentLevel >= 4) return "⚡ Advanced";
    if (currentLevel >= 2) return "🌱 Intermediate";
    return "🎓 Beginner";
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: darkMode ? "#1a1a1a" : "#f3f4f6",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: "bold", 
            color: darkMode ? "white" : "#1f2937",
            marginBottom: "10px"
          }}>
            Welcome back, {userName || "Learner"}! 👋
          </h1>
          <p style={{ color: darkMode ? "#aaa" : "#6b7280" }}>
            {completedCount} courses completed • {totalXP} XP earned • {currentStreak} Day Streak 🔥 • Level {currentLevel} {getLevelBadge()}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div>
              <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>Courses Enrolled</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: darkMode ? "white" : "#1f2937" }}>{totalCourses}</p>
            </div>
            <BookOpen style={{ width: "40px", height: "40px", color: "#9333ea", opacity: 0.7 }} />
          </div>
          
          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div>
              <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>Completed</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: darkMode ? "white" : "#1f2937" }}>{completedCount}</p>
            </div>
            <Trophy style={{ width: "40px", height: "40px", color: "#f59e0b", opacity: 0.7 }} />
          </div>
          
          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div>
              <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>Total XP</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>{totalXP}</p>
            </div>
            <Zap style={{ width: "40px", height: "40px", color: "#f59e0b", opacity: 0.7 }} />
          </div>
          
          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div>
              <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>Daily Streak</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#ef4444" }}>{currentStreak}</p>
            </div>
            <span style={{ fontSize: "32px", opacity: 0.7 }}>🔥</span>
          </div>

          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div>
              <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>Level</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>{currentLevel}</p>
            </div>
            <Medal style={{ width: "40px", height: "40px", color: "#8b5cf6", opacity: 0.7 }} />
          </div>
        </div>

        {/* XP Progress Bar */}
        <div style={{
          background: darkMode ? "#2d2d2d" : "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>
              Level {currentLevel} Progress
            </span>
            <span style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px" }}>
              {totalXP - xpForCurrentLevel} / 500 XP to Level {currentLevel + 1}
            </span>
          </div>
          <div style={{ width: "100%", background: darkMode ? "#1a1a1a" : "#e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(xpProgress, 100)}%`,
              background: "linear-gradient(135deg, #f59e0b, #ea580c)",
              padding: "8px",
              transition: "width 0.5s"
            }} />
          </div>
          <div style={{ marginTop: "15px", fontSize: "13px", color: darkMode ? "#888" : "#666", textAlign: "center" }}>
            {getLevelBadge()} • {500 - (totalXP - xpForCurrentLevel)} XP needed for next level
          </div>
        </div>

        {/* Live Sessions Section */}
        {liveClasses.length > 0 && (
          <div className="mb-10">
            <h2 style={{ 
              fontSize: "24px", 
              fontWeight: "bold", 
              color: darkMode ? "white" : "#1f2937",
              marginBottom: "20px"
            }} className="flex items-center gap-2">
              <Video className="text-red-500" /> Upcoming Live Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveClasses.map(lc => (
                <div key={lc.id} style={{
                  background: darkMode ? "#2d2d2d" : "white",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid rgba(239,68,68,0.2)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{lc.title}</h3>
                      <p className="text-xs text-gray-500 italic">With {lc.instructor_name}</p>
                    </div>
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse font-bold">LIVE</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{lc.description}</p>
                  <div className="flex gap-2">
                    <a href={lc.meeting_link} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition">
                      Join Meeting <ExternalLink size={14} />
                    </a>
                    {lc.social_link && (
                      <a href={lc.social_link} target="_blank" rel="noreferrer" className="px-4 border border-purple-600 text-purple-600 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition">
                        Group
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrolled Courses Section */}
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          color: darkMode ? "white" : "#1f2937",
          marginBottom: "20px"
        }}>
          📚 My Courses
        </h2>
        
        {courses.map(course => {
          const isCompleted = completed.some(c => c.id === course.id);
          const progress = isCompleted ? 100 : (course.progress || 0);
          
          return (
            <div key={course.id} style={{
              background: darkMode ? "#2d2d2d" : "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "transform 0.2s"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Course Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: darkMode ? "white" : "#1f2937" }}>
                      {course.title}
                    </h3>
                    <p style={{ color: darkMode ? "#aaa" : "#6b7280", fontSize: "14px", marginTop: "4px" }}>
                      Instructor: {course.instructor}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      background: isCompleted ? "#10b981" : "#9333ea",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      {isCompleted ? "✓ Completed" : `${progress}% Complete`}
                    </span>
                    {course.xpReward && (
                      <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "8px" }}>
                        🏆 +{course.xpReward} XP on completion
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: darkMode ? "#aaa" : "#6b7280" }}>Progress</span>
                    <span style={{ fontSize: "13px", color: darkMode ? "#aaa" : "#6b7280" }}>{progress}%</span>
                  </div>
                  <div style={{ width: "100%", background: darkMode ? "#1a1a1a" : "#e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{
                      width: `${progress}%`,
                      background: isCompleted ? "#10b981" : "linear-gradient(135deg, #9333ea, #db2777)",
                      padding: "8px",
                      transition: "width 0.5s"
                    }} />
                  </div>
                </div>
                
                {/* Next Lesson & Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: darkMode ? "#888" : "#6b7280" }}>Next Lesson</p>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: darkMode ? "white" : "#1f2937" }}>
                      {course.nextLesson || "Ready to continue"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {!isCompleted && progress < 100 && (
                      <>
                        <button
                          onClick={() => handleContinueCourse(course)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#9333ea",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600"
                          }}
                        >
                          <Play size={16} />
                          Continue Learning
                        </button>
                        <button
                          onClick={() => handleCompleteCourse(course)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#10b981",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600"
                          }}
                        >
                          <CheckCircle size={16} />
                          Complete Course
                        </button>
                      </>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => setShowCertificate({ courseName: course.title, date: new Date().toLocaleDateString() })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#8b5cf6",
                          color: "white",
                          padding: "10px 20px",
                          borderRadius: "10px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                      >
                        <Award size={16} />
                        View Certificate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && (
          <div style={{
            background: darkMode ? "#2d2d2d" : "white",
            borderRadius: "16px",
            padding: "60px",
            textAlign: "center",
            color: darkMode ? "#aaa" : "#6b7280"
          }}>
            <BookOpen size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p>You haven't enrolled in any courses yet.</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>Browse our popular courses and start learning!</p>
          </div>
        )}

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <>
            <h2 style={{ 
              fontSize: "24px", 
              fontWeight: "bold", 
              color: darkMode ? "white" : "#1f2937",
              marginTop: "40px",
              marginBottom: "20px"
            }}>
              🏆 Achievements
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "30px"
            }}>
              {achievements.map(achievement => (
                <div key={achievement.id} style={{
                  background: darkMode ? "#2d2d2d" : "white",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <span style={{ fontSize: "32px" }}>{achievement.icon}</span>
                  <div>
                    <h4 style={{ fontWeight: "bold", color: darkMode ? "white" : "#1f2937" }}>{achievement.title}</h4>
                    <p style={{ fontSize: "12px", color: "#10b981" }}>{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Certificate Popup */}
        {showCertificate && (
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "white",
            borderRadius: "20px",
            padding: "20px",
            maxWidth: "500px",
            width: "90vw",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <Certificate
              userName={userName}
              courseName={showCertificate.courseName}
              completionDate={showCertificate.date}
            />
            <button
              onClick={() => setShowCertificate(null)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                background: "#9333ea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;