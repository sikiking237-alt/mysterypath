import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

const LogoUploader = ({ currentLogoUrl, onLogoUpdated, showNotification }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

    // --- ADDED: Authentication ---
    // Retrieve the auth token. The storage location (e.g., localStorage)
    // may vary based on your application's auth strategy.
    const token = localStorage.getItem('token');

    if (!token) {
      showNotification('Authentication error. Please log in again.', 'error');
      return;
    }
    // --- END ADDED ---

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

      // Notify the parent component about the update
      if (onLogoUpdated) {
        onLogoUpdated(newLogoPath);
      }

      // Reset the component state
      setSelectedFile(null);
      setPreviewUrl(null);

      showNotification('✅ Logo updated successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(`❌ ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Update Website Logo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Current Logo Preview */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Logo</p>
          <div className="h-24 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <img src={currentLogoUrl} alt="Current Logo" className="max-h-full max-w-full" />
          </div>
        </div>

        {/* New Logo Preview */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">New Logo Preview</p>
          <div className="h-24 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="New Logo Preview" className="max-h-full max-w-full" />
            ) : (
              <span className="text-xs text-gray-400">Select an image to see a preview</span>
            )}
          </div>
        </div>
      </div>

      {/* File Input */}
      <div className="mt-6">
        <label htmlFor="logo-upload" className="w-full cursor-pointer bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center hover:border-purple-500 dark:hover:border-purple-500 transition">
          <Upload className="text-gray-400 mb-2" size={32} />
          <span className="text-sm font-semibold text-purple-600">
            {selectedFile ? 'Change file' : 'Click to select a file'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedFile ? selectedFile.name : 'PNG, JPG, or SVG recommended'}
          </span>
        </label>
        <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
      </div>

      {/* Upload Button */}
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload and Save Logo</>}
        </button>
      </div>
    </div>
  );
};

export default LogoUploader;