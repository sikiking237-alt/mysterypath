/**
 * API Configuration
 * Centralized API endpoint management for the entire application
 */
import toast from 'react-hot-toast';

const getApiBaseUrl = () => {
  // In development (when running `npm run dev`), use the proxy
  if (import.meta.env.DEV) {
    return "/api";
  }
  // In production builds, use the environment variable
  return (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

export const apiEndpoints = {
  auth: {
    // The backend blueprint is registered at '/api', so these paths are correct.
    login: `${API_BASE_URL}/login`,
    logout: `${API_BASE_URL}/logout`,
    register: `${API_BASE_URL}/register`,
    adminLogin: `${API_BASE_URL}/login`, // Re-uses the main login
    forgotPassword: `${API_BASE_URL}/forgot-password`,
    verifyResetCode: `${API_BASE_URL}/verify-reset-code`,
    resetPassword: `${API_BASE_URL}/reset-password`,
    completeRegistration: `${API_BASE_URL}/complete-registration`,
    me: `${API_BASE_URL}/me`,
  },

  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: `${API_BASE_URL}/admin/users`,
    courses: `${API_BASE_URL}/admin/all-courses`,
    allCourses: `${API_BASE_URL}/admin/all-courses`,
    instructors: `${API_BASE_URL}/admin/instructors`,
    createCourse: `${API_BASE_URL}/admin/courses`,
    updateCourse: (id) => `${API_BASE_URL}/admin/courses/${id}`,
    deleteCourse: (id) => `${API_BASE_URL}/admin/courses/${id}`,
    createInstructor: `${API_BASE_URL}/admin/instructors/create`,
    settings: `${API_BASE_URL}/admin/settings`,
    stats: `${API_BASE_URL}/admin/stats`,
    chartData: `${API_BASE_URL}/admin/chart-data`,
    notifications: `${API_BASE_URL}/admin/send-notification`,
    invite: `${API_BASE_URL}/admin/invite/generate`,
    inviteResend: `${API_BASE_URL}/admin/invite/resend`,
    logo: `${API_BASE_URL}/admin/settings/logo`,
    courseImageUpload: `${API_BASE_URL}/admin/courses/upload-image`,
    activity: `${API_BASE_URL}/admin/activity`,
    revenue: `${API_BASE_URL}/admin/revenue-stats`,
    recentOrders: `${API_BASE_URL}/admin/recent-orders`,
    testEmail: `${API_BASE_URL}/admin/test-email`,
  },

  courses: {
    all: `${API_BASE_URL}/courses`,
    create: `${API_BASE_URL}/instructor/courses`,
    update: (id) => `${API_BASE_URL}/instructor/courses/${id}`,
    delete: (id) => `${API_BASE_URL}/instructor/courses/${id}`,
    byId: (id) => `${API_BASE_URL}/courses/${id}`,
    structure: (id) => `${API_BASE_URL}/courses/${id}/structure`,
    instructorStructure: (id) =>
      `${API_BASE_URL}/instructor/courses/${id}/structure`,
    modules: (id) => `${API_BASE_URL}/instructor/courses/${id}/modules`,
    module: (courseId, moduleId) =>
      `${API_BASE_URL}/instructor/courses/${courseId}/modules/${moduleId}`,
  },

  enrollments: {
    enroll: `${API_BASE_URL}/enroll`,
    enrolledCount: `${API_BASE_URL}/student/enrolled-count`,
    myLearning: `${API_BASE_URL}/my-learning`,
    progress: `${API_BASE_URL}/progress/update`,
    complete: `${API_BASE_URL}/complete-course`,
  },

  instructor: {
    stats: `${API_BASE_URL}/instructor/stats`,
    chartData: `${API_BASE_URL}/instructor/chart-data`,
    students: `${API_BASE_URL}/instructor/students`,
    conversations: `${API_BASE_URL}/instructor/conversations`,
    announcements: `${API_BASE_URL}/instructor/announcements`,
    liveClasses: `${API_BASE_URL}/instructor/live-classes`,
    courses: `${API_BASE_URL}/instructor/courses`,
    courseFileUpload: `${API_BASE_URL}/instructor/upload/file`,
    courseStructure: (id) =>
      `${API_BASE_URL}/instructor/courses/${id}/structure`,
    courseSections: (id) => `${API_BASE_URL}/instructor/courses/${id}/sections`,
    section: (id) => `${API_BASE_URL}/instructor/sections/${id}`,
    sectionLessons: (id) => `${API_BASE_URL}/instructor/sections/${id}/lessons`,
    courseModules: (courseId) => `${API_BASE_URL}/instructor/courses/${courseId}/modules`,
    module: (moduleId) => `${API_BASE_URL}/instructor/modules/${moduleId}`,
    moduleLessons: (moduleId) => `${API_BASE_URL}/instructor/modules/${moduleId}/lessons`,
    lesson: (id) => `${API_BASE_URL}/instructor/lessons/${id}`,
    lessonQuizzes: (id) => `${API_BASE_URL}/instructor/lessons/${id}/quizzes`,
    lessonQuestions: (id) =>
      `${API_BASE_URL}/instructor/lessons/${id}/questions`,
    lessonFrontend: (id) => `${API_BASE_URL}/instructor/lessons/${id}/frontend`,
    bulkMessage: `${API_BASE_URL}/instructor/messages/bulk`,
  },

  student: {
    liveClasses: `${API_BASE_URL}/student/live-classes`,
    peerMeetings: `${API_BASE_URL}/student/peer-meetings`,
    enrolledCount: `${API_BASE_URL}/student/enrolled-count`,
  },

  messages: {
    unread: `${API_BASE_URL}/chat/unread/count`,
    latestUnread: `${API_BASE_URL}/chat/messages/latest-unread`,
    history: (id) => `${API_BASE_URL}/chat/conversations/${id}/messages`,
    send: `${API_BASE_URL}/chat/messages`,
    markRead: (id) => `${API_BASE_URL}/chat/messages/read`,
    chat: (room) => `${API_BASE_URL}/chat/messages/${room}`,
    chatContacts: `${API_BASE_URL}/chat/contacts`,
    createGroup: `${API_BASE_URL}/chat/groups`,
    groupHistory: (groupId) => `${API_BASE_URL}/chat/groups/${groupId}/history`,
    markGroupRead: (groupId) => `${API_BASE_URL}/chat/groups/${groupId}/mark-read`,
    groupDetails: (groupId) => `${API_BASE_URL}/chat/groups/${groupId}`,
    updateGroup: (groupId) => `${API_BASE_URL}/chat/groups/${groupId}`,
    addGroupMembers: (groupId) => `${API_BASE_URL}/chat/groups/${groupId}/members`,
    removeGroupMember: (groupId, userId) => `${API_BASE_URL}/chat/groups/${groupId}/members/${userId}`,
    reactToMessage: (messageId) => `${API_BASE_URL}/chat/messages/${messageId}/react`,
    deleteMessage: (messageId) => `${API_BASE_URL}/chat/messages/${messageId}`,
    editMessage: (messageId) => `${API_BASE_URL}/chat/messages/${messageId}`,
    instructorAccess: `${API_BASE_URL}/chat/instructor/chat/access`,
    instructorBlockAll: `${API_BASE_URL}/chat/instructor/chat/block-all`,
    instructorUnblockAll: `${API_BASE_URL}/chat/instructor/chat/unblock-all`,
  },

  notifications: {
    send: `${API_BASE_URL}/notifications/send`,
    all: `${API_BASE_URL}/notifications/my`,
    unreadCount: `${API_BASE_URL}/notifications/unread/count`,
    markAllRead: `${API_BASE_URL}/notifications/mark-all-read`,
    markRead: (id) => `${API_BASE_URL}/notifications/mark-read/${id}`,
  },

  users: {
    all: `${API_BASE_URL}/admin/users`,
    profile: `${API_BASE_URL}/profile`,
    update: `${API_BASE_URL}/profile/update`,
    students: `${API_BASE_URL}/users/students`,
  },

  upload: {
    image: `${API_BASE_URL}/upload/image`,
    file: `${API_BASE_URL}/instructor/upload/file`,
    fileUrl: (path = "") => {
      if (!path) return "";
      if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${window.location.origin}${normalizedPath}`;
    },
  },

  certificates: {
    my: `${API_BASE_URL}/certificates/my`,
    generate: `${API_BASE_URL}/certificates/generate`,
    verify: (id) => `${API_BASE_URL}/certificates/verify/${id}`,
  },

  settings: {
    logo: `${API_BASE_URL}/settings/logo`,
    publicContent: `${API_BASE_URL}/settings/public-content`,
  },

  ai: {
    tutor: `${API_BASE_URL}/ai/tutor`,
    generateNotes: `${API_BASE_URL}/ai/generate-notes`,
    generateQuestions: `${API_BASE_URL}/ai/generate-questions`,
    explainTopic: `${API_BASE_URL}/ai/explain-topic`,
  },

  notes: {
    getAll: `${API_BASE_URL}/notes`,
    create: `${API_BASE_URL}/notes`,
    delete: (id) => `${API_BASE_URL}/notes/${id}`,
  },

  planner: {
    getAll: `${API_BASE_URL}/planner`,
    create: `${API_BASE_URL}/planner`,
    update: (id) => `${API_BASE_URL}/planner/${id}`,
    delete: (id) => `${API_BASE_URL}/planner/${id}`,
  },

  quizzes: {
    get: (id) => `${API_BASE_URL}/quizzes/${id}`,
    attempt: (id) => `${API_BASE_URL}/quizzes/${id}/attempt`,
    studentQuiz: (lessonId) => `${API_BASE_URL}/student/lessons/${lessonId}/quiz`,
    submitQuiz: (lessonId) => `${API_BASE_URL}/student/lessons/${lessonId}/submit-quiz`,
    instructorQuiz: (lessonId) => `${API_BASE_URL}/instructor/lessons/${lessonId}/quiz`,
  },

  payment: {
    initialize: `${API_BASE_URL}/payment/initialize`,
  },

  test: {
    healthCheck: `${API_BASE_URL}/health`,
    test: `${API_BASE_URL}/test`,
    emitActivity: `${API_BASE_URL}/test/emit-activity`,
  },

  trial: {
    status: `${API_BASE_URL}/trial-status`,
  },
};

/**
 * Get authorization headers
 * @param {boolean} includeJson - Whether to include Content-Type: application/json
 * @returns {Object} Headers object with Bearer token
 */
export const getAuthHeaders = (includeJson = true) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const headers = {
    Accept: "application/json",
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API error responses
 * @param {Response} response - Fetch response object
 * @param {string} defaultMessage - Default error message
 * @returns {Promise<Object>} Error object with message
 */
export const handleApiError = async (response, defaultMessage = "An error occurred") => {
  const genericMessage = "Something went wrong. Please try again later.";

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (
      !window.location.pathname.includes("/login") &&
      !window.location.pathname.includes("/admin-login")
    ) {
      window.location.href = "/login";
    }
    toast.error("Session expired. Please login again.");
    return { error: "Session expired. Please login again.", status: 401 };
  }

  if (response.status === 403) {
    const message = "You do not have permission to perform this action.";
    toast.error(message);
    return { error: message, status: 403 };
  }

  if (response.status === 404) {
    const message = "The requested resource was not found.";
    toast.error(message);
    return { error: message, status: 404 };
  }

  if (response.status === 429) {
    const message = "Too many requests. Please try again in a moment.";
    toast.error(message);
    return { error: message, status: 429 };
  }

  if (response.status === 500) {
    toast.error("A server error occurred. Our team has been notified.");
    return { error: "Server error. Please try again later.", status: 500 };
  }

  try {
    const data = await response.json();
    const errorMessage = data.error || data.message || defaultMessage;
    toast.error(errorMessage);
    return { error: errorMessage, status: response.status, data: data };
  } catch {
    toast.error(genericMessage);
    return { error: genericMessage, status: response.status };
  }
};

/**
 * Make an API call with error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Object} options.headers - Custom headers
 * @param {Object} options.body - Request body (will be stringified)
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {boolean} options.includeJson - Whether to include JSON content-type
 * @returns {Promise<Object>} Response data or error object
 */
export const apiCall = async (url, options = {}) => {
  try {
    const includeJson =
      options.includeJson !== undefined ? options.includeJson : true;
    const headers = {
      ...getAuthHeaders(includeJson),
      ...(options.headers || {}),
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const fetchOptions = {
      method: options.method || "GET",
      headers,
      credentials: "include",
      ...options,
    };

    // Handle body
    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
      } else if (typeof options.body === "object") {
        fetchOptions.body = JSON.stringify(options.body);
      } else {
        fetchOptions.body = options.body;
      }
    }

    console.log(`ðŸ“¡ API Call: ${fetchOptions.method} ${url}`);
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return await handleApiError(response);
    }

    // Check if response is empty
    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return { success: true };
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { success: true, data: await response.text() };
  } catch (error) {
    console.error("API call failed:", error);
    const networkErrorMessage = "Network error. Please check your connection and try again.";
    toast.error(networkErrorMessage);
    return { error: networkErrorMessage, status: 0 };
  }
};

/**
 * Helper for file uploads
 * @param {File} file - File to upload
 * @param {string} endpoint - Upload endpoint
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload response
 */
export const uploadFile = async (
  file,
  endpoint = apiEndpoints.upload.image,
  onProgress = null,
) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiCall(endpoint, {
    method: "POST",
    body: formData,
    includeJson: false,
  });
};

/**
 * Get the trial status for the current user
 * @returns {Promise<Object>} Trial status data
 */
export const getTrialStatus = async () => {
  return apiCall(apiEndpoints.trial.status, {
    method: "GET",
  });
};

/**
 * Get system settings (admin only)
 * @returns {Promise<Object>} System settings
 */
export const getSystemSettings = async () => {
  return apiCall(apiEndpoints.admin.settings, {
    method: "GET",
  });
};

/**
 * Update system settings (admin only)
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Update response
 */
export const updateSystemSettings = async (settings) => {
  return apiCall(apiEndpoints.admin.settings, {
    method: "POST",
    body: settings,
  });
};

/**
 * Login helper
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response
 */
export const login = async (email, password) => {
  return apiCall(apiEndpoints.auth.login, {
    method: "POST",
    body: { email, password },
  });
};

/**
 * Register helper
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  return apiCall(apiEndpoints.auth.register, {
    method: "POST",
    body: userData,
  });
};

/**
 * Logout helper
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  try {
    const result = await apiCall(apiEndpoints.auth.logout, {
      method: "POST",
    });
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return result;
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  }
};

export default apiEndpoints;
