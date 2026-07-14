// frontend/src/context/FontSizeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const FontSizeContext = createContext();

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    console.warn('useFontSize must be used within a FontSizeProvider, using defaults');
    return {
      fontSize: 'medium',
      setFontSize: () => {},
      currentSize: { 
        base: 'text-base', 
        heading: 'text-2xl', 
        subheading: 'text-lg',
        body: 'text-base',
        label: 'text-sm',
        button: 'text-sm',
        card: 'text-base',
        small: 'text-xs'
      }
    };
  }
  return context;
};

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => {
    try {
      const saved = localStorage.getItem('fontSize');
      return saved || 'medium';
    } catch {
      return 'medium';
    }
  });

  const sizes = {
    small: { 
      base: 'text-sm', 
      heading: 'text-xl', 
      subheading: 'text-base',
      body: 'text-sm',
      label: 'text-xs',
      button: 'text-xs',
      card: 'text-sm',
      small: 'text-[10px]'
    },
    medium: { 
      base: 'text-base', 
      heading: 'text-2xl', 
      subheading: 'text-lg',
      body: 'text-base',
      label: 'text-sm',
      button: 'text-sm',
      card: 'text-base',
      small: 'text-xs'
    },
    large: { 
      base: 'text-lg', 
      heading: 'text-3xl', 
      subheading: 'text-xl',
      body: 'text-lg',
      label: 'text-base',
      button: 'text-base',
      card: 'text-lg',
      small: 'text-sm'
    },
    xlarge: { 
      base: 'text-xl', 
      heading: 'text-4xl', 
      subheading: 'text-2xl',
      body: 'text-xl',
      label: 'text-lg',
      button: 'text-lg',
      card: 'text-xl',
      small: 'text-base'
    },
  };

  useEffect(() => {
    try {
      localStorage.setItem('fontSize', fontSize);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  }, [fontSize]);

  const value = {
    fontSize,
    setFontSize,
    currentSize: sizes[fontSize] || sizes.medium,
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
};

export default FontSizeContext;