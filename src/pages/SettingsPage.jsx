// src/pages/SettingsPage.jsx - Fixed Imports
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import TwoFactorAuth from '../components/TwoFactorAuth';
import ChangePassword from '../components/ChangePassword';
import DeleteAccount from '../components/DeleteAccount';
import LogoutButton from '../components/LogoutButton';
import { 
  User, Mail, Lock, Bell, Moon, Sun, Globe, Shield, Save,
  ChevronRight, Palette, Languages, Volume2, Eye, Smartphone,
  HelpCircle, ArrowLeft, Camera, Upload, X
} from 'lucide-react';

const SettingsPage = ({ darkMode, onToggleDarkMode, onLogout, userName, userEmail, userImage, onUpdateImage }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(() => {
    const saved = localStorage.getItem("userAvatar");
    return saved || userImage || null;
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [settings, setSettings] = useState({
    name: userName || 'Student',
    email: userEmail || 'student@example.com',
    notifications: true,
    darkMode: darkMode,
    language: language || 'en',
    privacy: 'public',
    twoFactor: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'language') {
      setLanguage(value);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      setPreviewImage(imageData);
      localStorage.setItem("userAvatar", imageData);
      if (onUpdateImage) {
        onUpdateImage(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    localStorage.removeItem("userAvatar");
    if (onUpdateImage) {
      onUpdateImage(null);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const settingsSections = [
    {
      title: t.profile || 'Profile',
      icon: User,
      color: 'text-blue-500',
      items: [
        { 
          label: t.profilePicture || 'Profile Picture', 
          field: 'image', 
          type: 'image',
          value: previewImage,
          onUpload: handleImageUpload,
          onRemove: handleRemoveImage,
        },
        { label: t.fullName || 'Full Name', field: 'name', type: 'text', value: settings.name },
        { label: t.emailAddress || 'Email Address', field: 'email', type: 'email', value: settings.email },
      ]
    },
    {
      title: t.preferences || 'Preferences',
      icon: Palette,
      color: 'text-purple-500',
      items: [
        { 
          label: t.darkMode || 'Dark Mode', 
          field: 'darkMode', 
          type: 'toggle', 
          value: settings.darkMode,
          onChange: () => {
            handleChange('darkMode', !settings.darkMode);
            if (onToggleDarkMode) onToggleDarkMode();
          }
        },
        { 
          label: t.notifications || 'Notifications', 
          field: 'notifications', 
          type: 'toggle', 
          value: settings.notifications,
          onChange: () => handleChange('notifications', !settings.notifications)
        },
        { 
          label: t.language || 'Language', 
          field: 'language', 
          type: 'select', 
          value: settings.language,
          options: languageOptions,
          onChange: (value) => {
            handleChange('language', value);
            setLanguage(value);
          }
        },
      ]
    },
    {
      title: t.security || 'Security',
      icon: Shield,
      color: 'text-green-500',
      items: [
        { 
          label: t.twoFactorAuth || 'Two-Factor Authentication', 
          field: 'twoFactor', 
          type: 'custom',
          component: TwoFactorAuth
        },
        { 
          label: t.privacy || 'Privacy', 
          field: 'privacy', 
          type: 'select', 
          value: settings.privacy,
          options: [
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' },
            { value: 'contacts', label: 'Contacts Only' }
          ],
          onChange: (value) => handleChange('privacy', value)
        },
        { 
          label: t.changePassword || 'Change Password', 
          field: 'password', 
          type: 'button', 
          action: () => setShowChangePassword(true)
        },
      ]
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-20`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-6 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back || 'Back'}
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t.settingsTitle || 'Settings'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t.settingsDesc || 'Manage your account preferences and settings'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? (t.saving || 'Saving...') : (t.saveChanges || 'Save Changes')}
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-2">
            <span>✅</span>
            {t.savedSuccess || 'Settings saved successfully!'}
          </div>
        )}

        <div className="space-y-6">
          {settingsSections.map((section, index) => (
            <div
              key={index}
              className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-3`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
                <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`${itemIndex < section.items.length - 1 ? 'pb-4 border-b ' + (darkMode ? 'border-gray-700' : 'border-gray-100') : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.label}
                      </label>
                      {item.type === 'image' && (
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              {item.value ? (
                                <img src={item.value} alt={t.profilePicture || 'Profile'} className="w-full h-full object-cover" />
                              ) : (
                                <User className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              )}
                            </div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className={`absolute bottom-0 right-0 p-1.5 rounded-full ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition shadow-lg`}
                              title={t.changePhoto || 'Change profile picture'}
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            {item.value && (
                              <button
                                onClick={item.onRemove}
                                className={`absolute -top-1 -right-1 p-1 rounded-full ${darkMode ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-600'} text-white transition shadow-lg`}
                                title={t.removePhoto || 'Remove profile picture'}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={item.onUpload}
                              className="hidden"
                            />
                          </div>
                          <div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.value ? (t.profilePictureSet || 'Profile picture set') : (t.noProfilePicture || 'No profile picture')}
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className={`text-xs ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} transition`}
                            >
                              {item.value ? (t.changePhoto || 'Change photo') : (t.uploadPhoto || 'Upload photo')}
                            </button>
                          </div>
                        </div>
                      )}
                      {item.type === 'toggle' && (
                        <button
                          onClick={item.onChange}
                          className={`relative w-12 h-6 rounded-full transition ${
                            item.value ? 'bg-indigo-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition ${
                              item.value ? 'translate-x-6' : ''
                            }`}
                          />
                        </button>
                      )}
                      {item.type === 'custom' && (
                        <item.component darkMode={darkMode} />
                      )}
                      {item.type === 'text' && (
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleChange(item.field, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border text-sm w-48 ${
                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                      )}
                      {item.type === 'email' && (
                        <input
                          type="email"
                          value={item.value}
                          onChange={(e) => handleChange(item.field, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border text-sm w-48 ${
                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                      )}
                      {item.type === 'select' && item.options && (
                        <select
                          value={item.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (item.onChange) {
                              item.onChange(value);
                            } else {
                              handleChange(item.field, value);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-sm w-48 ${
                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        >
                          {item.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {item.type === 'button' && (
                        <button
                          onClick={item.action}
                          className="px-4 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                        >
                          {item.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 p-6 rounded-xl border-2 border-red-200 dark:border-red-800/50 ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}`}>
          <h3 className={`font-semibold text-red-600 dark:text-red-400 flex items-center gap-2`}>
            <Shield className="w-5 h-5" />
            {t.dangerZone || 'Danger Zone'}
          </h3>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {t.deleteAccount || 'Delete Account'}
            </button>
              <LogoutButton
                onLogout={onLogout}
                darkMode={darkMode}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              />
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <ChangePassword
            darkMode={darkMode}
            onClose={() => setShowChangePassword(false)}
          />
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <DeleteAccount userEmail={userEmail}
            darkMode={darkMode}
            onClose={() => setShowDeleteAccount(false)}
            onDelete={() => {
              setShowDeleteAccount(false);
              window.location.href = '/login';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

