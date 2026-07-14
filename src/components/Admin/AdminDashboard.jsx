// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
  UserCog,
  Award,
  Star,
  BarChart3,
  Calendar,
  ArrowUpRight,
  Send,
} from "lucide-react";
import { apiEndpoints, apiCall } from "../../config/apiConfig";
import { io } from "socket.io-client";
import createSocket from "../../utils/socketClient";
import SendNotification from "../SendNotification";

const AdminDashboard = ({ darkMode }) => {
  const navigate = useNavigate();

  // Default font size
  const fontSize = "medium";

  const fontSizeClasses = {
    small: {
      base: "text-sm",
      heading: "text-xl",
      subheading: "text-base",
      body: "text-sm",
      small: "text-xs",
    },
    medium: {
      base: "text-base",
      heading: "text-2xl",
      subheading: "text-lg",
      body: "text-base",
      small: "text-xs",
    },
    large: {
      base: "text-lg",
      heading: "text-3xl",
      subheading: "text-xl",
      body: "text-lg",
      small: "text-sm",
    },
    xlarge: {
      base: "text-xl",
      heading: "text-4xl",
      subheading: "text-2xl",
      body: "text-xl",
      small: "text-base",
    },
  };

  const currentSize = fontSizeClasses[fontSize] || fontSizeClasses.medium;

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    activeInstructors: 0,
    completedCourses: 0,
    averageRating: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [systemStatus, setSystemStatus] = useState({
    api: "checking",
    database: "checking",
  });
  const [currency, setCurrency] = useState("USD");
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecentUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return recentUsers;
    const q = searchQuery.toLowerCase();
    return recentUsers.filter(
      (user) =>
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q)
    );
  }, [recentUsers, searchQuery]);

  const filteredRecentActivities = React.useMemo(() => {
    if (!searchQuery.trim()) return recentActivities;
    const q = searchQuery.toLowerCase();
    return recentActivities.filter(
      (activity) =>
        activity.action?.toLowerCase().includes(q) ||
        activity.user?.toLowerCase().includes(q) ||
        activity.type?.toLowerCase().includes(q)
    );
  }, [recentActivities, searchQuery]);

  const AnimatedNumber = ({ value, duration = 800 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const numeric = typeof value === 'number' ? value : parseFloat(value) || 0;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.floor(eased * numeric));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, [value, duration]);
    return <>{typeof value === 'string' && value.includes('★') ? `${display}★` : display.toLocaleString()}</>;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiCall(apiEndpoints.admin.stats, {
          method: "GET",
        });
        if (response.error) {
          console.error("Error fetching stats:", response.error);
          setError("Failed to load dashboard statistics");
        } else if (response) {
          setStats(response);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to connect to server");
      }
    };

    const fetchRecentUsers = async () => {
      try {
        const response = await apiCall(`${apiEndpoints.admin.users}?page=1&limit=5`, {
          method: "GET",
        });

        if (response.error) {
          console.error("Error fetching users:", response.error);
        } else if (response.success && Array.isArray(response.users)) {
          setRecentUsers(response.users);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const response = await apiCall(`${apiEndpoints.admin.activity}?page=1&limit=5`, { method: 'GET' });
        if (response.success && Array.isArray(response.logs)) {
          setRecentActivities(response.logs);
        }
      } catch (err) {
        console.error("Error fetching recent activities:", err);
      }
    };

    const checkSystemStatus = async () => {
      try {
        const apiResponse = await apiCall(apiEndpoints.test.healthCheck, {
          method: "GET",
        });
        setSystemStatus({
          api: apiResponse.status === 'online' ? "online" : "offline",
          database: apiResponse.status === 'online' ? "online" : "offline",
        });
      } catch (err) {
        setSystemStatus({
          api: "offline",
          database: "offline",
        });
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await apiCall(apiEndpoints.admin.settings, { method: 'GET' });
        if (response.settings && response.settings.currency) {
          setCurrency(response.settings.currency);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        // Keep default 'USD'
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      setError("");
      await Promise.all([
        fetchDashboardData(),
        fetchRecentUsers(),
        fetchRecentActivities(),
        checkSystemStatus(),
        fetchSettings(),
      ]);
      setLoading(false);
    };

    loadAllData();
  }, []);

  useEffect(() => {
    const socket = createSocket({
      auth: { token: localStorage.getItem('token') },
    });

    // Manually connect the socket when the component mounts.
    socket.on('connect', () => {
      console.log('🔌 Admin dashboard connected to socket server.');
    });

    socket.on('new-activity', (newActivity) => {
      setRecentActivities(prevActivities => [newActivity, ...prevActivities].slice(0, 5));
    });

    return () => {
      console.log('🔌 Admin dashboard disconnecting from socket server.');
      socket.disconnect();
    };
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-blue-500 via-blue-600 to-cyan-500",
      glow: "shadow-blue-500/20",
      link: "/admin-users",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: "from-emerald-500 via-green-600 to-teal-500",
      glow: "shadow-emerald-500/20",
      link: "/admin-courses",
      trend: "+4.2%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
        stats.totalRevenue || 0
      ),
      icon: DollarSign,
      gradient: "from-amber-500 via-orange-500 to-pink-500",
      glow: "shadow-orange-500/20",
      link: "/admin-revenue",
      trend: "+8.1%",
      trendUp: true,
    },
    {
      title: "Enrollments",
      value: stats.totalEnrollments,
      icon: GraduationCap,
      gradient: "from-fuchsia-500 via-purple-600 to-indigo-600",
      glow: "shadow-purple-500/20",
      link: "/admin-revenue",
      trend: "+15.3%",
      trendUp: true,
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      icon: Activity,
      gradient: "from-indigo-500 via-violet-600 to-purple-600",
      glow: "shadow-indigo-500/20",
      link: "/admin-users",
      trend: "-2.4%",
      trendUp: false,
    },
    {
      title: "Instructors",
      value: stats.activeInstructors,
      icon: UserCog,
      gradient: "from-rose-500 via-red-500 to-orange-500",
      glow: "shadow-rose-500/20",
      link: "/admin-instructors",
      trend: "+1.8%",
      trendUp: true,
    },
    {
      title: "Completed Courses",
      value: stats.completedCourses,
      icon: Award,
      gradient: "from-teal-500 via-emerald-500 to-green-500",
      glow: "shadow-teal-500/20",
      link: "/admin-courses",
      trend: "+6.7%",
      trendUp: true,
    },
    {
      title: "Avg Rating",
      value: `${stats.averageRating}★`,
      icon: Star,
      gradient: "from-yellow-400 via-amber-500 to-orange-400",
      glow: "shadow-amber-500/20",
      link: "/admin-courses",
      trend: "+0.3",
      trendUp: true,
    },
  ];

  const roleStyles = {
    admin: {
      bg: darkMode
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
      avatar: "from-red-500 to-rose-600",
    },
    instructor: {
      bg: darkMode
        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
        : "bg-purple-50 text-purple-700 border-purple-200",
      dot: "bg-purple-500",
      avatar: "from-purple-500 to-fuchsia-600",
    },
    user: {
      bg: darkMode
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      avatar: "from-emerald-500 to-teal-600",
    },
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-7xl px-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/80 border-gray-100'} animate-pulse`}>
              <div className={`w-12 h-12 rounded-xl mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-8 rounded-lg mb-2 w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-4 rounded-lg w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 lg:p-8 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-white to-purple-50/30"
      } ${currentSize.base}`}
    >
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                darkMode
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  : "bg-purple-100 text-purple-700 border border-purple-200"
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-pulse" />
              Admin Console
            </span>
            <span
              className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              <Calendar className="inline w-3 h-3 mr-1" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1
            className={`text-4xl md:text-5xl font-black tracking-tight ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p
            className={`mt-2 max-w-2xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Here's a real-time overview of your learning platform's performance
            and growth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, courses..."
              className={`pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64 ${
                darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
            />
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const [statsRes, usersRes, activityRes, settingsRes] = await Promise.all([
                  apiCall(apiEndpoints.admin.stats, { method: "GET" }),
                  apiCall(`${apiEndpoints.admin.users}?page=1&limit=5`, { method: "GET" }),
                  apiCall(`${apiEndpoints.admin.activity}?page=1&limit=5`, { method: 'GET' }),
                  apiCall(apiEndpoints.admin.settings, { method: 'GET' }),
                ]);
                if (!statsRes.error) setStats(statsRes);
                if (usersRes.success && Array.isArray(usersRes.users)) setRecentUsers(usersRes.users);
                if (activityRes.success && Array.isArray(activityRes.logs)) setRecentActivities(activityRes.logs);
                if (settingsRes.settings && settingsRes.settings.currency) setCurrency(settingsRes.settings.currency);
              } catch {
                setError("Failed to connect");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className={`p-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 ${
              darkMode
                ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSendNotification(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:shadow-lg transition"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send Notification</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`mb-6 p-4 rounded-2xl flex gap-3 items-start backdrop-blur-sm ${
            darkMode
              ? "bg-red-500/10 border border-red-500/30 text-red-200"
              : "bg-red-50/80 border border-red-200 text-red-900"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${darkMode ? "bg-red-500/20" : "bg-red-100"}`}
          >
            <AlertCircle
              className={`w-5 h-5 ${darkMode ? "text-red-300" : "text-red-600"}`}
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <button
             onClick={() => {
                const retryData = async () => {
                  setLoading(true);
                  setError("");
                  // Re-create functions to avoid stale closures if we were using dependencies
                  const fetchDashboardData = async () => apiCall(apiEndpoints.admin.stats, { method: "GET" }).then(res => res.error ? setError("Failed to load stats") : setStats(res)).catch(() => setError("Failed to connect"));
                  const fetchRecentUsers = async () => apiCall(`${apiEndpoints.admin.users}?page=1&limit=5`, { method: "GET" }).then(res => res.success && setRecentUsers(res.users));
                  const checkSystemStatus = async () => {
                    try {
                      const apiResponse = await apiCall(apiEndpoints.test.healthCheck, { method: "GET" });
                      setSystemStatus({ api: "online", database: apiResponse.database_status === 'online' ? "online" : "offline" });
                    } catch {
                      setSystemStatus({ api: "offline", database: "offline" });
                    }
                  };
                  await Promise.all([
                    fetchDashboardData(),
                    fetchRecentUsers(),
                    checkSystemStatus(),
                  ]);
                  setLoading(false);
                };
                retryData();
              }}
              className={`mt-1 text-sm font-semibold underline-offset-2 hover:underline ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Try again →
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => stat.link && navigate(stat.link)}
              className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur-sm overflow-hidden ${
                darkMode
                  ? "bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-gray-600"
                  : "bg-white/80 hover:bg-white border border-gray-100 hover:border-gray-200"
              } ${stat.glow} hover:shadow-xl`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />
                <div className="relative">
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    {stat.trend && (
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        stat.trendUp
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {stat.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <div
                    className={`${currentSize.heading} font-black ${
                      darkMode ? "text-white" : "text-gray-900"
                    } tracking-tight`}
                  >
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <div
                    className={`${currentSize.body} mt-1 font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {stat.title}
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}
                  >
                    View details
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* Two-column section: Recent Users + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
        {/* Recent Users — takes 2 columns */}
        <div
          className={`lg:col-span-2 p-6 rounded-2xl backdrop-blur-sm ${
            darkMode
              ? "bg-gray-800/60 border border-gray-700/60"
              : "bg-white/80 border border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3
                className={`${currentSize.subheading} font-black ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Recent Users
              </h3>
              <p
                className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}
              >
                Latest people who joined the platform
              </p>
            </div>
            <button
              onClick={() => navigate("/admin-users")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                darkMode
                  ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredRecentUsers.map((user, index) => {
              const style = roleStyles[user.role] || roleStyles.user;
              return (
                <div
                  key={index}
                  className={`group flex items-center justify-between p-3 rounded-xl transition-all ${
                    darkMode ? "hover:bg-gray-700/40" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${style.avatar} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}
                    >
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`${currentSize.body} font-semibold truncate ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user.name}
                      </div>
                      <div
                        className={`${currentSize.small} truncate ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${currentSize.small} rounded-full font-semibold capitalize border ${style.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {user.role}
                  </span>
                </div>
              );
            })}
            {recentUsers.length === 0 && (
              <div
                className={`text-center py-12 ${currentSize.body} ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No users found yet</p>
                <p className="text-xs mt-1">New signups will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className={`p-6 rounded-2xl backdrop-blur-sm ${
            darkMode
              ? "bg-gray-800/60 border border-gray-700/60"
              : "bg-white/80 border border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3
                className={`${currentSize.subheading} font-black ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Live Activity
              </h3>
              <p
                className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}
              >
                Real-time platform events
              </p>
            </div>
            <button
              onClick={() => navigate("/admin-activity")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                darkMode
                  ? "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              View Log
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {filteredRecentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm">
                    {activity.type === 'auth' ? '🔑' : activity.type === 'course' ? '📚' : '⚙️'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {activity.user} • {activity.time || new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>Waiting for new activity...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: System Status + Quick Actions */}
        <div className="space-y-5">
          {/* System Status */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl text-white shadow-2xl ${
              systemStatus.api === "online" &&
              systemStatus.database === "online"
                ? "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 shadow-emerald-500/30"
                : "bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/30"
            }`}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`${currentSize.subheading} font-black`}>
                    System Status
                  </h3>
                  <p className={`${currentSize.small} opacity-90 mt-1`}>
                    {systemStatus.api === "online" &&
                    systemStatus.database === "online"
                      ? "All systems operational"
                      : "Some services may be unavailable"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/15 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        systemStatus.api === "online"
                          ? "bg-white animate-pulse"
                          : "bg-rose-200"
                      }`}
                    />
                    <span className="font-semibold text-sm">API Server</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {systemStatus.api === "online" ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/15 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        systemStatus.database === "online"
                          ? "bg-white animate-pulse"
                          : "bg-rose-200"
                      }`}
                    />
                    <span className="font-semibold text-sm">Database</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {systemStatus.database === "online"
                      ? "Connected"
                      : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={`p-6 rounded-2xl backdrop-blur-sm ${
              darkMode
                ? "bg-gray-800/60 border border-gray-700/60"
                : "bg-white/80 border border-gray-100 shadow-sm"
            }`}
          >
            <h3
              className={`${currentSize.subheading} font-black mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Quick Actions
            </h3>
            <p
              className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-500"}`}
            >
              Jump into common admin tasks
            </p>
            <div className="space-y-2">
              {[
                {
                  label: "Send Notification",
                  icon: Send,
                  onClick: () => setShowSendNotification(true),
                  dark: "bg-rose-500/20 text-rose-300",
                  light: "bg-rose-100 text-rose-600",
                },
                {
                  label: "Manage Users",
                  icon: Users,
                  link: "/admin-users",
                  dark: "bg-blue-500/20 text-blue-300",
                  light: "bg-blue-100 text-blue-600",
                },
                {
                  label: "Manage Courses",
                  icon: BookOpen,
                  link: "/admin-courses",
                  dark: "bg-emerald-500/20 text-emerald-300",
                  light: "bg-emerald-100 text-emerald-600",
                },
                {
                  label: "Revenue Analytics",
                  icon: BarChart3,
                  link: "/admin-revenue",
                  dark: "bg-purple-500/20 text-purple-300",
                  light: "bg-purple-100 text-purple-600",
                },
                {
                  label: "Manage Payouts",
                  icon: DollarSign,
                  link: "/admin-payouts",
                  dark: "bg-green-500/20 text-green-300",
                  light: "bg-green-100 text-green-600",
                },
                {
                  label: "My Payout Settings",
                  icon: DollarSign,
                  link: "/admin-payout-settings",
                  dark: "bg-pink-500/20 text-pink-300",
                  light: "bg-pink-100 text-pink-600",
                },
                {
                  label: "System Settings",
                  icon: Activity,
                  link: "/admin-settings",
                  dark: "bg-orange-500/20 text-orange-300",
                  light: "bg-orange-100 text-orange-600",
                },
              ].map((action, i) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={action.onClick ? action.onClick : () => navigate(action.link)}
                    className={`w-full group flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                      darkMode
                        ? "hover:bg-gray-700/50 text-gray-200"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          darkMode ? action.dark : action.light
                        }`}
                      >
                        <ActionIcon className="w-4 h-4" />
                      </span>
                      {action.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showSendNotification && (
        <SendNotification
          darkMode={darkMode}
          onClose={() => setShowSendNotification(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;