import React from 'react';
import SupportContentPage from './SupportContentPage';

const AboutPage = ({ darkMode }) => {
  // This component reuses the SupportContentPage to display "About Us" content.
  return (
    <SupportContentPage type="about" darkMode={darkMode} />
  );
};

export default AboutPage;