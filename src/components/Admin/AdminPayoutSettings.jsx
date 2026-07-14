import React from 'react';

const AdminPayoutSettings = ({ darkMode }) => {
  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Payout Settings
      </h1>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Configure payout settings for instructors here.
        </p>
      </div>
    </div>
  );
};

export default AdminPayoutSettings;