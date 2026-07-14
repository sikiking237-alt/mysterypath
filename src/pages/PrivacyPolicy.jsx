import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = ({ darkMode }) => {
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
              <Shield size={28} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
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
              <Lock size={20} className="text-purple-500" />
              Information We Collect
            </h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              We collect information you provide directly, such as when you create an account, 
              enroll in courses, or contact us for support. This includes:
            </p>
            <ul className="space-y-2 pl-6">
              {[
                "Name and email address",
                "Profile information and preferences",
                "Course enrollment and progress data",
                "Payment information (processed securely)",
                "Communications with instructors and other students",
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
              <Eye size={20} className="text-purple-500" />
              How We Use Your Information
            </h2>
            <ul className="space-y-2 pl-6">
              {[
                "To provide and improve our educational services",
                "To track your learning progress and achievements",
                "To send you course updates and notifications",
                "To personalize your learning experience",
                "To process payments and transactions",
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
            <h2 className="text-xl font-bold">Data Security</h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              We implement appropriate technical and organizational measures to protect 
              your personal information against unauthorized access, alteration, or destruction.
              All data is encrypted in transit and at rest.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Rights</h2>
            <ul className="space-y-2 pl-6">
              {[
                "Access your personal data at any time",
                "Request correction of inaccurate data",
                "Request deletion of your account and data",
                "Opt-out of marketing communications",
                "Export your learning data",
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

          <div className={`p-4 rounded-xl ${
            darkMode
              ? "bg-gray-700/50 border border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              For any privacy-related questions or concerns, please contact us at{" "}
              <a href="mailto:privacy@mysterypath.com" className="text-purple-500 hover:underline">
                privacy@mysterypath.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;