import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import LogoutButton from '../../components/LogoutButton';
import { 
  LayoutDashboard, BookOpen, Users, BarChart3, 
  Settings, MessageCircle, Sun, Moon,
  ChevronLeft, ChevronRight, Sparkles, Camera, Menu, X
} from "lucide-react";
import InstructorProfile from "../InstructorProfile";
import NotificationBell from "../NotificationBell";
import { useLanguage } from "../../context/LanguageContext";

const InstructorSidebar = ({ userName, onLogout, darkMode, onToggleDarkMode, onSidebarChange, sidebarCollapsed, userImage, onImageUpdate }) => {
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
        localStorage.setItem("instructor_profile_image", reader.result);
        if (onImageUpdate) onImageUpdate(reader.result);
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
    { name: t.navDashboard || "Dashboard", path: "/instructor-dashboard", icon: LayoutDashboard },
    { name: t.navMyCourses || "My Courses", path: "/instructor-courses", icon: BookOpen },
    { name: t.navStudents || "Students", path: "/instructor-students", icon: Users },
    { name: t.navAnalytics || "Analytics", path: "/instructor-analytics", icon: BarChart3 },
    { name: t.navMessages || "Messages", path: "/chat", icon: MessageCircle },
    { name: "Communities", path: "/communities", icon: Users },
    { name: t.navSettings || "Settings", path: "/instructor-settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 border-b transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/instructor-dashboard")}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>MysteryPath</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell darkMode={darkMode} />
          <button onClick={onToggleDarkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r flex-col hidden md:flex
        ${collapsed ? 'w-20' : 'w-64'} 
        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xl'}`}>
        
        {/* Logo Section */}
        <div className={`flex items-center px-4 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} 
          ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/instructor-dashboard")}>
            <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className={`font-bold text-lg leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>MysteryPath</span>
                <span className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">Instructor</span>
              </div>
            )}
          </div>
          <button onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Section */}
        <div className={`px-4 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative">
              {userImage ? (
                <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                  {userName?.charAt(0).toUpperCase() || "I"}
                </div>
              )}
              <div onClick={() => fileInputRef.current.click()} role="button" tabIndex={0} aria-label="Change profile photo" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current.click(); }} className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1 cursor-pointer hover:scale-110 transition shadow-md border border-gray-100 dark:border-gray-600">
                <Camera size={10} className="text-gray-500 dark:text-gray-400" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{userName || "Instructor"}</div>
            <button onClick={() => setShowProfile(true)} className="text-[11px] text-purple-500 font-medium hover:underline">{t.navViewProfile || "View Profile"}</button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3 transition-all duration-200 relative group ${isActive(item.path) ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {isActive(item.path) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r-full" />}
              <item.icon size={collapsed ? 24 : 20} className={isActive(item.path) ? 'text-purple-600' : ''} />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              {collapsed && <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg border border-gray-700">{item.name}</div>}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} space-y-2`}>
          <button onClick={onToggleDarkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} className={`w-full flex items-center gap-3 py-2.5 rounded-lg transition ${collapsed ? 'justify-center' : 'px-4'} ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span className="text-sm font-medium">{darkMode ? (t.lightMode || 'Light Mode') : (t.darkMode || 'Dark Mode')}</span>}
          </button>
          <LogoutButton
            onLogout={onLogout}
            darkMode={darkMode}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          
          {/* Drawer Panel */}
          <div className={`fixed top-0 left-0 h-full w-72 z-50 transform md:hidden flex flex-col animate-slide-in ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white shadow-2xl'}`}>
            {/* Drawer Header */}
            <div className={`flex items-center justify-between px-6 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>MysteryPath</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X size={20} />
              </button>
            </div>

            {/* Drawer User Info */}
            <div className={`px-6 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                {userImage ? (
                  <img src={userImage} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                    {userName?.charAt(0).toUpperCase() || "I"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{userName || "Instructor"}</div>
                  <button onClick={() => { setShowProfile(true); setMobileMenuOpen(false); }} className="text-xs text-purple-500 font-medium hover:underline">View Profile</button>
                </div>
              </div>
            </div>

            {/* Drawer Nav Items */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {navItems.map((item) => (
                <button 
                  key={item.path} 
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} 
                  className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ${isActive(item.path) ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/10 border-r-4 border-purple-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <item.icon size={22} className={isActive(item.path) ? 'text-purple-600' : ''} />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </nav>

            {/* Drawer Footer Actions */}
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} space-y-4`}>
              <LogoutButton
                onLogout={() => { onLogout(); setMobileMenuOpen(false); }}
                darkMode={darkMode}
                className="w-full flex items-center gap-4 text-red-500 font-medium px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"
              />
            </div>
          </div>
        </>
      )}
      {showProfile && <InstructorProfile darkMode={darkMode} onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default InstructorSidebar;