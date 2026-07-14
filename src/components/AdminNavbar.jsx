// frontend/src/components/AdminNavbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UserCog, 
  DollarSign, 
  Settings, 
  Activity,
  Menu,
  X,
  Sun,
  Moon, 
  ChevronLeft, ChevronRight,
  Sparkles
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import LogoutButton from "./LogoutButton";
import { useLanguage } from "../context/LanguageContext";

const AdminNavbar = ({ 
  userName, 
  onLogout, 
  darkMode, 
  onToggleDarkMode, 
  onSidebarChange, 
  sidebarCollapsed,
  userImage
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcuts (⌘/Ctrl + letter) for quick navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const map = {
        d: "/admin-dashboard",
        u: "/admin-users",
        c: "/admin-courses",
        i: "/admin-instructors",
        r: "/admin-revenue",
        s: "/admin-settings",
        a: "/admin-activity",
      };
      const path = map[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        navigate(path);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const menuItems = [
    { name: t.navDashboard || "Dashboard", icon: LayoutDashboard, path: "/admin-dashboard", shortcut: "⌘D" },
    { name: t.navUsers || "Users", icon: Users, path: "/admin-users", shortcut: "⌘U" },
    { name: t.navCourses || "Courses", icon: BookOpen, path: "/admin-courses", shortcut: "⌘C" },
    { name: t.navInstructors || "Instructors", icon: UserCog, path: "/admin-instructors", shortcut: "⌘I" },
    { name: t.navRevenue || "Revenue", icon: DollarSign, path: "/admin-revenue", shortcut: "⌘R" },
    { name: t.navSettings || "Settings", icon: Settings, path: "/admin-settings", shortcut: "⌘S" },
    { name: t.navActivityLog || "Activity Log", icon: Activity, path: "/admin-activity", shortcut: "⌘A" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-3 bg-white dark:bg-gray-900 shadow-md h-16">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`} aria-label="Open menu">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/admin-dashboard")}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>MysteryPath</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleDarkMode} 
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationBell darkMode={darkMode} />
          {userImage ? (
            <img src={userImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r z-40 shadow-xl hidden md:flex`}>
        {/* Logo */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/admin-dashboard")}>
            <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>MysteryPath</h1>}
          </div>
          <button 
            onClick={() => onSidebarChange(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Admin Info */}
        <div className={`px-4 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {userImage ? (
              <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {userName?.charAt(0).toUpperCase() || "A"}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 text-left">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                  {userName || "Admin"}
                </div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            )}
          </div>
          {/* Notification Bell - Desktop Sidebar */}
          {!sidebarCollapsed && (
            <div className="mt-3 flex justify-end">
              <NotificationBell darkMode={darkMode} />
            </div>
          )}
          {sidebarCollapsed && (
            <div className="mt-3 flex justify-center">
              <NotificationBell darkMode={darkMode} collapsed={true} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              title={sidebarCollapsed ? item.name : ''}
              aria-current={isActive(item.path) ? "page" : undefined}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 transition-all duration-200 relative ${
                isActive(item.path) 
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-r-4 border-purple-600' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={sidebarCollapsed ? 24 : 20} />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={`ml-auto text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.shortcut}
                  </span>
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button 
            onClick={onToggleDarkMode} 
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && <span className="text-sm font-medium">{darkMode ? (t.lightMode || "Light Mode") : (t.darkMode || "Dark Mode")}</span>}
          </button>
           
          <LogoutButton
            onLogout={onLogout}
            darkMode={darkMode}
            collapsed={sidebarCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className={`fixed top-0 left-0 h-full w-72 z-50 transform md:hidden flex flex-col animate-slide-in ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white shadow-2xl'}`}>
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

            <div className={`px-6 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                {userImage ? (
                  <img src={userImage} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                    {userName?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {userName || "Admin"}
                  </div>
                  <div className="text-xs text-gray-500">{t.administrator || "Administrator"}</div>
                </div>
              </div>
              {/* Notification Bell - Mobile Drawer */}
              <div className="mt-4 flex items-center justify-between px-2 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{t.notifications || "Notifications"}</span>
                <NotificationBell darkMode={darkMode} />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {menuItems.map((item) => (
                  <button 
                    key={item.path} 
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} 
                    aria-current={isActive(item.path) ? "page" : undefined}
                    className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                      isActive(item.path) 
                        ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/10 border-r-4 border-purple-600' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                  <item.icon size={22} />
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
    </>
  );
};

export default AdminNavbar;