import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutButton from '../components/LogoutButton';
import { 
  LayoutDashboard, BookOpen, Users, BarChart3, 
  Bell, Sun, Moon, User, ChevronDown, 
  Sparkles, Camera, Settings, HelpCircle, Menu, X
} from "lucide-react";
import InstructorProfile from "../InstructorProfile";

const InstructorNavbar = ({ userName, onLogout, darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const userMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Load profile image from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem("instructor_profile_image");
    if (savedImage) setProfileImage(savedImage);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem("instructor_profile_image", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/instructor-dashboard", icon: LayoutDashboard },
    { name: "My Courses", path: "/instructor-courses", icon: BookOpen },
    { name: "Students", path: "/instructor-students", icon: Users },
    { name: "Analytics", path: "/instructor-analytics", icon: BarChart3 },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/instructor-dashboard")}>
              <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Learn<span className="text-purple-600">Flow</span>
                </span>
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">Instructor</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive(item.path) 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button 
                onClick={onToggleDarkMode} 
                className={`p-2 rounded-lg transition-all duration-200 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <button 
                className={`p-2 rounded-lg transition-all duration-200 relative ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative group">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current.click();
                      }}
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 cursor-pointer hover:scale-110 transition shadow-md"
                      title="Change profile picture"
                    >
                      <Camera className="w-3 h-3 text-gray-600" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{userName?.split(' ')[0] || 'Instructor'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} animate-fade-in`}>
                    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                            {userName?.charAt(0).toUpperCase() || "I"}
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userName || "Instructor"}</div>
                          <div className="text-xs text-gray-500">Instructor Account</div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    
                    <button
                      onClick={() => { navigate("/instructor-dashboard"); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    
                    <button
                      onClick={() => { navigate("/instructor-courses"); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>My Courses</span>
                    </button>
                    
                    <button
                      onClick={() => { navigate("/instructor-settings"); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                    
                    <LogoutButton
                      onLogout={() => { onLogout(); setShowUserMenu(false); }}
                      darkMode={darkMode}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    />
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden fixed inset-0 z-40 pt-16 ${darkMode ? 'bg-gray-900' : 'bg-white'} animate-fade-in`}>
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.path) ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
            <hr className="my-2" />
            <button
              onClick={() => { setShowProfile(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button onClick={onToggleDarkMode} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <LogoutButton
              onLogout={onLogout}
              darkMode={darkMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600"
            />
          </div>
        </div>
      )}

      {/* Instructor Profile Modal */}
      {showProfile && <InstructorProfile darkMode={darkMode} onClose={() => setShowProfile(false)} />}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstructorNavbar;