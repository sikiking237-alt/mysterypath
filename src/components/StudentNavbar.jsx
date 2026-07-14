// src/components/StudentNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LogoutButton from './LogoutButton';
import {
  Home, BookOpen, Award, MessageCircle, HelpCircle, Users, UserPlus,
  Sun, Moon, Menu, X, LayoutDashboard, Calendar, Notebook,
  ListChecks, Heart, Headphones, Bot, Code, Settings, User,
  ChevronLeft, ChevronRight, Search, Sparkles, TrendingUp
} from 'lucide-react';

const StudentNavbar = ({
  darkMode,
  onToggleDarkMode,
  onLogout,
  userName,
  onSidebarChange,
  sidebarCollapsed,
  userImage,
  onUpdateImage
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(sidebarCollapsed || false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (!isMobile) {
      const newState = !isSidebarCollapsed;
      setIsSidebarCollapsed(newState);
      if (onSidebarChange) {
        onSidebarChange(newState);
      }
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/courses?q=${encodeURIComponent(q)}`);
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const mainNavItems = [
    { name: t.home || "Home", icon: Home, path: "/home" },
    { name: t.myLearning || "My Learning", icon: BookOpen, path: "/my-learning" },
    { name: t.certificates || "Certificates", icon: Award, path: "/my-certificates" },
    { name: t.chat || "Chat", icon: MessageCircle, path: "/chat" },
    { name: "Communities", icon: Users, path: "/communities" },
    { name: "Friends", icon: UserPlus, path: "/friends" },
  ];

  const toolNavItems = [
    { name: t.notes || "Notes", icon: Notebook, path: "/notes" },
    { name: t.flashcards || "Flashcards", icon: ListChecks, path: "/flashcards" },
    { name: t.aiTutor || "AI Tutor", icon: Bot, path: "/ai-tutor" },
    { name: t.planner || "Planner", icon: Calendar, path: "/planner" },
    { name: t.achievements || "Achievements", icon: TrendingUp, path: "/achievements" },
    { name: t.wishlist || "Wishlist", icon: Heart, path: "/wishlist" },
    { name: t.podcasts || "Podcasts", icon: Headphones, path: "/podcasts" },
    { name: t.codeLab || "Code Lab", icon: Code, path: "/code-practice" },
  ];

  const bottomNavItems = [
    { name: t.support || "Support", icon: HelpCircle, path: "/support" },
    { name: t.settings || "Settings", icon: Settings, path: "/settings" },
  ];

  const navClass = (active, collapsed) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${collapsed ? 'justify-center' : ''} ${
      active
        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300'
        : darkMode
          ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
    }`;

  return (
    <>
      {/* Top Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b shadow-sm transition-all duration-300 ${isMobile ? '' : (isSidebarCollapsed ? 'md:left-20' : 'md:left-64')}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Hamburger / Collapse / Mobile Brand */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  className={`p-2 rounded-lg transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              )}

              <Link to="/home" className="md:hidden text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MysteryPath
              </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  aria-label="Search courses"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} focus:outline-none`}
                />
              </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-lg transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {userImage ? (
                <img
                  src={userImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/30 cursor-pointer"
                  onClick={() => navigate('/settings')}
                />
              ) : (
                <button
                  onClick={() => navigate('/settings')}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer`}
                  aria-label="Profile"
                >
                  {userName ? userName.charAt(0).toUpperCase() : 'S'}
                </button>
              )}
              <LogoutButton
                onLogout={onLogout}
                darkMode={darkMode}
                collapsed={isSidebarCollapsed}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - Desktop only */}
      {!isMobile && (
        <aside
          className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-r shadow-lg overflow-hidden flex flex-col`}
        >
          {/* Brand */}
          <div className={`flex items-center px-3 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <Link to="/home" className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">MysteryPath</span>}
            </Link>
          </div>

          <div className={`px-3 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              {userImage ? (
                <img src={userImage} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/30 flex-shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {userName ? userName.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {userName || t.student || "Student"}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.student || "Learner"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-full overflow-y-auto py-4 scrollbar-thin flex-1">
            <div className="px-3 mb-4">
              {!isSidebarCollapsed && (
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 px-3 flex items-center gap-2`}>
                  <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                  {t.dashboard || "Main Menu"}
                </p>
              )}
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={() => navClass(isActive(item.path), isSidebarCollapsed)}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 group-hover:text-indigo-500 transition-colors" />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              ))}
            </div>

            <div className="px-3 mb-4">
              {!isSidebarCollapsed && (
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 px-3 flex items-center gap-2`}>
                  <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                  {t.tools || "Tools"}
                </p>
              )}
              {toolNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={() => navClass(isActive(item.path), isSidebarCollapsed)}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 group-hover:text-purple-500 transition-colors" />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              ))}
            </div>

            <div className="px-3 mt-auto border-t border-gray-200/50 dark:border-gray-800/50 pt-4">
              {bottomNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={() => navClass(isActive(item.path), isSidebarCollapsed)}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 group-hover:text-indigo-500 transition-colors" />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Overlay Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className={`fixed top-0 left-0 z-40 w-80 h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl transform transition-transform duration-300 ease-in-out pt-16 overflow-y-auto`}>
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-gray-200 dark:border-gray-800">
                {userImage ? (
                  <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30 flex-shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {userName ? userName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userName || t.student || "Student"}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.student || "Learner"}
                  </p>
                </div>
              </div>

              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 px-3`}>
                {t.dashboard || "Main Menu"}
              </p>
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={() => navClass(isActive(item.path), false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}

              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-6 mb-2 px-3`}>
                {t.tools || "Tools"}
              </p>
              {toolNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={() => navClass(isActive(item.path), false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                {bottomNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={() => navClass(isActive(item.path), false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                ))}

                <LogoutButton
                  onLogout={onLogout}
                  darkMode={darkMode}
                  className="flex items-center gap-3 w-full px-4 py-3.5 mt-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer to offset fixed top navbar */}
      <div className="h-16" />
    </>
  );
};

export default StudentNavbar;
