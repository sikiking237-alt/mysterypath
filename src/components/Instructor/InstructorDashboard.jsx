// src/components/Instructor/InstructorDashboard.jsx
import React, { useState, useEffect } from "react";
import LogoutButton from '../../components/LogoutButton';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Star,
  PlusCircle,
  UserPlus,
  BarChart3,
  MessageCircle,
  Clock,
  Award,
  Target,
  Calendar,
  ChevronRight,
  Activity,
  Zap,
  Crown,
  Sparkles,
  Layers,
  LogOut,
  Bell,
  Monitor,
  Code2,
  Video,
} from "lucide-react";

// ✅ CORRECT IMPORT - THIS IS WHAT FIXES THE ERROR
import { useGetInstructorStatsQuery } from '../../features/courses/coursesApi';

// Import child components
import Whiteboard from "./Whiteboard";
import LiveCodeSession from "./LiveCodeSession";
import LiveVideoClass from "./LiveVideoClass";

const InstructorDashboard = ({ userName, darkMode, onLogout }) => {
  const navigate = useNavigate();
  
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showLiveCode, setShowLiveCode] = useState(false);
  const [showVideoClass, setShowVideoClass] = useState(false);
  const [videoRoomId] = useState("class-101");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ courseId: "", time: "" });
  const [scheduledLiveClass, setScheduledLiveClass] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [stats, setStats] = useState({
    total_courses: 0,
    total_students: 0,
    total_revenue: 0,
    average_rating: 0,
    avg_completion_rate: 0,
    active_learners: 0,
  });

  const token = localStorage.getItem("token");
  const API_BASE = "/api";

  // RTK Query hook - THIS NOW WORKS!
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetInstructorStatsQuery(undefined, {
    skip: !token,
  });

  // Update stats when data arrives
  useEffect(() => {
    if (statsData) {
      setStats({
        total_courses: Number(statsData.total_courses ?? 0),
        total_students: Number(statsData.total_students ?? 0),
        total_revenue: Number(statsData.total_revenue ?? 0),
        average_rating: Number(statsData.average_rating ?? 0),
        avg_completion_rate: Number(statsData.avg_completion_rate ?? 0),
        active_learners: Number(statsData.active_learners ?? 0),
      });
    }
  }, [statsData]);

  // Fetch recent courses
  const fetchRecentCourses = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/instructor/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentCourses(data.slice(0, 3));
        setAllCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecentCourses();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [token]);

  // Handle scheduling a class
  const handleScheduleClass = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/instructor/schedule-class`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: scheduleForm.courseId,
          class_time: scheduleForm.time,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Live class scheduled!");
        setScheduledLiveClass(data.live_class || null);
        setScheduleForm({ courseId: "", time: "" });
      } else {
        toast.error(data.error || "Failed to schedule class");
      }
    } catch (error) {
      console.error("Error scheduling class:", error);
      toast.error("An error occurred");
    }
  };

  // Stat cards
  const statCards = [
    {
      title: "Total Courses",
      value: stats.total_courses,
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      link: "/instructor-courses",
    },
    {
      title: "Total Students",
      value: stats.total_students,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      link: "/instructor-students",
    },
    {
      title: "Total Revenue",
      value: `$${Number(stats.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      link: "/instructor-analytics",
    },
    {
      title: "Avg Rating",
      value: `${stats.average_rating.toFixed(1)}⭐`,
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      link: "/instructor-analytics",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      name: "Create Course",
      icon: PlusCircle,
      color: "from-green-500 to-emerald-500",
      action: () => navigate("/instructor-courses"),
    },
    {
      name: "Add Students",
      icon: UserPlus,
      color: "from-blue-500 to-cyan-500",
      action: () => navigate("/instructor-students"),
    },
    {
      name: "Analytics",
      icon: BarChart3,
      color: "from-purple-500 to-pink-500",
      action: () => navigate("/instructor-analytics"),
    },
    {
      name: "Messages",
      icon: MessageCircle,
      color: "from-orange-500 to-red-500",
      action: () => navigate("/chat"),
    },
    {
      name: "Whiteboard",
      icon: Monitor,
      color: "from-indigo-500 to-blue-500",
      action: () => setShowWhiteboard(true),
    },
    {
      name: "Live Code",
      icon: Code2,
      color: "from-pink-500 to-rose-500",
      action: () => setShowLiveCode(true),
    },
    {
      name: "Video Class",
      icon: Video,
      color: "from-blue-600 to-indigo-600",
      action: () => setShowVideoClass(true),
    },
    {
      name: "Schedule Class",
      icon: Calendar,
      color: "from-purple-600 to-indigo-600",
      action: () => setShowScheduleModal(true),
    },
  ];

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 ${
          darkMode 
            ? "bg-gradient-to-r from-gray-800 to-gray-900" 
            : "bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50"
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Welcome Back!
              </span>
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {userName?.split(" ")[0] || "Instructor"} 👋
            </h1>
            <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"} max-w-md`}>
              {stats.total_students} students are learning from your courses!
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-white"} shadow-sm`}>
              <Activity className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <LogoutButton
              onLogout={onLogout}
              darkMode={darkMode}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => stat.link && navigate(stat.link)}
            className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
          >
            <div className="relative p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <Zap className="w-5 h-5 text-purple-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`w-full p-3 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-lg"
              } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white mx-auto mb-2`}
              >
                <action.icon className="w-4 h-4" />
              </div>
              <div className={`text-xs font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                {action.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Courses */}
      <div
        className={`rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${
          darkMode ? "border-gray-700" : "border-gray-100"
        } overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Recent Courses
            </h3>
            <button
              onClick={() => navigate("/instructor-courses")}
              className="text-purple-600 text-sm hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {recentCourses.length > 0 ? (
            recentCourses.map((course, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {course.title}
                    </div>
                    <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {course.student_count || 0} students
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/instructor-courses")}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex-shrink-0 ml-2"
                >
                  Manage
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className={darkMode ? "text-gray-300" : "text-gray-500"}>
                No courses yet
              </p>
              <button
                onClick={() => navigate("/instructor-courses")}
                className="mt-3 text-purple-600 text-sm"
              >
                Create your first course →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showWhiteboard && (
        <Whiteboard
          darkMode={darkMode}
          isInstructor={true}
          roomId="instructor-main-office"
          onClose={() => setShowWhiteboard(false)}
        />
      )}
      
      {showLiveCode && (
        <LiveCodeSession
          darkMode={darkMode}
          isInstructor={true}
          roomId="instructor-main-coding"
          onClose={() => setShowLiveCode(false)}
        />
      )}
      
      {showVideoClass && (
        <LiveVideoClass
          darkMode={darkMode}
          isInstructor={true}
          userName={userName}
          roomId={videoRoomId}
          onClose={() => setShowVideoClass(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <Calendar className="w-5 h-5 text-purple-500" />
                {scheduledLiveClass ? "Class Scheduled!" : "Schedule Live Class"}
              </h3>
              <button
                onClick={() => { setShowScheduleModal(false); setScheduledLiveClass(null); }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            {!scheduledLiveClass ? (
              <form onSubmit={handleScheduleClass} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Select Course
                  </label>
                  <select
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                    value={scheduleForm.courseId}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, courseId: e.target.value })
                    }
                  >
                    <option value="">Choose a course...</option>
                    {allCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Class Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                    value={scheduleForm.time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, time: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className={`flex-1 py-2.5 rounded-xl font-medium ${
                      darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                  >
                    Schedule & Notify
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${darkMode ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                    <span className={`font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}>
                      {scheduledLiveClass.title}
                    </span>
                  </div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Your students have been notified and can join using the link below.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Meeting Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={scheduledLiveClass.meeting_link}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(scheduledLiveClass.meeting_link);
                        toast.success("Link copied!");
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                        darkMode ? "border-gray-600 text-white hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Share on Social Media
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(scheduledLiveClass.meeting_link)}&text=${encodeURIComponent(`Join my live class: ${scheduledLiveClass.title}`)}`, '_blank', 'width=600,height=400')}
                      className="flex-1 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      Twitter
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(scheduledLiveClass.meeting_link)}`, '_blank', 'width=600,height=400')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join my live class: ${scheduledLiveClass.title} - ${scheduledLiveClass.meeting_link}`)}`, '_blank', 'width=600,height=400')}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowScheduleModal(false); setScheduledLiveClass(null); }}
                    className={`flex-1 py-2.5 rounded-xl font-medium ${
                      darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
