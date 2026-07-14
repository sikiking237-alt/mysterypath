import React, { useState, useEffect, useCallback } from "react";
import { apiEndpoints } from "../../config/apiConfig";

const AdminManageCourses = ({ darkMode }) => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [notification, setNotification] = useState(null);

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    instructor_name: "",
    instructor_id: "",
    level: "Beginner",
    category: "Development",
    price: 49,
    image_url:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop",
    xpReward: 100,
  });

  const token = localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ========== FETCH FUNCTIONS ==========
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching courses from:", apiEndpoints.admin.allCourses);
      const response = await fetch(apiEndpoints.admin.allCourses, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} courses`);
        setCourses(data);
      } else {
        console.error("Failed to fetch courses:", response.status);
        showNotification("Failed to fetch courses", "error");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      showNotification("Error fetching courses", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchInstructors = useCallback(async () => {
    try {
      console.log("🔍 Fetching instructors from:", apiEndpoints.admin.users);
      const response = await fetch(apiEndpoints.admin.users, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.users || []);
        const instructorList = list.filter((user) => user.role === "instructor");
        console.log(`✅ Loaded ${instructorList.length} instructors`);
        setInstructors(instructorList);
      } else {
        console.error("Failed to fetch instructors:", response.status);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  }, [token]);

  // ========== CRUD OPERATIONS ==========
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const url = apiEndpoints.courses.delete(courseId);
      console.log("🗑️ Deleting course at:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showNotification("✅ Course deleted successfully");
        fetchCourses();
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to delete course", "error");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      showNotification("Error deleting course", "error");
    }
  };

  const handleCreateCourse = async () => {
    try {
      const url = apiEndpoints.admin.courses;
      console.log("📝 Creating course at:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        showNotification("✅ Course created successfully");
        setShowAddModal(false);
        setNewCourse({
          title: "",
          description: "",
          instructor_name: "",
          instructor_id: "",
          level: "Beginner",
          category: "Development",
          price: 49,
          image_url:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop",
          xpReward: 100,
        });
        fetchCourses();
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to create course", "error");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      showNotification("Error creating course", "error");
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const url = apiEndpoints.courses.update(selectedCourse.id);
      console.log("📝 Updating course at:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedCourse),
      });

      if (response.ok) {
        showNotification("✅ Course updated successfully");
        setShowEditModal(false);
        fetchCourses();
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to update course", "error");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      showNotification("Error updating course", "error");
    }
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, [fetchCourses, fetchInstructors]);

  // ========== FILTERS ==========
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstructor =
      selectedInstructor === "all" || course.instructor_id == selectedInstructor;
    return matchesSearch && matchesInstructor;
  });

  // ========== STATS ==========
  const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0);
  const totalRevenue = courses.reduce(
    (sum, c) => sum + ((c.students || 0) * (c.price || 49)),
    0
  );

  const levels = ["Beginner", "Intermediate", "Advanced"];
  const categories = [
    "Development",
    "Data Science",
    "Design",
    "Cloud",
    "Marketing",
    "Business",
  ];

  // ========== RENDER ==========
  return (
    <div className="p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm ${
            notification.type === "error" ? "bg-red-500" : "bg-green-500"
          } shadow-lg`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Manage Courses
          </h1>
          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            View, edit, and manage all courses from instructors
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition flex items-center gap-2"
        >
          <span>➕</span> Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by course title or instructor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-4 py-2 rounded-lg border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
        />
        <select
          value={selectedInstructor}
          onChange={(e) => setSelectedInstructor(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]`}
        >
          <option value="all">All Instructors</option>
          {instructors.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-xl text-center ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <div className="text-2xl font-bold">{courses.length}</div>
          <div className="text-xs text-gray-500">Total Courses</div>
        </div>
        <div
          className={`p-4 rounded-xl text-center ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <div className="text-2xl font-bold">{instructors.length}</div>
          <div className="text-xs text-gray-500">Instructors</div>
        </div>
        <div
          className={`p-4 rounded-xl text-center ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <div className="text-2xl font-bold">{totalStudents}</div>
          <div className="text-xs text-gray-500">Total Students</div>
        </div>
        <div
          className={`p-4 rounded-xl text-center ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading courses...</p>
        </div>
      ) : (
        <div
          className={`rounded-xl overflow-hidden border ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No courses found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div
                            className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {course.instructor_name?.charAt(0) ||
                              course.instructor?.charAt(0) ||
                              "?"}
                          </div>
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {course.instructor_name ||
                              course.instructor ||
                              "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            course.level === "Beginner"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : course.level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {course.level}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {course.students || 0}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          darkMode ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        $
                        {((course.students || 0) * (course.price || 49)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowEditModal(true);
                            }}
                            className={`px-3 py-1 text-sm rounded-lg transition ${
                              darkMode
                                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className={`px-3 py-1 text-sm rounded-lg transition ${
                              darkMode
                                ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div
            className={`px-4 py-3 border-t text-sm ${
              darkMode
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-500"
            }`}
          >
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className={`max-w-lg w-full mx-4 rounded-xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            } max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Add New Course
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Course Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Web Development Bootcamp"
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Description *
                </label>
                <textarea
                  placeholder="Describe what students will learn..."
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  rows="3"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Instructor Name
                </label>
                <input
                  type="text"
                  placeholder="Instructor name"
                  value={newCourse.instructor_name}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      instructor_name: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Level
                  </label>
                  <select
                    value={newCourse.level}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, level: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, category: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Price ($)
                  </label>
                  <input
                    type="number"
                    placeholder="49"
                    value={newCourse.price}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    XP Reward
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={newCourse.xpReward}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        xpReward: parseInt(e.target.value) || 100,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  />
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={newCourse.image_url}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, image_url: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCourse}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition"
              >
                Create Course
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className={`max-w-lg w-full mx-4 rounded-xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Edit Course
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Course Title
                </label>
                <input
                  type="text"
                  value={selectedCourse.title}
                  onChange={(e) =>
                    setSelectedCourse({
                      ...selectedCourse,
                      title: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Description
                </label>
                <textarea
                  value={selectedCourse.description}
                  onChange={(e) =>
                    setSelectedCourse({
                      ...selectedCourse,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Level
                  </label>
                  <select
                    value={selectedCourse.level}
                    onChange={(e) =>
                      setSelectedCourse({
                        ...selectedCourse,
                        level: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Category
                  </label>
                  <select
                    value={selectedCourse.category}
                    onChange={(e) =>
                      setSelectedCourse({
                        ...selectedCourse,
                        category: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Price ($)
                </label>
                <input
                  type="number"
                  value={selectedCourse.price || 0}
                  onChange={(e) =>
                    setSelectedCourse({
                      ...selectedCourse,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCourse}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageCourses;