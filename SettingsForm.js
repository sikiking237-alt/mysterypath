// frontend/src/features/settings/SettingsForm.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateLocalSettings, 
  saveSettings,
  selectSettings, 
  selectSettingsStatus, 
  selectSettingsError 
} from './settingsSlice';
import { Type, Minus, Plus } from 'lucide-react';

const SettingsForm = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const status = useSelector(selectSettingsStatus);
  const error = useSelector(selectSettingsError);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    dispatch(updateLocalSettings({ 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFontSizeChange = (fontSize) => {
    dispatch(updateLocalSettings({ fontSize }));
  };

  const handleSave = () => {
    dispatch(saveSettings(settings));
  };

  const isDarkMode = settings.theme === 'dark';

  const fontSizes = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'X-Large', value: 'xlarge' },
  ];

  return (
    <div className={`p-6 max-w-3xl mx-auto min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Settings
        </h2>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Manage your account preferences
        </p>
      </div>

      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Theme Setting */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            🌓 Theme
          </label>
          <select 
            name="theme" 
            value={settings.theme} 
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>

        {/* ✅ Font Size Setting */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Type size={20} className="text-purple-600" />
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Font Size
            </label>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const sizes = ['small', 'medium', 'large', 'xlarge'];
                const currentIndex = sizes.indexOf(settings.fontSize || 'medium');
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                handleFontSizeChange(sizes[prevIndex]);
              }}
              className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Minus size={16} />
            </button>

            <div className="flex items-center gap-1">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleFontSizeChange(size.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    (settings.fontSize || 'medium') === size.value
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : `${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`
                  }`}
                  style={{ 
                    fontSize: size.value === 'small' ? '11px' : 
                             size.value === 'medium' ? '13px' : 
                             size.value === 'large' ? '16px' : '19px' 
                  }}
                >
                  A
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const sizes = ['small', 'medium', 'large', 'xlarge'];
                const currentIndex = sizes.indexOf(settings.fontSize || 'medium');
                const nextIndex = currentIndex < sizes.length - 1 ? currentIndex + 1 : sizes.length - 1;
                handleFontSizeChange(sizes[nextIndex]);
              }}
              className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Preview */}
          <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <p className={`${
              (settings.fontSize || 'medium') === 'small' ? 'text-sm' : 
              (settings.fontSize || 'medium') === 'medium' ? 'text-base' : 
              (settings.fontSize || 'medium') === 'large' ? 'text-lg' : 'text-xl'
            } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Preview: The quick brown fox jumps over the lazy dog.
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
              Current: <span className="font-semibold capitalize">{settings.fontSize || 'medium'}</span>
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="notifications"
              name="notifications" 
              checked={settings.notifications} 
              onChange={handleChange}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="notifications" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🔔 Enable Notifications
            </label>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="mb-6">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="emailNotifications"
              name="emailNotifications" 
              checked={settings.emailNotifications} 
              onChange={handleChange}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="emailNotifications" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ✉️ Email Notifications
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave} 
          disabled={status === 'loading'}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold transition ${
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-600/30 text-white'
          }`}
        >
          {status === 'loading' ? '💾 Saving...' : '💾 Save Settings'}
        </button>

        {status === 'succeeded' && (
          <p className="text-green-500 text-sm mt-3 text-center">✅ Settings saved successfully!</p>
        )}
        {status === 'failed' && (
          <p className="text-red-500 text-sm mt-3 text-center">❌ Error: {error}</p>
        )}
      </div>
    </div>
  );
};

export default SettingsForm;