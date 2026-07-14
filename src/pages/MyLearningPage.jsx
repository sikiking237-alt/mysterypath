import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Certificate from "../components/Certificate";
import AIAssistant from "../components/AIAssistant";
import { apiEndpoints } from "../config/apiConfig";

const MyLearningPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showCertificate, setShowCertificate] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const token = localStorage.getItem("token");
  // Get userName from localStorage correctly
  const [userName, setUserName] = useState("");

  // Fetch user profile to get the name
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(apiEndpoints.users.profile, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          setSessionExpired(true);
          return;
        }
        if (response.ok) {
          const data = await response.json();
          console.log("User profile data:", data);
          setUserName(
            data.name || localStorage.getItem("userName") || "Student",
          );
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Fallback to localStorage
        const storedName = localStorage.getItem("userName");
        if (storedName) setUserName(storedName);
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch(apiEndpoints.enrollments.myLearning, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        setSessionExpired(true);
        setEnrolledCourses([]);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setEnrolledCourses(data);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (courseId, newProgress) => {
    setUpdatingId(courseId);
    try {
      const response = await fetch(apiEndpoints.enrollments.progress, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: courseId, lesson_id: 1 }),
      });
      if (response.ok) {
        setEnrolledCourses((prev) =>
          prev.map((course) =>
            course.id === courseId
              ? { ...course, progress: newProgress }
              : course,
          ),
        );
        showNotification(`Progress updated to ${newProgress}%!`, "success");
      }
    } catch (error) {
      showNotification("Error updating progress", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const completeCourse = async (courseId, xpReward, courseTitle) => {
    setUpdatingId(courseId);
    try {
      const response = await fetch(apiEndpoints.enrollments.complete, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: courseId, xp_reward: xpReward || 0 }),
      });

      if (response.ok) {
        setEnrolledCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? { ...course, progress: 100 } : course,
          ),
        );
        showNotification(
          `🎉 Course completed! +${xpReward} XP earned!`,
          "success",
        );

        // SHOW CERTIFICATE WITH USER NAME
        setShowCertificate({
          courseName: courseTitle,
          date: new Date().toLocaleDateString(),
        });
      }
    } catch (error) {
      showNotification("Error completing course", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const viewCertificate = (course) => {
    setShowCertificate({
      courseName: course.title,
      date:
        course.completed_at ||
        course.completed_date ||
        new Date().toLocaleDateString(),
    });
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  if (sessionExpired) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div
          className={`max-w-md w-full mx-4 rounded-2xl p-8 text-center shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
        >
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-3">Session expired</h2>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>
            Please log in again to load your enrolled courses and continue
            learning.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-semibold text-sm ${
            notification.type === "error" ? "bg-red-500" : "bg-emerald-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              My Learning
            </h1>
            <p
              className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Welcome, {userName}! {enrolledCourses.length} course
              {enrolledCourses.length !== 1 ? "s" : ""} in progress
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              {darkMode ? "Light" : "Dark"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Browse More Courses
            </button>
          </div>
        </div>

        {enrolledCourses.length === 0 ? (
          <div
            className={`text-center py-16 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
          >
            <div className="text-6xl mb-4">Courses</div>
            <h2
              className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              No courses yet
            </h2>
            <p
              className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              You haven't enrolled in any courses yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-semibold"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => {
              const progress = course.progress || 0;
              const isCompleted = progress >= 100;

              return (
                <div
                  key={course.id}
                  className={`rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                >
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5">
                    <h3
                      className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {course.title}
                    </h3>
                    <p
                      className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      by {course.instructor}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-indigo-600">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-700 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {isCompleted ? (
                      <button
                        onClick={() => viewCertificate(course)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
                      >
                        View Certificate
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            updateProgress(
                              course.id,
                              Math.min(progress + 25, 100),
                            )
                          }
                          disabled={updatingId === course.id}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {updatingId === course.id
                            ? "Updating..."
                            : "Continue Learning (+25%)"}
                        </button>
                        {progress >= 75 && (
                          <button
                            onClick={() =>
                              completeCourse(
                                course.id,
                                course.xpReward,
                                course.title,
                              )
                            }
                            disabled={updatingId === course.id}
                            className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                          >
                            Complete Course
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/course-player/${course.id}`)
                          }
                          className="w-full py-2 border border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition"
                        >
                          Go to Course
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Assistant Section */}
      <div className="mt-8">
        <AIAssistant darkMode={darkMode} type="explain" />
      </div>

      {/* Certificate Modal - Pass the correct userName */}
      {showCertificate && (
        <Certificate
          userName={userName}
          courseName={showCertificate.courseName}
          completionDate={showCertificate.date}
          darkMode={darkMode}
          onClose={() => setShowCertificate(null)}
        />
      )}
    </div>
  );
};

export default MyLearningPage;
