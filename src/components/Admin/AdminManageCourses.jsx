import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { apiEndpoints, apiCall } from "../../config/apiConfig";
import { formatPrice } from "../../utils/formatPrice.js";

const AdminManageCourses = ({ darkMode }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [notification, setNotification] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [validationErrors, setValidationErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    instructor_id: "",
    level: "Beginner",
    category: "Development",
    price: 49,
    image_url: "",
    xpReward: 100
  });


  const validateCourse = (course) => {
    const errors = {};
    
    if (!course.title?.trim() || course.title.length < 5) {
      errors.title = "Title must be at least 5 characters";
    }
    if (!course.description?.trim() || course.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (!course.instructor_id) {
      errors.instructor_id = "An instructor must be selected";
    }
    if (course.price < 0) {
      errors.price = "Price cannot be negative";
    }
    if (!course.category?.trim()) {
      errors.category = "Category is required";
    }
    
    return errors;
  };

  useEffect(() => {
    fetchCourses();
    fetchSettings();
    fetchInstructors();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSettings = async () => {
    try {
      const response = await apiCall(apiEndpoints.admin.settings, {
        method: "GET",
      });
      if (response.settings && response.settings.currency) {
        setDefaultCurrency(response.settings.currency);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Keep default 'USD'
    }
  };

  const fetchInstructors = async () => {
    const response = await apiCall(apiEndpoints.admin.instructors);
    if (response.success && Array.isArray(response.instructors)) {
      setInstructors(response.instructors);
      if (response.instructors.length > 0) {
        setNewCourse(prev => ({ ...prev, instructor_id: "" }));
      }
    } else {
      showNotification('Failed to load instructors', 'error');
    }
  };
  const fetchCourses = async () => {
    try {
      const response = await apiCall(apiEndpoints.admin.allCourses, {
        method: "GET",
      });

      if (response.error) {
        // Fallback to regular courses endpoint
        const fallbackResponse = await apiCall(apiEndpoints.courses.all, {
          method: "GET",
        });
        
        if (fallbackResponse.error) {
          showNotification("Failed to load courses", "error");
        } else if (Array.isArray(fallbackResponse)) {
          setCourses(fallbackResponse);
        }
      } else if (Array.isArray(response)) {
        setCourses(response);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      showNotification("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification("Image too large (max 2MB)", "error");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      const data = await apiCall(apiEndpoints.admin.courseImageUpload, {
        method: "POST",
        body: formData,
        includeJson: false,
      });

      if (data.success) {
        if (isEdit) {
          setEditImagePreview(data.image_url);
          setSelectedCourse({ ...selectedCourse, image_url: data.image_url });
        } else {
          setImagePreview(data.image_url);
          setNewCourse({ ...newCourse, image_url: data.image_url });
        }
        showNotification("✅ Image uploaded");
      } else {
        showNotification(data.error || "Upload failed", "error");
      }
    } catch (error) {
      showNotification("Error uploading image", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    
    setSaving(true);
    try {
      const response = await apiCall(`${apiEndpoints.admin.allCourses}/${courseId}`, {
        method: "DELETE",
      });

      if (response.error) {
        showNotification(response.error, "error");
      } else {
        showNotification("✅ Course deleted successfully");
        fetchCourses();
      }
    } catch (error) {
      showNotification("Error deleting course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCourse = async () => {
    const errors = validateCourse(newCourse);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotification("Please fix validation errors", "error");
      return;
    }
    
    setValidationErrors({});
    
    // Use default image if none uploaded
    const courseToSave = {
      ...newCourse,
      image_url: newCourse.image_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop"
    };
    
    setSaving(true);
    try {
      const response = await apiCall(apiEndpoints.admin.allCourses, {
        method: "POST",
        body: JSON.stringify(courseToSave),
      });

      if (response.error) {
        showNotification(response.error, "error");
      } else {
        showNotification("✅ Course created successfully!", "success");
        setShowAddModal(false);
        setNewCourse({
          title: "", description: "", instructor_id: "",
          level: "Beginner", category: "Development", price: 49,
          image_url: "", xpReward: 100
        });
        setImagePreview(null);
        fetchCourses();
      }
    } catch (error) {
      console.error("Error creating course:", error);
      showNotification("Error creating course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCourse = async () => {
    const errors = validateCourse(selectedCourse);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showNotification("Please fix validation errors", "error");
      return;
    }
    
    setValidationErrors({});
    setSaving(true);
    
    try {
      const response = await apiCall(`${apiEndpoints.admin.allCourses}/${selectedCourse.id}`, {
        method: "PUT",
        body: JSON.stringify(selectedCourse),
      });

      if (response.error) {
        showNotification(response.error, "error");
      } else {
        showNotification("✅ Course updated successfully!", "success");
        setShowEditModal(false);
        setEditImagePreview(null);
        setValidationErrors({});
        fetchCourses();
      }
    } catch (error) {
      showNotification("Error updating course", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const levels = ["Beginner", "Intermediate", "Advanced"];
  const categories = ["Development", "Data Science", "Design", "Cloud", "Marketing", "Business"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} animate-fade-in shadow-lg`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📚 Manage Courses</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add, edit, or remove courses with cover images</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md"
          disabled={saving}
        >
          <span className="text-lg">➕</span> Add Course
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search courses by title or instructor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
        />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-6xl mb-4">📭</div>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No courses found</h3>
          <p className="text-gray-500 mt-1">Click "Add Course" to create your first course</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className={`rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {/* Course Image */}
              <div className="relative h-48">
                <img 
                  src={course.image_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop"} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => { setSelectedCourse(course); setShowEditModal(true); }}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
                    title="Edit Course"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
                    title="Delete Course"
                    disabled={saving}
                  >
                    🗑️
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.level === 'Beginner' ? 'bg-green-500 text-white' :
                    course.level === 'Intermediate' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {course.level}
                  </span>
                </div>
              </div>
              
              {/* Course Info */}
              <div className="p-4">
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{course.instructor_name}</p>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>{course.description}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{course.rating}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>({course.students || 0})</span>
                  </div>
                  <div className={`text-sm font-bold text-green-600`}>
                    {formatPrice(course.price, defaultCurrency)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className={`max-w-lg w-full mx-4 rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>➕ Add New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            
            {/* Image Upload Section */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Course Cover Image</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition overflow-hidden bg-gray-50 dark:bg-gray-700"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-3xl mb-1">🖼️</span>
                      <span className="text-xs text-gray-500">Click to upload</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Recommended: 500x280px, max 2MB</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF format</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Course Title *"
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <textarea
                placeholder="Description *"
                value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <select
                name="instructor_id"
                value={newCourse.instructor_id}
                onChange={(e) => setNewCourse({ ...newCourse, instructor_id: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  validationErrors.instructor_id ? 'border-red-500' : (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200')
                }`}
              >
                <option value="">-- Select Instructor * --</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                ))}
              </select>
              {validationErrors.instructor_id && (
                <p className="text-xs text-red-600">{validationErrors.instructor_id}</p>
              )}

              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              >
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Price ($)"
                value={newCourse.price}
                onChange={(e) => setNewCourse({...newCourse, price: parseFloat(e.target.value)})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
              <input
                type="number"
                placeholder="XP Reward"
                value={newCourse.xpReward}
                onChange={(e) => setNewCourse({...newCourse, xpReward: parseInt(e.target.value)})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCourse}
                disabled={saving}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Course"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className={`max-w-lg w-full mx-4 rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>✏️ Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            
            {/* Image Upload Section */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Course Cover Image</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => editFileInputRef.current.click()}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition overflow-hidden bg-gray-50 dark:bg-gray-700"
                >
                  {(editImagePreview || selectedCourse.image_url) ? (
                    <img 
                      src={editImagePreview || selectedCourse.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <span className="text-3xl mb-1">🖼️</span>
                      <span className="text-xs text-gray-500">Click to upload</span>
                    </>
                  )}
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Recommended: 500x280px, max 2MB</p>
                  <p className="text-xs text-gray-500 mt-1">Upload new image to replace current</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Course Title"
                value={selectedCourse.title}
                onChange={(e) => setSelectedCourse({...selectedCourse, title: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
              <textarea
                placeholder="Description"
                value={selectedCourse.description}
                onChange={(e) => setSelectedCourse({...selectedCourse, description: e.target.value})}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Instructor</label>
                <select
                  name="instructor_id"
                  value={selectedCourse.instructor_id}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, instructor_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                >
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedCourse.level}
                onChange={(e) => setSelectedCourse({...selectedCourse, level: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              >
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={selectedCourse.category}
                onChange={(e) => setSelectedCourse({...selectedCourse, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Price ($)"
                value={selectedCourse.price}
                onChange={(e) => setSelectedCourse({...selectedCourse, price: parseFloat(e.target.value)})}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCourse}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
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

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminManageCourses;