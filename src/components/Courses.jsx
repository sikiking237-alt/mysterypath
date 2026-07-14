?import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Courses = ({
  allCourses = [],
  enrolledCourses = [],
  completedCourses = [],
  wishlist = [],
  searchTerm = "",
  setSearchTerm = () => {},
  filterLevel = "all",
  setFilterLevel = () => {},
  onEnroll = () => {},
  onCompleteCourse = () => {},
  onUpdateProgress = () => {},
  addToWishlist = () => {},
  darkMode = false,
  onViewAllCourses = null, // NEW PROP
  onViewMyLearning = null, // NEW PROP
  isEnrolling,
  enrollingCourseId,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const displayCourses = allCourses.length > 0 ? allCourses : [];

  const categories = [
    "all",
    ...new Set(displayCourses.map((course) => course.category).filter(Boolean)),
  ];

  const filteredCourses = displayCourses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || course.level === filterLevel;
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const isEnrolled = (id) => enrolledCourses?.some((e) => e.id === id) || false;

  const getLevelStyle = (level) => {
    switch (level) {
      case "Beginner":
        return {
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          text: "text-emerald-700 dark:text-emerald-400",
          label: "?? Beginner",
        };
      case "Intermediate":
        return {
          bg: "bg-orange-100 dark:bg-orange-900/30",
          text: "text-orange-700 dark:text-orange-400",
          label: "? Intermediate",
        };
      case "Advanced":
        return {
          bg: "bg-rose-100 dark:bg-rose-900/30",
          text: "text-rose-700 dark:text-rose-400",
          label: "?? Advanced",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-700/50 dark:bg-gray-800 dark:bg-gray-700 dark:bg-gray-800",
          text: "text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500",
          label: level || "Course",
        };
    }
  };

  const handleCourseAction = (course) => {
    if (isEnrolled(course.id)) {
      navigate(`/course-player/${course.id}`);
    } else {
      onEnroll(course);
    }
  };

  // Navigation handlers
  const handleViewAllCourses = () => {
    if (onViewAllCourses) {
      onViewAllCourses();
    } else {
      navigate("/courses");
    }
  };

  const handleViewMyLearning = () => {
    if (onViewMyLearning) {
      onViewMyLearning();
    } else {
      navigate("/my-learning");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2
          className={`text-3xl md:text-4xl font-bold mb-4 ${darkMode ? "text-white dark:text-gray-100 dark:text-gray-100" : "text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100"}`}
        >
          ?? Explore Our{" "}
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Courses
          </span>
        </h2>
        <p
          className={`text-lg ${darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}`}
        >
          Choose from {displayCourses.length} expert-led courses to advance your
          career
        </p>
      </div>

      {/* Navigation Buttons Section */}
      <div className="mb-6 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-3">
          {(onViewAllCourses || true) && (
            <button
              onClick={handleViewAllCourses}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white dark:text-gray-100 dark:text-gray-100 hover:shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50 flex items-center gap-2"
            >
              <span>??</span>
              Browse All Courses
              <span>?</span>
            </button>
          )}
          {(onViewMyLearning || true) && (
            <button
              onClick={handleViewMyLearning}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all border-2 ${
                darkMode
                  ? "border-gray-600 text-white dark:text-gray-100 dark:text-gray-100 hover:bg-gray-700"
                  : "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700/50 dark:bg-gray-900 dark:hover:bg-gray-700/50 dark:bg-gray-900"
              } flex items-center gap-2`}
            >
              <span>??</span>
              My Learning
            </button>
          )}
        </div>

        {/* Stats Badge */}
        <div
          className={`px-4 py-2 rounded-full text-sm ${darkMode ? "bg-gray-800 text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300" : "bg-gray-100 dark:bg-gray-700/50 dark:bg-gray-800 dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}`}
        >
          ?? {enrolledCourses.length} Courses in Progress
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="?? Search courses by title or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-white dark:text-gray-100 dark:text-gray-100 focus:border-purple-500"
                  : "bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100 focus:border-purple-500"
              }`}
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className={`px-5 py-3 rounded-xl border-2 focus:outline-none cursor-pointer ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white dark:text-gray-100 dark:text-gray-100"
                : "bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100"
            }`}
          >
            <option value="all">?? All Levels</option>
            <option value="Beginner">?? Beginner</option>
            <option value="Intermediate">? Intermediate</option>
            <option value="Advanced">?? Advanced</option>
          </select>

          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-5 py-3 rounded-xl border-2 focus:outline-none cursor-pointer ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-white dark:text-gray-100 dark:text-gray-100"
                  : "bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100"
              }`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "?? All Categories" : `?? ${cat}`}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white dark:text-gray-100 dark:text-gray-100 shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50"
                  : darkMode
                    ? "bg-gray-800 text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"
                    : "bg-gray-100 dark:bg-gray-700/50 dark:bg-gray-800 dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"
              }`}
            >
              ? Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white dark:text-gray-100 dark:text-gray-100 shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50"
                  : darkMode
                    ? "bg-gray-800 text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"
                    : "bg-gray-100 dark:bg-gray-700/50 dark:bg-gray-800 dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"
              }`}
            >
              ? List
            </button>
          </div>
        </div>

        <div
          className={`mt-4 text-sm ${darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500"} flex justify-between items-center`}
        >
          <span>
            Showing{" "}
            <span className="font-semibold">{filteredCourses.length}</span> of{" "}
            {displayCourses.length} courses
          </span>
          {(searchTerm ||
            filterLevel !== "all" ||
            selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterLevel("all");
                setSelectedCategory("all");
              }}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear all filters ?
            </button>
          )}
        </div>
      </div>

      {/* Course Grid/List */}
      {filteredCourses.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-6"
          }
        >
          {filteredCourses.map((course) => {
            const levelStyle = getLevelStyle(course.level);
            const enrolled = isEnrolled(course.id);
            const currentlyEnrolling = isEnrolling && enrollingCourseId === course.id;
            const isWishlisted =
              wishlist?.some((w) => w.id === course.id) || false;

            return (
              <div
                key={course.id}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow dark:shadow-gray-900/30-2xl hover:-translate-y-1 ${
                  darkMode ? "bg-gray-800" : "bg-white dark:bg-gray-800 dark:bg-gray-800"
                } shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50`}
              >
                <div className={`relative overflow-hidden h-52`}>
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <button
                    onClick={() => addToWishlist(course)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white dark:bg-gray-800 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center text-2xl transition-transform hover:scale-110"
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    {isWishlisted ? "??" : "??"}
                  </button>

                  <div
                    className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold ${levelStyle.bg} ${levelStyle.text} backdrop-blur-sm`}
                  >
                    {levelStyle.label}
                  </div>

                  {course.popular && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white dark:text-gray-100 dark:text-gray-100">
                      ?? Popular
                    </div>
                  )}

                  {enrolled && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white dark:text-gray-100 dark:text-gray-100">
                      ? Enrolled
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">?????</span>
                      <span
                        className={`text-sm font-medium ${darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}`}
                      >
                        {course.instructor}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">?</span>
                      <span className="font-semibold text-yellow-600">
                        {course.rating}
                      </span>
                      <span
                        className={`text-xs ${darkMode ? "text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500"}`}
                      >
                        ({course.students.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  <h3
                    className={`text-xl font-bold mb-2 ${darkMode ? "text-white dark:text-gray-100 dark:text-gray-100" : "text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100"}`}
                  >
                    {course.title}
                  </h3>
                  <p
                    className={`text-sm mb-4 line-clamp-2 ${darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}`}
                  >
                    {course.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-1 text-sm">
                      <span>?</span>
                      <span
                        className={darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}
                      >
                        {course.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span>??</span>
                      <span
                        className={darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}
                      >
                        {course.students.toLocaleString()} students
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span>??</span>
                      <span
                        className={darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}
                      >
                        +{course.xpReward} XP
                      </span>
                    </div>
                    {course.category && (
                      <div className="flex items-center gap-1 text-sm">
                        <span>??</span>
                        <span
                          className={
                            darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"
                          }
                        >
                          {course.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCourseAction(course)}
                    disabled={currentlyEnrolling}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait ${
                      enrolled
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50"
                    } text-white dark:text-gray-100 dark:text-gray-100`}
                  >
                    {currentlyEnrolling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        <span>Enrolling...</span>
                      </>
                    ) : enrolled ? (
                      <>
                        <span>??</span> Continue Learning ?
                      </>
                    ) : (
                      <>
                        <span>??</span> Enroll Now
                        {course.xpReward > 0 && (
                          <span className="text-sm bg-white dark:bg-gray-800 dark:bg-gray-800/20 px-2 py-0.5 rounded-full">
                            +{course.xpReward} XP
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`text-center py-20 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white dark:bg-gray-800 dark:bg-gray-800"} shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50`}
        >
          <div className="text-6xl mb-4">??</div>
          <h3
            className={`text-2xl font-bold mb-2 ${darkMode ? "text-white dark:text-gray-100 dark:text-gray-100" : "text-gray-900 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100"}`}
          >
            No courses found
          </h3>
          <p className={`mb-6 ${darkMode ? "text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300"}`}>
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterLevel("all");
              setSelectedCategory("all");
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-xl font-semibold hover:shadow dark:shadow-gray-900/30-lg dark:shadow dark:shadow-gray-900/30-gray-900/50 transition-all"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Courses;


