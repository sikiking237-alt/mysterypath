import React, { useState, useEffect } from 'react';
import { apiCall, apiEndpoints } from '@/config/apiConfig';
import { Loader } from 'lucide-react';

const AdminLogoSettings = ({ darkMode }) => {
  const [logoUrl, setLogoUrl] = useState('');
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchLogo = async () => {
    setIsLogoLoading(true);
    const response = await apiCall(apiEndpoints.settings.logo);
    if (response && response.logo_url) {
      setLogoUrl(`${response.logo_url}?t=${new Date().getTime()}`);
    } else {
      setMessage({ text: 'Failed to load current logo.', type: 'error' });
    }
    setIsLogoLoading(false);
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'File is too large. Max 2MB.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUpdating(true);
    setMessage({ text: '', type: '' });

    const response = await apiCall(apiEndpoints.admin.logo, {
      method: 'POST',
      body: formData,
    });

    setIsUpdating(false);

    if (response && response.success && response.logo_url) {
      setMessage({ text: 'Logo updated successfully!', type: 'success' });
      setLogoUrl(`${response.logo_url}?t=${new Date().getTime()}`);
    } else {
      setMessage({ text: response.error || 'Failed to update logo', type: 'error' });
    }
  };

  const inputClass = `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}
    file:mr-4 file:py-2 file:px-4
    file:rounded-lg file:border-0
    file:text-sm file:font-semibold
    ${darkMode ? 'file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer' : 'file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer'}
    disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Website Logo
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Logo Preview</label>
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} inline-block min-h-[80px] min-w-[150px] flex items-center justify-center`}>
            {isLogoLoading ? <Loader className="animate-spin text-purple-500" /> : (logoUrl && <img src={logoUrl} alt="Site Logo" className="max-h-12" />)}
          </div>
        </div>
        <div>
          <label htmlFor="logo-upload" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload New Logo</label>
          <div className="relative">
            <input type="file" id="logo-upload" accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp" onChange={handleFileChange} disabled={isUpdating} className={inputClass} />
            {isUpdating && <p className={`text-sm mt-2 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}><Loader size={16} className="animate-spin" /> Uploading...</p>}
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: PNG or SVG with transparent background. Max 2MB.</p>
        </div>
      </div>
      {message.text && <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{message.text}</p>}
    </div>
  );
};

export default AdminLogoSettings;