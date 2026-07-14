// src/components/Instructor/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';

const ImageUpload = ({ 
  darkMode, 
  onImageUpload, 
  currentImage, 
  label = 'Course Cover Image',
  maxSize = 5, // MB
  aspectRatio = '16:9'
}) => {
  const [imagePreview, setImagePreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const validateImage = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, GIF, or WEBP image';
    }

    // Check file size (max 5MB)
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Image size must be less than ${maxSize}MB`;
    }

    // Check dimensions (optional - recommend 1280x720)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 800 || img.height < 400) {
            resolve('Image should be at least 800x400 pixels for best quality');
          } else {
            resolve(null);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    // Validate
    const validationError = await validateImage(file);
    if (validationError) {
      setError(validationError);
      setUploading(false);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        if (onImageUpload) {
          onImageUpload(data.image_url, file);
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSuccess(false);
    setError(null);
    if (onImageUpload) {
      onImageUpload(null, null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </h4>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Upload a high-quality image (max {maxSize}MB, recommended 1280x720)
        </p>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          imagePreview
            ? darkMode ? 'border-indigo-500 bg-indigo-900/10' : 'border-indigo-300 bg-indigo-50'
            : error
            ? darkMode ? 'border-red-500 bg-red-900/10' : 'border-red-300 bg-red-50'
            : darkMode ? 'border-gray-600 hover:border-indigo-500 hover:bg-gray-700/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className={`mt-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Uploading...
            </p>
          </div>
        ) : imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Course cover"
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/40 rounded-lg">
              <div className="text-white text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Click to change image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className={`flex justify-center mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <ImageIcon className="w-12 h-12" />
            </div>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Click to upload or drag and drop
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              PNG, JPG, GIF, WEBP (max {maxSize}MB)
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image info */}
      {imagePreview && (
        <div className="flex items-center gap-4 text-sm">
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Image uploaded successfully
          </span>
          <button
            onClick={removeImage}
            className="text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
            {error}
          </span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
        }`}>
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
            Image uploaded successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
