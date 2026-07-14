import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { apiCall } from '../../config/apiConfig';

const AdminLogoSettings = ({ darkMode, showNotification }) => {
  const [logoUrl, setLogoUrl] = useState('/static/logo.png');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const data = await apiCall('/settings/logo');
      if (data && data.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/svg+xml')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      showNotification('Please select a valid image file (PNG, JPG, SVG).', 'error');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification('Please select a file to upload.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication error. Please log in again.', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo.');
      }

      const { image_url: newLogoPath } = await response.json();
      setLogoUrl(newLogoPath);
      setSelectedFile(null);
      setPreviewUrl(null);
      showNotification('Logo updated successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete logo.');
      }

      setLogoUrl('/static/logo.png');
      setPreviewUrl(null);
      setSelectedFile(null);
      showNotification('Logo removed successfully!', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification(`Delete failed: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Logo Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="text-center">
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Logo</p>
          <div className={`h-24 flex items-center justify-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <img src={logoUrl} alt="Current Logo" className="max-h-full max-w-full" />
          </div>
        </div>

        <div className="text-center">
          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Logo Preview</p>
          <div className={`h-24 flex items-center justify-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {previewUrl ? (
              <img src={previewUrl} alt="New Logo Preview" className="max-h-full max-w-full" />
            ) : (
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select an image to see a preview</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="logo-upload" className={`w-full cursor-pointer border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition ${darkMode ? 'border-gray-600 hover:border-purple-500' : 'border-gray-300 hover:border-purple-500'}`}>
          <Upload className={`mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
          <span className="text-sm font-semibold text-purple-600">
            {selectedFile ? 'Change file' : 'Click to select a file'}
          </span>
          <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {selectedFile ? selectedFile.name : 'PNG, JPG, or SVG recommended'}
          </span>
        </label>
        <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 py-3 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload Logo</>}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting || logoUrl === '/static/logo.png'}
          className="py-3 px-4 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isDeleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Remove</>}
        </button>
      </div>
    </div>
  );
};

export default AdminLogoSettings;
