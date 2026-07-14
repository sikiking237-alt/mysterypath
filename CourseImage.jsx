import React, { useState } from 'react';

const CourseImage = ({ src, title, className, alt }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fallbackColors = ['#6366f1', '#8b5cf6', '#a855f7', '#7c3aed', '#6d28d9', '#4f46e5'];
  const color = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
  
  const getInitials = (str) => {
    if (!str) return '📚';
    const words = str.split(' ').slice(0, 2);
    return words.map(w => w[0]).join('').toUpperCase();
  };
  
  if (error || !src) {
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-3xl font-bold">
          {getInitials(title || 'Course')}
        </span>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt || title || 'Course'}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

export default CourseImage;