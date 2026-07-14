import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import LogoutButton from '../LogoutButton';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCog,
  BarChart3,
  DollarSign,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Menu,
  X,
  Bell,
  Shield,
} from "lucide-react";
import NotificationBell from "../NotificationBell";
import { useLanguage } from "../../context/LanguageContext";

const AdminSidebar = ({
  userName,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onSidebarChange,
  sidebarCollapsed,
  userImage,
  setUserImage,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(sidebarCollapsed || false);
  const fileInputRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("admin_profile_image", reader.result);
        if (setUserImage) setUserImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onSidebarChange) onSidebarChange(newState);
  };

  const navItems = [
    { name: t.navDashboard || "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin-users", icon: Users },
    { name: "Courses", path: "/admin-courses", icon: BookOpen },
    { name: "Instructors", path: "/admin-instructors", icon: UserCog },
    { name: "Revenue", path: "/admin-revenue", icon: DollarSign },
    { name: "Communities", path: "/communities", icon: Users },
    { name: t.navSettings || "Settings", path: "/admin-settings", icon: Settings },
  ];

  return (
    <>
      <div
        className={`md:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 border-b transition-colors duration-300 ${
          darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Menu size={24} />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/admin-dashboard")}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className={`font-bold text-lg ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              MysteryPath
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell darkMode={darkMode} />
          <button
            onClick={onToggleDarkMode}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-400 hover:bg-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r flex-col hidden md:flex ${
          darkMode
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        } ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/admin-dashboard")}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span
                className={`font-bold text-lg ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                MysteryPath
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-400 hover:bg-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className={`px-4 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {userImage ? (
              <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                {userName?.charAt(0).toUpperCase() || "A"}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{userName || "Admin"}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive(item.path)
                  ? darkMode
                    ? "bg-indigo-900/20 text-indigo-300"
                    : "bg-indigo-50 text-indigo-600"
                  : darkMode
                  ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive(item.path)
                    ? "text-indigo-500"
                    : darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              />
              {!collapsed && (
                <span
                  className={`text-sm font-medium truncate ${
                    isActive(item.path)
                      ? "text-indigo-600 dark:text-indigo-300"
                      : ""
                  }`}
                >
                  {item.name}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-300 hover:bg-gray-800/50"
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {!collapsed && (
              <span className="text-sm font-medium">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>
          <LogoutButton
            onLogout={onLogout}
            darkMode={darkMode}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`w-64 h-full shadow-2xl ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span
                  className={`font-bold text-lg ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  MysteryPath
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg ${
                  darkMode
                    ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className={`px-4 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                {userImage ? (
                  <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/20" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                    {userName?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
                <div>
                  <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userName || "Admin"}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? darkMode
                        ? "bg-indigo-900/20 text-indigo-300"
                        : "bg-indigo-50 text-indigo-600"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-800/50"
                      : "text-gray-600 hover:bg-gray-100/50"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive(item.path)
                        ? "text-indigo-500"
                        : darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
