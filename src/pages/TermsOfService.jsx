import React from 'react';
import { ArrowLeft, FileText, Shield, CheckCircle, AlertCircle, Users, BookOpen, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = ({ darkMode }) => {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-xl transition-colors ${
              darkMode
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
              <FileText size={28} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Last updated: June 2024
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 space-y-8 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-100 shadow-sm"
        }`}>
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield size={20} className="text-purple-500" />
              1. Acceptance of Terms
            </h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              By using MysteryPath, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              2. User Accounts
            </h2>
            <ul className="space-y-2 pl-6">
              {[
                "You must be at least 13 years old to use our services",
                "You are responsible for maintaining the security of your account",
                "You agree to provide accurate and complete information",
                "You are responsible for all activities under your account",
                "You may not share your account credentials with others",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-purple-500" />
              3. Course Enrollment & Access
            </h2>
            <ul className="space-y-2 pl-6">
              {[
                "Course enrollment grants you access to the course materials",
                "Access is for personal, non-commercial use only",
                "You may not share course materials with non-enrolled users",
                "Some courses may have prerequisites or requirements",
                "MysteryPath reserves the right to modify course content",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard size={20} className="text-purple-500" />
              4. Payments & Refunds
            </h2>
            <ul className="space-y-2 pl-6">
              {[
                "Course prices are clearly displayed before purchase",
                "All payments are processed securely",
                "Refund policies vary by course and are clearly stated",
                "You agree to pay all fees associated with your account",
                "MysteryPath reserves the right to change prices",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle size={20} className="text-purple-500" />
              5. User Conduct
            </h2>
            <ul className="space-y-2 pl-6">
              {[
                "Respect other students and instructors",
                "Do not harass, bully, or discriminate against others",
                "Do not post inappropriate or offensive content",
                "Do not use the platform for illegal activities",
                "Do not attempt to gain unauthorized access to systems",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">6. Intellectual Property</h2>
            <ul className="space-y-2 pl-6">
              {[
                "Course content is protected by copyright",
                "You may not redistribute or resell course materials",
                "All trademarks and logos are the property of MysteryPath",
                "User-generated content remains the property of the user",
                "MysteryPath may use anonymized data for analytics",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">7. Termination</h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              We reserve the right to suspend or terminate your account if you violate 
              these Terms of Service. You may also terminate your account at any time 
              by contacting support.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">8. Disclaimer of Warranties</h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Our services are provided "as is" without warranties of any kind. 
              We do not guarantee that the platform will be error-free or uninterrupted.
            </p>
          </div>

          <div className={`p-4 rounded-xl ${
            darkMode
              ? "bg-gray-700/50 border border-gray-600"
              : "bg-gray-50 border border-gray-200"
          }`}>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              For any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@mysterypath.com" className="text-purple-500 hover:underline">
                legal@mysterypath.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;