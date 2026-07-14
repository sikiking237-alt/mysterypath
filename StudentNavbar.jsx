// src/components/StudentNavbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Award, User, Settings, LogOut, 
  Sun, Moon, Menu, X, Search, MessageCircle, Bell,
  HelpCircle, Code, Bot, Headphones, Calendar, Heart
} from 'lucide-react';

const StudentNavbar = ({ 
  darkMode, 
  onToggleDarkMode, 
  onLogout, 
  userName,
  handleSidebarChange,
  sidebarCollapsed 
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "My Learning", icon: BookOpen, path: "/my-learning" },
    { name: "Certificates", icon: Award, path: "/my-certificates" },
    { name: "Chat", icon: MessageCircle, path: "/chat" },
    { name: "Support", icon: HelpCircle, path: "/support" },
  ];

  const tools = [
    { name: "Code Lab", icon: Code, path: "/code-practice" },
    { name: "AI Tutor", icon: Bot, path: "/ai-tutor" },
    { name: "Podcasts", icon: Headphones, path: "/podcasts" },
    { name: "Planner", icon: Calendar, path: "/planner" },
    { name: "Wishlist", icon: Heart, path: "/wishlist" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/home" className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              MysteryPath
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className={`p-2 rounded-lg transition ${
                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition ${
                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t border-gray-200 dark:border-gray-800`}>
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className={`px-4 py-2 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tools
              </p>
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => handleNavigation(tool.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition ${
                    darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tool.icon className="w-5 h-5" />
                  <span className="font-medium">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default StudentNavbar;
