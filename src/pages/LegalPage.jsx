import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, ChevronRight, Scale, Lock } from "lucide-react";

const LegalPage = ({ darkMode }) => {
  const navigate = useNavigate();

  const legalItems = [
    {
      title: "Privacy Policy",
      description: "Learn how we protect your data and privacy",
      icon: Shield,
      path: "/privacy-policy",
      color: "purple",
    },
    {
      title: "Terms of Service",
      description: "Understand the rules and guidelines",
      icon: FileText,
      path: "/terms-of-service",
      color: "blue",
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
              <Scale size={48} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Legal</h1>
          <p className={`mt-2 text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Your rights, our responsibilities, and everything in between
          </p>
        </div>

        <div className="grid gap-4">
          {legalItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`w-full p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg text-left ${
                darkMode
                  ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                  : "bg-white border-gray-100 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                    <item.icon size={24} className={`text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        <div className={`mt-8 p-6 rounded-2xl border ${
          darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-100 shadow-sm"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Lock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Data Security</h4>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                We take your privacy seriously. All data is encrypted and stored securely.
                You have full control over your personal information.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            © 2026 MysteryPath. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;