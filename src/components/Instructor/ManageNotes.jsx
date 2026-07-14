import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  X,
  RefreshCw,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { apiEndpoints } from "../../config/apiConfig";

const ManageCourses = ({ darkMode }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [notification, setNotification] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    level: "Beginner",
    category: "Development",
    price: 0,
    image_url: "",
    xpReward: 100,
  });

  const token = localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCourses = async () => {
    if (!token) {
      console.error("No authentication token found");
      showNotification("Please log in to view your courses", "error");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/instructor/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else if (response.status === 401) {
        showNotification(
          "Please log in as an instructor to manage courses",
          "error",
        );
        setCourses([]);
      } else {
        showNotification("Failed to load courses", "error");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const uploadImageToServer = async (file) => {
    if (!token) {
      showNotification("Please log in to upload images", "error");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      console.log("📤 Uploading image:", file.name);

      const response = await fetch(apiEndpoints.upload.image, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response:", data);

      if (response.ok && data.success) {
        showNotification("Image uploaded successfully!");
        return data.image_url;
      } else {
        showNotification(data.error || "Failed to upload image", "error");
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification("Error uploading image", "error");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        showNotification(
          "Only JPG, PNG, GIF, and WEBP images are allowed",
          "error",
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image must be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditImagePreview(reader.result);
        } else {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const uploadedUrl = await uploadImageToServer(file);
      if (uploadedUrl) {
        console.log("📤 Uploaded image URL:", uploadedUrl);
        if (isEdit) {
          setSelectedCourse({ ...selectedCourse, image_url: uploadedUrl });
        } else {
          setNewCourse({ ...newCourse, image_url: uploadedUrl });
        }
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim() || !newCourse.description.trim()) {
      showNotification("Please fill title and description", "error");
      return;
    }

    const courseToSave = {
      ...newCourse,
      image_url:
        newCourse.image_url ||
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop",
    };

    setSaving(true);
    try {
      const response = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseToSave),
      });

      if (response.ok) {
        showNotification("✅ Course created successfully!");
        setShowAddModal(false);
        setNewCourse({
          title: "",
          description: "",
          level: "Beginner",
          category: "Development",
          price: 0,
          image_url: "",
          xpReward: 100,
        });
        setImagePreview(null);
        fetchCourses();
      } else {
        const data = await response.json();
        showNotification(data.message || "Failed to create course", "error");
      }
    } catch (error) {
      showNotification("Error creating course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!token) {
      showNotification("Please log in to update courses", "error");
      return;
    }

    if (!selectedCourse.title.trim()) {
      showNotification("Please enter course title", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/instructor/courses/${selectedCourse.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(selectedCourse),
        },
      );

      if (response.ok) {
        showNotification("✅ Course updated successfully!");
        setShowEditModal(false);
        setEditImagePreview(null);
        fetchCourses();
      } else {
        showNotification("Failed to update course", "error");
      }
    } catch (error) {
      showNotification("Error updating course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!token) {
      showNotification("Please log in to delete courses", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      setSaving(true); // Set saving state to true
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showNotification("✅ Course deleted successfully");
        fetchCourses();
      } else {
        const data = await response.json();
        showNotification(data.error || "Failed to delete course", "error");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      showNotification("Error deleting course", "error");
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  const handleEditClick = (course) => {
    setSelectedCourse({ ...course });
    setEditImagePreview(course.image_url); // Set initial preview for edit modal
    setShowEditModal(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
    showNotification("Refreshing courses...");
  };

  const levels = ["Beginner", "Intermediate", "Advanced"];
  const categories = [
    "Development",
    "Data Science",
    "Design",
    "Cloud",
    "Marketing",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm ${notification.type === "error" ? "bg-red-500" : "bg-green-500"} shadow-lg`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
              Content Management
            </div>
          </div>
          <h1
            className={`text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Curriculum Library
          </h1>
          <p
            className={`text-base mt-2 max-w-2xl ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Manage your courses, track student feedback, and update your
            educational content in real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Create Course
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <input
            type="text"
            placeholder="Search within your curriculum..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${darkMode ? "bg-gray-800/40 border-gray-700 text-white focus:border-emerald-500" : "bg-white border-gray-200 text-gray-900 focus:border-emerald-500"} focus:outline-none transition-all shadow-sm font-medium`}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-gray-400">⚪</div>
          <select
            className={`px-4 py-2.5 rounded-xl border ${darkMode ? "bg-gray-800/40 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-600"} focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm font-bold text-sm min-w-[160px]`}
          >
            <option>All Categories</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div
          className={`text-center py-24 rounded-3xl border-2 border-dashed ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="text-6xl mb-4">📚</div>
          <h3
            className={`text-xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            No courses yet
          </h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">
            Get started by building your first educational program.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`group rounded-2xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1 ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <div className="relative h-48">
                <CourseImage
                  src={course.image_url}
                  title={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => handleEditClick(course)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg shadow-lg hover:bg-blue-600 hover:text-white transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg shadow-lg hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full text-white ${
                      course.level === "Beginner"
                        ? "bg-emerald-500"
                        : course.level === "Intermediate"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  >
                    {course.level}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                  {course.category}
                </div>
                <h3
                  className={`font-black text-xl leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {course.title}
                </h3>
                <p
                  className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"} line-clamp-2 font-medium`}
                >
                  {course.description}
                </p>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
                    ⭐ {course.rating || 4.5}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase">
                    🕐 {course.duration || "2.5h"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className={`max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-8 border-b ${darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50/50"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Builder
                    </span>
                  </div>
                  <h2
                    className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Launch New Course
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-500" : "hover:bg-gray-200 text-gray-400"}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="mb-6">
                <label
                  className={`block text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Visual Identity
                </label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className={`group relative w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    imagePreview
                      ? "border-emerald-500"
                      : "border-gray-300 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-500/5"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full p-2">
                      <img
                        src={imagePreview}
                        className="w-full h-full object-cover rounded-xl shadow-lg"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <RefreshCw
                          size={24}
                          className="text-white animate-pulse"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`p-4 rounded-2xl mb-3 ${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-400"}`}
                      >
                        <Upload size={32} />
                      </div>
                      <span className="text-sm font-bold text-gray-500">
                        Click to upload cover image
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-tighter">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, false)}
                  className="hidden"
                />
                {uploadingImage && (
                  <div className="text-center text-xs font-black text-emerald-500 mt-2 uppercase tracking-widest">
                    Processing...
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Basic Info
                  </label>
                  <input
                    type="text"
                    placeholder="Course Title *"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:border-emerald-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500"} focus:outline-none transition-all`}
                  />
                </div>
                <textarea
                  placeholder="Tell students what they will learn..."
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  rows="4"
                  className={`w-full px-4 py-3 rounded-xl border font-medium ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:border-emerald-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500"} focus:outline-none transition-all`}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Target Level
                    </label>
                    <select
                      value={newCourse.level}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, level: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none transition-all`}
                    >
                      {levels.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Domain
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, category: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none transition-all`}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-8 border-t flex gap-4 ${darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50/50"}`}
            >
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={saving}
                className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {saving ? "Initializing..." : "Publish Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className={`max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-8 border-b ${darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50/50"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Editor
                    </span>
                  </div>
                  <h2
                    className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Edit Course
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-500" : "hover:bg-gray-200 text-gray-400"}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="mb-6">
                <label
                  className={`block text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Visual Identity
                </label>
                <div
                  onClick={() => editFileInputRef.current.click()}
                  className={`group relative w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    editImagePreview
                      ? "border-blue-500"
                      : "border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-500/5"
                  }`}
                >
                  {editImagePreview ? (
                    <div className="relative w-full h-full p-2">
                      <img
                        src={editImagePreview}
                        className="w-full h-full object-cover rounded-xl shadow-lg"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <RefreshCw
                          size={24}
                          className="text-white animate-pulse"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`p-4 rounded-2xl mb-3 ${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-400"}`}
                      >
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-sm font-bold text-gray-500">
                        Click to change cover image
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, true)}
                  className="hidden"
                />
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Basic Info
                  </label>
                  <input
                    type="text"
                    placeholder="Course Title *"
                    value={selectedCourse.title}
                    onChange={(e) =>
                      setSelectedCourse({
                        ...selectedCourse,
                        title: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"} focus:outline-none transition-all`}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={selectedCourse.description}
                  onChange={(e) =>
                    setSelectedCourse({
                      ...selectedCourse,
                      description: e.target.value,
                    })
                  }
                  rows="4"
                  className={`w-full px-4 py-3 rounded-xl border font-medium ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"} focus:outline-none transition-all`}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Target Level
                    </label>
                    <select
                      value={selectedCourse.level}
                      onChange={(e) =>
                        setSelectedCourse({
                          ...selectedCourse,
                          level: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none transition-all`}
                    >
                      {levels.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Domain
                    </label>
                    <select
                      value={selectedCourse.category}
                      onChange={(e) =>
                        setSelectedCourse({
                          ...selectedCourse,
                          category: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} focus:outline-none transition-all`}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-8 border-t flex gap-4 ${darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50/50"}`}
            >
              <button
                onClick={() => setShowEditModal(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCourse}
                disabled={saving}
                className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                {saving ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
