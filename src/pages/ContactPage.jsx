import React from 'react';
import SupportContentPage from './SupportContentPage';

const ContactPage = ({ darkMode }) => {
  // This component reuses the SupportContentPage to display "Contact" information.
  return (
    <SupportContentPage type="contact" darkMode={darkMode} />
  );
};

export default ContactPage;