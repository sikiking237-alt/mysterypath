// src/pages/HomePage.jsx - With Translations
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useGetAllCoursesQuery, useEnrollInCourseMutation } from "../features/courses/coursesApi";
import { 
  BookOpen, Award, Users, GraduationCap, TrendingUp,
  Sparkles, Clock, ChevronRight, LayoutDashboard, Target,
  Zap, Globe, Shield, Headphones, MessageCircle, Calendar,
  Star, PlayCircle, FileText, BarChart3, UserCheck,
  Briefcase, Settings, HelpCircle, Code, Bot, Heart
} from "lucide-react";

const HomePage = ({ userName, onLogout, darkMode }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: allCourses, isLoading: coursesLoading } = useGetAllCoursesQuery();
  const featuredCourses = allCourses?.slice(0, 4) || [];
  const [enrollInCourse, { isLoading: isEnrolling }] = useEnrollInCourseMutation();
  const [wishlist, setWishlist] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("course_wishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        setWishlist([]);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const fetchEnrolled = async () => {
      try {
        const res = await fetch("/api/my-learning", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEnrolledCourseIds(Array.isArray(data) ? data.map((c) => c.id) : []);
        }
      } catch (e) {
        console.error("Failed to load enrolled courses", e);
      }
    };
    fetchEnrolled();
  }, []);

  const addToWishlist = (course) => {
    setWishlist((prev) => {
      const updated = prev.some((w) => w.id === course.id) ? prev.filter((w) => w.id !== course.id) : [...prev, course];
      localStorage.setItem("course_wishlist", JSON.stringify(updated));
      return updated;
    });
  };

  const isWishlisted = (courseId) => wishlist.some((w) => w.id === courseId);
  const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

  const goTo = {
    courses: () => navigate("/courses"),
    dashboard: () => navigate("/dashboard"),
    myLearning: () => navigate("/my-learning"),
    certificates: () => navigate("/my-certificates"),
    support: () => navigate("/support"),
    notes: () => navigate("/notes"),
    flashcards: () => navigate("/flashcards"),
    aiTutor: () => navigate("/ai-tutor"),
    planner: () => navigate("/planner"),
    achievements: () => navigate("/achievements"),
    wishlist: () => navigate("/wishlist"),
    podcasts: () => navigate("/podcasts"),
    codePractice: () => navigate("/code-practice"),
    courseDetail: (id) => navigate(`/course-player/${id}`),
    community: () => navigate("/chat"),
  };

  const handleEnrollAndNavigate = async (courseId) => {
    try {
      const result = await enrollInCourse(courseId).unwrap();
      toast.success(result.message || 'Enrollment successful!');
      setEnrolledCourseIds((prev) => [...prev, courseId]);
      navigate(`/course-player/${courseId}`);
    } catch (err) {
      const errorMessage = err.data?.message || err.data?.error || 'Failed to enroll in course. Please try again.';
      if (err.status === 409 || (err.status === 400 && String(errorMessage).toLowerCase().includes('already enrolled'))) {
        setEnrolledCourseIds((prev) => [...prev, courseId]);
        navigate(`/course-player/${courseId}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const quickStats = [
    { value: "200+", label: t.courses || "Courses", icon: BookOpen, color: "text-blue-500" },
    { value: "50K+", label: t.students || "Students", icon: Users, color: "text-green-500" },
    { value: "100+", label: t.instructors || "Instructors", icon: GraduationCap, color: "text-purple-500" },
    { value: "4.8", label: t.rating || "Rating", icon: Star, color: "text-amber-500" },
  ];

  const userStats = [
    { value: "200+", label: t.totalCourses || "Total Courses", icon: BookOpen, color: "text-blue-500" },
    { value: "3", label: t.myCourses || "My Courses", icon: LayoutDashboard, color: "text-indigo-500" },
    { value: "2", label: t.certificates || "Certificates", icon: Award, color: "text-amber-500" },
    { value: "0", label: t.totalXP || "Total XP", icon: Zap, color: "text-purple-500" },
  ];

  const tools = [
    { name: t.notes || "Notes", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", path: "/notes" },
    { name: t.flashcards || "Flashcards", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", path: "/flashcards" },
    { name: t.aiTutor || "AI Tutor", icon: Bot, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20", path: "/ai-tutor" },
    { name: t.planner || "Planner", icon: Calendar, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", path: "/planner" },
    { name: t.achievements || "Achievements", icon: Award, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", path: "/achievements" },
    { name: t.wishlist || "Wishlist", icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", path: "/wishlist" },
    { name: t.podcasts || "Podcasts", icon: Headphones, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", path: "/podcasts" },
    { name: t.codeLab || "Code Lab", icon: Code, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", path: "/code-practice" },
  ];

  const features = [
    { 
      title: t.personalizedLearning || "Personalized Learning", 
      description: t.personalizedDesc || "AI-powered recommendations tailored to your goals",
      icon: Target,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      title: t.trackProgress || "Track Progress", 
      description: t.trackDesc || "Detailed analytics and insights on your learning journey",
      icon: BarChart3,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
      title: t.communitySupport || "Community Support", 
      description: t.communityDesc || "Connect and learn with peers from around the world",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20"
    },
    { 
      title: t.certificatesFeature || "Certificates", 
      description: t.certificatesDesc || "Earn recognized certificates upon course completion",
      icon: Award,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20"
    },
    { 
      title: t.learnAnywhere || "Learn Anywhere", 
      description: t.learnAnywhereDesc || "Access your courses on any device, anytime",
      icon: Globe,
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-900/20"
    },
    { 
      title: t.careerFocused || "Career Focused", 
      description: t.careerDesc || "Develop practical skills that matter for your career",
      icon: Briefcase,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20"
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 px-4 text-sm cursor-pointer hover:opacity-90 transition flex items-center justify-center gap-2"
        onClick={goTo.support}
      >
        <span>{t.limitedTime || "Limited Time: Get 30% off all courses."}</span>
        <ChevronRight className="w-4 h-4" />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {t.welcome || "Welcome back"}, {userName || "Student"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              {t.continueLearning || "Continue your learning journey"}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={goTo.courses}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t.dashboard || "Dashboard"}
            </button>
            <button
              onClick={goTo.support}
              className="px-6 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              {t.support || "Help"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              onClick={goTo.courses}
              className={`p-4 rounded-xl shadow-lg cursor-pointer transition hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <span className="text-xs text-gray-400">Click to explore</span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {userStats.map((stat, index) => (
            <div key={index} className={`p-4 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {t.featuredCourses || "Featured Courses"}
              </h2>
            </div>
            <button
              onClick={goTo.courses}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
            >
              {t.viewAll || "View All"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t.mostPopular || "Most popular courses this month"}</p>
          {coursesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading courses...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`rounded-xl shadow-lg overflow-hidden cursor-pointer transition hover:shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
                >
                  <div className="relative">
                    <img src={course.image_url || "/placeholder.jpg"} alt={course.title} className="w-full h-40 object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWishlist({
                          id: course.id,
                          title: course.title,
                          instructor: course.instructor_name,
                          image: course.image_url,
                          price: course.price || 0,
                          rating: course.rating || 4.5,
                        });
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted(course.id) ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{course.rating || "4.5"}</span>
                    </div>
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {course.instructor_name || "Instructor"}
                    </p>
                    <button
                      onClick={() => handleEnrollAndNavigate(course.id)}
                      disabled={isEnrolling}
                      className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                        isEnrolled(course.id)
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      {isEnrolling
                        ? 'Enrolling...'
                        : isEnrolled(course.id)
                        ? 'Go to Course'
                        : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {t.learningToolkit || "Learning Toolkit"}
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t.everythingYouNeed || "Everything you need to succeed"}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className={`p-4 rounded-xl shadow-lg text-center transition hover:scale-105 ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:shadow-xl"} ${tool.bg}`}
              >
                <tool.icon className={`w-6 h-6 mx-auto ${tool.color} mb-2`} />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {tool.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {t.whyChoose || "Why Choose MysteryPath"}
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t.bestExperience || "The best learning experience designed for your success"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className={`p-4 rounded-xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} ${feature.bg} border border-transparent hover:border-current transition`}>
                <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-8 rounded-xl shadow-lg text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {t.readyToStart || "Ready to Start Your Journey"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t.joinThousands || "Join thousands of students already learning on MysteryPath"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={goTo.courses}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {t.getStarted || "Browse Free Courses"}
            </button>
            <button
              onClick={goTo.courses}
              className="px-6 py-3 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {t.browseCourses || "Browse Courses"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;


