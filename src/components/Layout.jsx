import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ darkMode, setDarkMode, userName, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  const API_URL = "/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchUserStats();
    }
  }, [token]);

  const fetchUserStats = async () => {
    try {
      // Fetch profile
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserXP(data.xp || 0);
        setUserLevel(Math.floor((data.xp || 0) / 500) + 1);
      }

      // Fetch enrolled courses
      const coursesResponse = await fetch(`${API_URL}/my-learning`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        setEnrolledCount(courses.length);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Fixed width, not fixed position */}
      <div className="flex-shrink-0">
        <Navbar
          userName={userName}
          onLogout={onLogout}
          enrolledCount={enrolledCount}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          userXP={userXP}
          userLevel={userLevel}
          onSidebarChange={setSidebarCollapsed}
        />
      </div>

      {/* Main Content - Takes remaining space */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
