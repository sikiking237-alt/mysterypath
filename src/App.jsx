import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, selectCurrentUser, selectIsAuthenticated } from "./features/auth/authSlice";
import { Outlet } from "react-router-dom";
import { selectTheme, updateLocalSettings } from "../settingsSlice.js";
import { useGetEnrolledCountQuery } from "./features/courses/coursesApi";
import { LanguageProvider } from './context/LanguageContext';
import InstructorAnalytics from "./components/InstructorAnalytics";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MyLearningPage from "./pages/MyLearningPage";
import MyCertificates from "./pages/MyCertificates";
import CoursePlayer from "./pages/CoursePlayer";
import CompleteRegistration from "./pages/CompleteRegistration";
import CoursesPage from "./pages/CoursesPage";
import NotesPage from "./pages/NotesPage";
import PlannerPage from "./pages/PlannerPage";
import WishlistPage from "./pages/WishlistPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import PodcastsPage from "./pages/PodcastsPage";
import AITutorPage from "./pages/AITutorPage";
import AchievementsPage from "./pages/AchievementsPage";
import ChatPage from "./pages/ChatPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import FriendsPage from "./pages/FriendsPage";
import PeerMeetingsPage from "./pages/PeerMeetingsPage";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ForgotPassword from "./components/ForgotPassword";
import BackButton from "./components/BackButton";
import NotificationBell from "./components/NotificationBell";
import SupportContentPage from "./pages/SupportContentPage";
import PublicCertificatePage from "./pages/PublicCertificatePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LegalPage from "./pages/LegalPage";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import SettingsPage from "./pages/SettingsPage";
import AuthCallback from "./pages/AuthCallback";

// Navigation components
import StudentNavbar from "./components/StudentNavbar.jsx";
import InstructorSidebar from "./components/Instructor/InstructorSidebar";
import AdminSidebar from "./components/Admin/AdminSidebar";

// Admin Components
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminManageCourses from "./components/Admin/AdminManageCourses";
import ManageUsers from "./components/Admin/ManageUsers";
import ManageInstructors from "./components/Admin/ManageInstructors";
import SystemSettings from "./components/Admin/SystemSettings";
import ActivityLog from "./components/ActivityLog";
import RevenueAnalytics from "./components/RevenueAnalytics";
import ManagePayouts from "./components/Admin/ManagePayouts";
import AdminPayoutSettings from "./components/Admin/AdminPayoutSettings";
import ManageNotificationTemplates from "./components/ManageNotificationTemplates";

// Instructor Components
import InstructorDashboard from "./components/Instructor/InstructorDashboard";
import InstructorStudents from "./components/Instructor/InstructorStudents";
import ManageCourses from "./components/Instructor/ManageCourses";
import InstructorSettings from "./components/Instructor/InstructorSettings";

// Missing Page Components
import Dashboard from "./components/Dashboard";
import FrontendCodingLab from "./components/FrontendCodingLab";


