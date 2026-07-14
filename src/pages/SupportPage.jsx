import React from 'react';
import SupportContentPage from './SupportContentPage';

const SupportPage = ({ darkMode }) => {
  // This component reuses the SupportContentPage to display the "Help Center".
  return (
    <SupportContentPage type="support" darkMode={darkMode} />
  );
};

export default SupportPage;