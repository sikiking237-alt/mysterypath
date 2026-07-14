// src/components/Instructor/StepMedia.jsx
import React from 'react';
import ImageUpload from './ImageUpload';

const StepMedia = ({ darkMode, course, setCourse }) => {
  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📸</span>
          <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Course Cover Image
          </h3>
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Upload a high-quality image that represents your course. 
          This will be displayed on the course card and landing page.
        </p>
        <ul className={`mt-2 text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <li>• Recommended size: 1280x720 pixels</li>
          <li>• Supported formats: PNG, JPG, JPEG, GIF, WEBP</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Drag and drop or click to upload</li>
        </ul>
      </div>

      <ImageUpload
        darkMode={darkMode}
        onImageUpload={(imageUrl) => {
          setCourse({ ...course, image_url: imageUrl });
        }}
        currentImage={course.image_url}
        label="Course Cover Image"
        maxSize={5}
      />

      {course.image_url && (
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              Image uploaded successfully!
            </p>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Your course cover image is ready. You can change it anytime.
          </p>
          <div className="mt-3 rounded-lg overflow-hidden max-h-48">
            <img 
              src={course.image_url} 
              alt="Course cover preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StepMedia;