// Main App Component
function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const theme = useSelector(selectTheme);
  const darkMode = theme === "dark";

  const userName = currentUser?.name || "";
  const userRole = currentUser?.role || "";
  const userXP = currentUser?.xp || 0;
  const userStreak = currentUser?.streak_days || 0;

  const { data: enrolledCountData, refetch: fetchEnrolledCount } = useGetEnrolledCountQuery(undefined, {
    skip: !isLoggedIn,
  });
  const enrolledCount = enrolledCountData?.count || 0;

  const [userImage, setUserImage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState(null);

  const fetchTrialStatus = () => {
    setTrialStatus({
      is_trial_active: true,
      days_remaining: 7,
      is_expired: false,
    });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTrialStatus();
    }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const role = currentUser?.role;
    const key = role === 'admin' ? 'admin_profile_image' : role === 'instructor' ? 'instructor_profile_image' : 'userAvatar';
    const saved = localStorage.getItem(key);
    if (saved) setUserImage(saved);
  }, [isLoggedIn, currentUser?.role]);

  const onLogout = async () => {
    dispatch(logout());
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (e) {
      // ignore
    }
    ["token", "user", "user-settings", "userName", "sidebar_collapsed", "sound_enabled"].forEach((key) =>
      localStorage.removeItem(key)
    );
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const onToggleDarkMode = () => dispatch(updateLocalSettings({ theme: darkMode ? "light" : "dark" }));
  const onSidebarChange = (collapsed) => setSidebarCollapsed(collapsed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading MysteryPath...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <ErrorBoundary showDetails={import.meta.env.DEV}>
        <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!isLoggedIn ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/signup" element={!isLoggedIn ? <AuthPage initialMode="signup" /> : <Navigate to="/" />} />
            <Route path="/complete-registration" element={<CompleteRegistration darkMode={darkMode} />} />
            <Route path="/verify-certificate/:certificateId" element={<PublicCertificatePage darkMode={darkMode} />} />
            <Route path="/privacy" element={<PrivacyPolicy darkMode={darkMode} />} />
            <Route path="/terms" element={<TermsOfService darkMode={darkMode} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy darkMode={darkMode} />} />
            <Route path="/terms-of-service" element={<TermsOfService darkMode={darkMode} />} />
            <Route path="/legal" element={<LegalPage darkMode={darkMode} />} />

            {/* Full-screen protected routes */}
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
              <Route path="/course-player/:courseId" element={<CoursePlayer darkMode={darkMode} onLogout={onLogout} />} />
              <Route path="/chat" element={<ChatPage darkMode={darkMode} />} />
              <Route path="/communities" element={<CommunitiesPage darkMode={darkMode} />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} allowedRoles={["admin"]} userRole={userRole} />}>
              <Route element={<AdminLayout {...{ userName, onLogout, darkMode, onToggleDarkMode, onSidebarChange, sidebarCollapsed, userImage, setUserImage }} />}>
                <Route path="/admin-dashboard" element={<AdminDashboard darkMode={darkMode} />} />
                <Route path="/admin-users" element={<ManageUsers darkMode={darkMode} />} />
                <Route path="/admin-courses" element={<AdminManageCourses darkMode={darkMode} />} />
                <Route path="/admin-instructors" element={<ManageInstructors darkMode={darkMode} />} />
                <Route path="/admin-revenue" element={<RevenueAnalytics darkMode={darkMode} />} />
                <Route path="/admin-settings" element={<SystemSettings darkMode={darkMode} />} />
                <Route path="/admin-activity" element={<ActivityLog darkMode={darkMode} />} />
                <Route path="/admin-templates" element={<ManageNotificationTemplates darkMode={darkMode} />} />
                <Route path="/admin-payouts" element={<ManagePayouts darkMode={darkMode} />} />
                <Route path="/admin-payout-settings" element={<AdminPayoutSettings darkMode={darkMode} />} />
              </Route>
            </Route>

            {/* Instructor routes */}
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} allowedRoles={["instructor"]} userRole={userRole} />}>
              <Route element={<InstructorLayout {...{ userName, onLogout, darkMode, onToggleDarkMode, onSidebarChange, sidebarCollapsed, userImage, setUserImage }} />}>
                <Route path="/instructor-dashboard" element={<InstructorDashboard userName={userName} darkMode={darkMode} onLogout={onLogout} />} />
                <Route path="/instructor-courses" element={<ManageCourses darkMode={darkMode} />} />
                <Route path="/instructor/edit-course/:courseId" element={<ManageCourses darkMode={darkMode} />} />
                <Route path="/instructor-students" element={<InstructorStudents darkMode={darkMode} />} />
                <Route path="/instructor-analytics" element={<InstructorAnalytics darkMode={darkMode} />} />
                <Route path="/instructor-settings" element={<InstructorSettings darkMode={darkMode} userImage={userImage} onUpdateImage={setUserImage} />} />

              </Route>
            </Route>

            {/* Student routes */}
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} allowedRoles={["user"]} userRole={userRole} />}>
              <Route element={<StudentLayout {...{ userName, onLogout, darkMode, onToggleDarkMode, onSidebarChange, sidebarCollapsed, userImage, setUserImage }} />}>
                <Route path="/home" element={<HomePage userName={userName} userXP={userXP} userStreak={userStreak} enrolledCount={enrolledCount} refreshEnrolledCount={fetchEnrolledCount} onLogout={onLogout} darkMode={darkMode} />} />
                <Route path="/about" element={<SupportContentPage darkMode={darkMode} type="about" />} />
                <Route path="/support" element={<SupportContentPage darkMode={darkMode} type="support" />} />
                <Route path="/settings" element={<SettingsPage darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} onLogout={onLogout} userName={userName} userImage={userImage} onUpdateImage={setUserImage} />} />
                <Route path="/contact" element={<SupportContentPage darkMode={darkMode} type="contact" />} />
                <Route path="/my-learning" element={<MyLearningPage darkMode={darkMode} setDarkMode={onToggleDarkMode} onLogout={onLogout} />} />
                <Route path="/my-certificates" element={<MyCertificates darkMode={darkMode} setDarkMode={onToggleDarkMode} />} />
                <Route path="/courses" element={<CoursesPage darkMode={darkMode} />} />
                <Route path="/peer-meetings" element={<PeerMeetingsPage darkMode={darkMode} />} />
                <Route path="/wishlist" element={<WishlistPage darkMode={darkMode} />} />
                <Route path="/flashcards" element={<FlashcardsPage darkMode={darkMode} />} />
                <Route path="/podcasts" element={<PodcastsPage darkMode={darkMode} />} />
                <Route path="/ai-tutor" element={<AITutorPage darkMode={darkMode} />} />
                <Route path="/notes" element={<NotesPage darkMode={darkMode} />} />
                <Route path="/achievements" element={<AchievementsPage darkMode={darkMode} />} />
                <Route path="/code-practice" element={<FrontendCodingLab darkMode={darkMode} onLogout={onLogout} />} />
                <Route path="/planner" element={<PlannerPage darkMode={darkMode} />} />
                <Route path="/payment-status" element={<PaymentStatusPage darkMode={darkMode} />} />
                <Route path="/friends" element={<FriendsPage darkMode={darkMode} />} />
                <Route path="/communities" element={<CommunitiesPage darkMode={darkMode} />} />
              </Route>
            </Route>

            <Route
              path="/"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <RootRedirect userRole={userRole} />
                </ProtectedRoute>
              }
            />

            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <CookieConsentBanner darkMode={darkMode} />
      </ErrorBoundary>
    </LanguageProvider>
  );
}

const RootRedirect = ({ userRole }) => {
  if (userRole === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }
  if (userRole === "instructor") {
    return <Navigate to="/instructor-dashboard" replace />;
  }
  return <Navigate to="/home" replace />;
};

const ProtectedRoute = ({ isLoggedIn, userRole, allowedRoles, children }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }
  return children ? children : <Outlet />;
};

const MainLayout = ({ children, sidebarCollapsed, navBar }) => (
  <>
    {navBar}
    <main className={sidebarCollapsed ? "md:ml-20 pt-0" : "md:ml-64 pt-0"}>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl pt-16 md:pt-6">
        {children}
      </div>
    </main>
  </>
);

const AdminLayout = (props) => (
  <MainLayout {...props} navBar={<AdminSidebar {...props} />}>
    <Outlet />
  </MainLayout>
);

const InstructorLayout = (props) => (
  <MainLayout {...props} navBar={<InstructorSidebar {...props} onImageUpdate={props.setUserImage} />}>
    <Outlet />
  </MainLayout>
);

const StudentLayout = (props) => (
  <MainLayout {...props} navBar={<StudentNavbar {...props} />}>
    <Outlet />
  </MainLayout>
);

export default App;

