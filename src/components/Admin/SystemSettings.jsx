// frontend/src/components/Admin/SystemSettings.jsx
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { apiCall, apiEndpoints } from "../../config/apiConfig";
import AdminLogoSettings from "./AdminLogoSettings";
import CurrencySettings from "../../../CurrencySettings.jsx";

const SystemSettings = ({ darkMode }) => {
  const [settings, setSettings] = useState({
    siteName: "LearnFlow",
    siteDescription: "Your smooth path to knowledge mastery",
    contactEmail: "support@learnflow.com",
    contactPhone: "+1 (555) 123-4567",
    contactAddress: "123 Learning Avenue, Knowledge City",
    supportHours: "Monday - Friday, 9:00 AM - 6:00 PM",
    aboutHeadline: "Empowering learners to grow with confidence",
    aboutBody:
      "LearnFlow helps students build practical skills through expert-led courses, guided learning paths, and modern digital tools. We believe education should be accessible, engaging, and focused on real outcomes.",
    aboutMission:
      "To deliver practical, high-quality digital learning experiences that help every student move forward.",
    aboutVision:
      "To become a trusted learning platform where students, instructors, and communities grow together.",
    helpCenterTitle: "Help Center",
    helpCenterIntro:
      "Find quick answers, support channels, and guidance for getting the most out of LearnFlow.",
    helpCenterFaqs: [
      {
        question: "How do I enroll in a course?",
        answer:
          "Open the course page and click the enroll button. Your course will appear in My Learning after successful enrollment.",
      },
      {
        question: "How do I track my progress?",
        answer:
          "Visit My Learning to see your active courses, lesson completion, and overall course progress.",
      },
    ],
    currency: "USD",
    maxCourseSize: 500,
    enablePublicSignup: true,
    emailNotifications: true,
    maintenanceMode: false,
    sessionTimeout: 3600,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);

  const defaultCurrencies = [
    { code: 'USD', name: 'United States Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound Sterling' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'XOF', name: 'CFA Franc BCEAO' },
    { code: 'XAF', name: 'CFA Franc BEAC' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.supportedCurrencies && settings.supportedCurrencies.length > 0) {
      try {
        const parsed =
          typeof settings.supportedCurrencies === "string"
            ? JSON.parse(settings.supportedCurrencies)
            : settings.supportedCurrencies;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSupportedCurrencies(parsed);
        } else {
          setSupportedCurrencies(defaultCurrencies);
        }
      } catch {
        setSupportedCurrencies(defaultCurrencies);
      }
    } else {
      setSupportedCurrencies(defaultCurrencies);
    }
  }, [settings.supportedCurrencies]);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const data = await apiCall(apiEndpoints.admin.settings);
      if (data && data.settings) {
        const nextSettings = { ...data.settings };
        if (typeof nextSettings.helpCenterFaqs === "string") {
          try {
            nextSettings.helpCenterFaqs = JSON.parse(
              nextSettings.helpCenterFaqs,
            );
          } catch {
            nextSettings.helpCenterFaqs = [];
          }
        }
        if (!Array.isArray(nextSettings.helpCenterFaqs)) {
          nextSettings.helpCenterFaqs = [];
        }
        setSettings((prev) => ({ ...prev, ...nextSettings }));
        setIsDirty(false);
      } else if (data.error) {
        setMessage({
          text: `Failed to load settings: ${data.error}`,
          type: "error",
        });
      }
    } catch (err) {
      // This is a fallback for unexpected errors not caught by apiCall
      console.error("Error loading settings:", err);
      setMessage({
        text: "An unexpected error occurred while fetching settings.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = () => {
    const newErrors = {};

    if (!settings.siteName?.trim()) {
      newErrors.siteName = "Site name is required";
    } else if (settings.siteName.length > 100) {
      newErrors.siteName = "Site name must be less than 100 characters";
    }

    if (!settings.siteDescription?.trim()) {
      newErrors.siteDescription = "Description is required";
    } else if (settings.siteDescription.length > 500) {
      newErrors.siteDescription =
        "Description must be less than 500 characters";
    }

    if (!settings.contactEmail?.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }

    if (settings.sessionTimeout < 300 || settings.sessionTimeout > 86400) {
      newErrors.sessionTimeout =
        "Session timeout must be between 5 minutes and 24 hours";
    }

    if (settings.maxCourseSize < 1 || settings.maxCourseSize > 5000) {
      newErrors.maxCourseSize =
        "Max course size must be between 1MB and 5000MB";
    }

    if (!settings.aboutHeadline?.trim()) {
      newErrors.aboutHeadline = "About headline is required";
    }

    if (!settings.aboutBody?.trim()) {
      newErrors.aboutBody = "About body is required";
    }

    if (!settings.helpCenterTitle?.trim()) {
      newErrors.helpCenterTitle = "Help center title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === "checkbox" ? checked : type === "number" ? Number(value) : value;

    setSettings((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setIsDirty(true);

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSettingsUpdate = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
  };

  const handleFaqChange = (index, field, value) => {
    setSettings((prev) => ({
      ...prev,
      helpCenterFaqs: (prev.helpCenterFaqs || []).map((faq, faqIndex) =>
        faqIndex === index ? { ...faq, [field]: value } : faq,
      ),
    }));
    setIsDirty(true);
  };

  const addFaq = () => {
    setSettings((prev) => ({
      ...prev,
      helpCenterFaqs: [
        ...(prev.helpCenterFaqs || []),
        { question: "", answer: "" },
      ],
    }));
    setIsDirty(true);
  };

  const removeFaq = (index) => {
    setSettings((prev) => ({
      ...prev,
      helpCenterFaqs: (prev.helpCenterFaqs || []).filter(
        (_, faqIndex) => faqIndex !== index,
      ),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        ...settings,
        helpCenterFaqs: JSON.stringify(
          (settings.helpCenterFaqs || []).filter(
            (faq) => faq.question?.trim() && faq.answer?.trim(),
          ),
        ),
      };

      const data = await apiCall(apiEndpoints.admin.settings, {
        method: "POST",
        body: payload,
      });

      if (data && data.success) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
        setIsDirty(false);
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      } else {
        setMessage({
          text: data.error || "An unknown error occurred while saving settings.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({
        text: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all settings to defaults?")) {
      const defaultSettings = {
        siteName: "LearnFlow",
        siteDescription: "Your smooth path to knowledge mastery",
        contactEmail: "support@learnflow.com",
        currency: "USD",
        maxCourseSize: 500,
        enablePublicSignup: true,
        emailNotifications: true,
        maintenanceMode: false,
        sessionTimeout: 3600,
      };
      setSettings(defaultSettings);
      setIsDirty(true);
    }
  };

  if (loading) {
    return (
      <div
        className={`p-6 max-w-4xl mx-auto flex items-center justify-center min-h-96 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 max-w-4xl mx-auto min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
        >
          System Settings
        </h1>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Configure your platform settings and preferences
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-6 p-4 border rounded-lg flex gap-3 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : message.type === "warning"
                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : message.type === "warning" ? (
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-green-800 dark:text-green-300"
                : message.type === "warning"
                  ? "text-yellow-800 dark:text-yellow-300"
                  : "text-red-800 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Settings Card */}
      <div
        className={`rounded-lg p-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-sm`}
      >
        <div className="space-y-8">
          {/* Site Settings */}
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Site Information
            </h3>
            <div className="space-y-4">
              {/* Site Name */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName || ""}
                  onChange={handleChange}
                  maxLength={100}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    errors.siteName
                      ? darkMode
                        ? "bg-gray-700 border-red-500 text-white focus:ring-red-500"
                        : "bg-white border-red-300 focus:ring-red-500"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                        : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                  placeholder="Enter site name"
                />
                <div className="flex justify-between items-start mt-1">
                  {errors.siteName && (
                    <p className="text-xs text-red-600">{errors.siteName}</p>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {settings.siteName?.length || 0}/100
                  </span>
                </div>
              </div>

              {/* Site Description */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Site Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="siteDescription"
                  value={settings.siteDescription || ""}
                  onChange={handleChange}
                  maxLength={500}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    errors.siteDescription
                      ? darkMode
                        ? "bg-gray-700 border-red-500 text-white focus:ring-red-500"
                        : "bg-white border-red-300 focus:ring-red-500"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                        : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                  placeholder="Enter site description"
                />
                <div className="flex justify-between items-start mt-1">
                  {errors.siteDescription && (
                    <p className="text-xs text-red-600">
                      {errors.siteDescription}
                    </p>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {settings.siteDescription?.length || 0}/500
                  </span>
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    errors.contactEmail
                      ? darkMode
                        ? "bg-gray-700 border-red-500 text-white focus:ring-red-500"
                        : "bg-white border-red-300 focus:ring-red-500"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                        : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                  placeholder="support@example.com"
                />
                {errors.contactEmail && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.contactEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />

          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Public Support Content
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Contact Phone
                </label>
                <input
                  type="text"
                  name="contactPhone"
                  value={settings.contactPhone || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Contact Address
                </label>
                <textarea
                  name="contactAddress"
                  value={settings.contactAddress || ""}
                  onChange={handleChange}
                  rows="2"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  placeholder="Office or mailing address"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Support Hours
                </label>
                <input
                  type="text"
                  name="supportHours"
                  value={settings.supportHours || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  placeholder="Monday - Friday, 9:00 AM - 6:00 PM"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  About Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="aboutHeadline"
                  value={settings.aboutHeadline || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${errors.aboutHeadline ? (darkMode ? "bg-gray-700 border-red-500 text-white focus:ring-red-500" : "bg-white border-red-300 focus:ring-red-500") : darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  placeholder="Headline for the About page"
                />
                {errors.aboutHeadline && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.aboutHeadline}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  About Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="aboutBody"
                  value={settings.aboutBody || ""}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${errors.aboutBody ? (darkMode ? "bg-gray-700 border-red-500 text-white focus:ring-red-500" : "bg-white border-red-300 focus:ring-red-500") : darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  placeholder="Main About Us content"
                />
                {errors.aboutBody && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.aboutBody}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Mission
                  </label>
                  <textarea
                    name="aboutMission"
                    value={settings.aboutMission || ""}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Vision
                  </label>
                  <textarea
                    name="aboutVision"
                    value={settings.aboutVision || ""}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Help Center Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="helpCenterTitle"
                  value={settings.helpCenterTitle || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${errors.helpCenterTitle ? (darkMode ? "bg-gray-700 border-red-500 text-white focus:ring-red-500" : "bg-white border-red-300 focus:ring-red-500") : darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                />
                {errors.helpCenterTitle && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.helpCenterTitle}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Help Center Intro
                </label>
                <textarea
                  name="helpCenterIntro"
                  value={settings.helpCenterIntro || ""}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Help Center FAQs
                  </label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add FAQ
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.helpCenterFaqs || []).map((faq, index) => (
                    <div
                      key={index}
                      className={`rounded-xl border p-4 ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={faq.question || ""}
                          onChange={(e) =>
                            handleFaqChange(index, "question", e.target.value)
                          }
                          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                          placeholder="Question"
                        />
                        <textarea
                          value={faq.answer || ""}
                          onChange={(e) =>
                            handleFaqChange(index, "answer", e.target.value)
                          }
                          rows="3"
                          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" : "bg-white border-gray-300 focus:ring-purple-500"}`}
                          placeholder="Answer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />

          {/* Logo Settings */}
          <AdminLogoSettings darkMode={darkMode} />

          <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />

          {/* Technical Settings */}
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Technical Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Currency */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Default Currency
                </label>
                <select
                  name="currency"
                  value={settings.currency || "USD"}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                      : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                >
                  {supportedCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Course Size */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Max Course Size (MB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="maxCourseSize"
                  value={settings.maxCourseSize || 500}
                  onChange={handleChange}
                  min="1"
                  max="5000"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    errors.maxCourseSize
                      ? darkMode
                        ? "bg-gray-700 border-red-500 text-white focus:ring-red-500"
                        : "bg-white border-red-300 focus:ring-red-500"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                        : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                />
                {errors.maxCourseSize && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.maxCourseSize}
                  </p>
                )}
              </div>

              {/* Session Timeout */}
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Session Timeout (seconds){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={settings.sessionTimeout || 3600}
                  onChange={handleChange}
                  min="300"
                  max="86400"
                  step="300"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                    errors.sessionTimeout
                      ? darkMode
                        ? "bg-gray-700 border-red-500 text-white focus:ring-red-500"
                        : "bg-white border-red-300 focus:ring-red-500"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                        : "bg-white border-gray-300 focus:ring-purple-500"
                  }`}
                />
                {errors.sessionTimeout && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.sessionTimeout}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((settings.sessionTimeout || 3600) / 60)} minutes
                </p>
              </div>
            </div>

            <hr
              className={`my-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            />

            <div>
              <CurrencySettings
                settings={settings}
                onUpdate={handleSettingsUpdate}
                darkMode={darkMode}
              />
            </div>
          </div>

          <hr className={darkMode ? "border-gray-700" : "border-gray-200"} />

          {/* Preferences */}
          <div>
            <h3
              className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Preferences & Features
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enablePublicSignup"
                  checked={settings.enablePublicSignup || false}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Enable public user signup
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications || false}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Enable email notifications
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode || false}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Maintenance mode (platform unavailable to users)
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t flex justify-end gap-3">
            {isDirty && (
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mr-auto`}
              >
                You have unsaved changes
              </p>
            )}
            <button
              onClick={handleReset}
              disabled={saving}
              className={`px-4 py-2 rounded-lg border font-medium transition flex items-center gap-2 ${
                darkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
