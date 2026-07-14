import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CourseEnrollmentButton from "./CourseEnrollmentButton";

const HomePage = ({
  userName,
  userXP,
  userStreak,
  enrolledCount,
  refreshEnrolledCount,
  onLogout,
  darkMode,
  setDarkMode,
}) => {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/my-learning', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEnrolledCourseIds(Array.isArray(data) ? data.map((c) => c.id) : []);
        }
      } catch (e) {
        console.error('Failed to load enrolled courses', e);
      }
    };
    fetchEnrolled();
  }, [token]);

  // Navigation functions
  const goTo = {
    home: () => navigate("/"),
    courses: () => navigate("/courses"),
    dashboard: () => navigate("/dashboard"),
    profile: () => navigate("/profile"),
    myLearning: () => navigate("/my-learning"),
    certificates: () => navigate("/certificates"),
    settings: () => navigate("/settings"),
    support: () => navigate("/support"),
    about: () => navigate("/about"),
    privacy: () => navigate("/privacy"),
    terms: () => navigate("/terms"),
    contact: () => navigate("/contact"),
    login: () => navigate("/login"),
    signup: () => navigate("/signup"),
    community: () => navigate("/chat"),
    achievements: () => navigate("/achievements"),
    wishlist: () => navigate("/wishlist"),
    notes: () => navigate("/notes"),
    flashcards: () => navigate("/flashcards"),
    aiTutor: () => navigate("/ai-tutor"),
    planner: () => navigate("/planner"),
    podcasts: () => navigate("/podcasts"),
    codePractice: () => navigate("/code-practice"),
    courseDetail: (id) => navigate(`/course/${id}`),
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userName");
      if (onLogout) onLogout();
      navigate("/login");
    },
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const featuredCourses = [
    {
      id: 1,
      title: "Mastering Python",
      instructor: "LearnFlow Instructor",
      duration: "0h",
      rating: 4.8,
      students: 0,
      image:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=240&fit=crop",
    },
    {
      id: 2,
      title: "React for Beginners",
      instructor: "LearnFlow Instructor",
      duration: "0h",
      rating: 4.9,
      students: 0,
      image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=240&fit=crop",
    },
    {
      id: 3,
      title: "UI Design Fundamentals",
      instructor: "LearnFlow Instructor",
      duration: "0h",
      rating: 4.7,
      students: 0,
      image:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=400&h=240&fit=crop",
    },
  ];

  const tools = [
    { name: "Notes", icon: "📝", action: goTo.notes },
    { name: "Flashcards", icon: "🃏", action: goTo.flashcards },
    { name: "AI Tutor", icon: "🤖", action: goTo.aiTutor },
    { name: "Planner", icon: "📅", action: goTo.planner },
    { name: "Achievements", icon: "🏆", action: goTo.achievements },
    { name: "Wishlist", icon: "❤️", action: goTo.wishlist },
    { name: "Podcasts", icon: "🎧", action: goTo.podcasts },
    { name: "Code Lab", icon: "💻", action: goTo.codePractice },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] animate-slide-in-right">
          <div
            className={`relative px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all overflow-hidden ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-red-600 text-white border-red-500"
            }`}
          >
            <span className="text-xl">
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="font-bold">{toast.message}</span>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/40 animate-toast-progress" />
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm cursor-pointer hover:opacity-90 transition"
        onClick={goTo.courses}
      >
        Limited Time: Get 30% off all courses! Click here
      </div>

      {/* Navigation Bar */}
      <nav
        className={`sticky top-0 z-50 ${darkMode ? "bg-gray-900/95" : "bg-white/95"} backdrop-blur-md border-b ${darkMode ? "border-gray-800" : "border-gray-200"} hidden`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              onClick={goTo.home}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span
                className={`font-bold text-xl ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Mystery<span className="text-purple-600">Path</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={goTo.courses}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
              >
                Courses
              </button>
              <button
                onClick={goTo.myLearning}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
              >
                My Learning
              </button>
              <button
                onClick={goTo.community}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
              >
                Community
              </button>
              <button
                onClick={goTo.support}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
              >
                Support
              </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                {darkMode ? "Light" : "Dark"}
              </button>

              {token ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium">
                    {userName?.split(" ")[0] || "Student"}
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 z-50 ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
                  >
                    <button
                      onClick={goTo.profile}
                      className={`w-full text-left px-4 py-3 text-sm transition flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={goTo.dashboard}
                      className={`w-full text-left px-4 py-3 text-sm transition flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={goTo.achievements}
                      className={`w-full text-left px-4 py-3 text-sm transition flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Achievements
                    </button>
                    <button
                      onClick={goTo.wishlist}
                      className={`w-full text-left px-4 py-3 text-sm transition flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={goTo.settings}
                      className={`w-full text-left px-4 py-3 text-sm transition flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      Settings
                    </button>
                    <hr
                      className={`my-1 ${darkMode ? "border-gray-700" : "border-gray-100"}`}
                    />
                    <button
                      onClick={goTo.logout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={goTo.login}
                    className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={goTo.signup}
                    className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`${darkMode ? "bg-gradient-to-br from-gray-900 to-purple-900" : "bg-gradient-to-r from-purple-600 to-pink-600"} text-white py-20`}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm mb-6">
            Trusted by 50,000+ learners
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Master Skills That <span className="text-yellow-300">Matter</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Learn from industry experts, earn certificates, and advance your
            career.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {token ? (
              <>
                <button
                  onClick={goTo.dashboard}
                  className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition shadow-lg flex items-center gap-2"
                >
                  <span>📊</span> View Dashboard
                </button>
                <button
                  onClick={goTo.codePractice}
                  className="px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition flex items-center gap-2"
                >
                  <span>💻</span> Coding Lab
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goTo.signup}
                  className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition shadow-lg"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={goTo.courses}
                  className="px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition"
                >
                  Explore Courses
                </button>
              </>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            <button
              onClick={goTo.courses}
              className="text-center hover:scale-105 transition"
            >
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm opacity-80">Courses</div>
            </button>
            <button
              onClick={goTo.community}
              className="text-center hover:scale-105 transition"
            >
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm opacity-80">Students</div>
            </button>
            <button
              onClick={goTo.courses}
              className="text-center hover:scale-105 transition"
            >
              <div className="text-3xl font-bold">100+</div>
              <div className="text-sm opacity-80">Instructors</div>
            </button>
            <button
              onClick={goTo.dashboard}
              className="text-center hover:scale-105 transition"
            >
              <div className="text-3xl font-bold">4.8</div>
              <div className="text-sm opacity-80">Rating</div>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="Courses"
            label="Total Courses"
            value="200+"
            onClick={goTo.courses}
            darkMode={darkMode}
          />
          <StatCard
            icon="My Learning"
            label="My Courses"
            value={enrolledCount || "0"}
            onClick={goTo.myLearning}
            darkMode={darkMode}
          />
          <StatCard
            icon="Certificates"
            label="Certificates"
            value="2"
            onClick={goTo.certificates}
            darkMode={darkMode}
          />
          <StatCard
            icon="XP"
            label="Total XP"
            value={userXP?.toLocaleString() || "0"}
            onClick={goTo.dashboard}
            darkMode={darkMode}
          />
        </div>
      </section>

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2
              className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Featured Courses
            </h2>
            <p
              className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Most popular courses this month
            </p>
          </div>
          <button
            onClick={goTo.courses}
            className="text-purple-600 font-medium hover:underline"
          >
            View All
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              darkMode={darkMode}
              isEnrolled={enrolledCourseIds.includes(course.id)}
            />
          ))}
        </div>
      </section>

      {/* Toolkit */}
      <section className={`py-12 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2
              className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Learning Toolkit
            </h2>
            <p
              className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Everything you need to succeed
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {tools.map((tool, i) => (
              <button
                key={i}
                onClick={tool.action}
                className={`p-4 rounded-xl text-center transition hover:scale-105 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <div className="text-2xl mb-1">{tool.name.charAt(0)}</div>
                <div
                  className={`text-xs font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {tool.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2
            className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Why Choose MysteryPath?
          </h2>
          <p
            className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            The best learning experience designed for your success
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🎯"
            title="Personalized Learning"
            description="AI-powered recommendations"
            action={goTo.courses}
            darkMode={darkMode}
          />
          <FeatureCard
            icon="📊"
            title="Track Progress"
            description="Detailed analytics"
            action={goTo.dashboard}
            darkMode={darkMode}
          />
          <FeatureCard
            icon="👥"
            title="Community Support"
            description="Learn with peers"
            action={goTo.community}
            darkMode={darkMode}
          />
          <FeatureCard
            icon="🏆"
            title="Certificates"
            description="Get recognized"
            action={goTo.certificates}
            darkMode={darkMode}
          />
          <FeatureCard
            icon="📱"
            title="Learn Anywhere"
            description="Any device, anytime"
            action={goTo.courses}
            darkMode={darkMode}
          />
          <FeatureCard
            icon="⚡"
            title="Career Focused"
            description="Skills that matter"
            action={goTo.dashboard}
            darkMode={darkMode}
          />
        </div>
      </section>

      {/* CTA */}
      <section
        className={`py-16 ${darkMode ? "bg-gradient-to-r from-purple-900 to-pink-900" : "bg-gradient-to-r from-purple-600 to-pink-600"} text-white text-center`}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students already learning on MysteryPath
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={goTo.signup}
              className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition"
            >
              Get Started Free
            </button>
            <button
              onClick={goTo.courses}
              className="px-8 py-3 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`py-12 border-t ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </div>
                <span
                  className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  MysteryPath
                </span>
              </div>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Empowering learners worldwide.
              </p>
            </div>
            <div>
              <h3
                className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Platform
              </h3>
              <FooterLink onClick={goTo.courses} darkMode={darkMode}>
                Courses
              </FooterLink>
              <FooterLink onClick={goTo.myLearning} darkMode={darkMode}>
                My Learning
              </FooterLink>
              <FooterLink onClick={goTo.community} darkMode={darkMode}>
                Community
              </FooterLink>
            </div>
            <div>
              <h3
                className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Support
              </h3>
              <FooterLink onClick={goTo.about} darkMode={darkMode}>
                About Us
              </FooterLink>
              <FooterLink onClick={goTo.contact} darkMode={darkMode}>
                Contact
              </FooterLink>
              <FooterLink onClick={goTo.support} darkMode={darkMode}>
                Help Center
              </FooterLink>
            </div>
            <div>
              <h3
                className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Legal
              </h3>
              <FooterLink onClick={goTo.privacy} darkMode={darkMode}>
                Privacy Policy
              </FooterLink>
              <FooterLink onClick={goTo.terms} darkMode={darkMode}>
                Terms of Service
              </FooterLink>
            </div>
          </div>
          <div
            className={`text-center pt-8 border-t ${darkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}
          >
            <p className="text-sm">© 2024 MysteryPath. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition"
        >
          Top
        </button>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: toast-progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, onClick, darkMode }) => (
  <div
    onClick={onClick}
    className={`p-5 rounded-2xl text-center cursor-pointer transition hover:scale-105 ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-lg"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
  >
    <div className="text-3xl mb-2">{label.charAt(0)}</div>
    <div
      className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
    >
      {value}
    </div>
    <div
      className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
    >
      {label}
    </div>
  </div>
);

const CourseCard = ({ course, darkMode, isEnrolled }) => (
  <div
    className={`rounded-xl overflow-hidden transition hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"} shadow border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
  >
    <img
      src={course.image}
      alt={course.title}
      className="w-full h-40 object-cover"
    />
    <div className="p-4">
      <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {course.title}
      </h3>
      <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-yellow-500">Star</span>
        <span className="text-sm">{course.rating}</span>
        <span className="text-xs text-gray-500">
          ({course.students} students)
        </span>
      </div>
      <CourseEnrollmentButton 
        courseId={course.id} 
        isEnrolled={isEnrolled} 
        onEnrollSuccess={(courseId) => setEnrolledCourseIds((prev) => [...prev, courseId])}
      />
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description, action, darkMode }) => (
  <button
    onClick={action}
    className={`p-5 rounded-xl text-center transition hover:scale-105 ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-md"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
  >
    <div className="text-3xl mb-3">{title.charAt(0)}</div>
    <h3
      className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}
    >
      {title}
    </h3>
    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
      {description}
    </p>
  </button>
);

const FooterLink = ({ onClick, children, darkMode }) => (
  <button
    onClick={onClick}
    className={`block text-sm ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"} transition mb-2`}
  >
    {children}
  </button>
);

export default HomePage;
