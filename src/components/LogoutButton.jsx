import React, { useState } from 'react';
import { LogOut, Loader2, X } from 'lucide-react';

const LogoutButton = ({ onLogout, darkMode, collapsed = false, className = '' }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  const baseClasses = collapsed
    ? 'p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center'
    : 'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200';

  const themeClasses = darkMode
    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
    : 'text-red-600 hover:bg-red-50 hover:text-red-700';

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoggingOut}
        className={`${baseClasses} ${themeClasses} ${className}`}
        title={collapsed ? 'Logout' : ''}
      >
        {isLoggingOut ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </>
        )}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isLoggingOut && setShowConfirm(false)} />
          <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <button
              onClick={() => !isLoggingOut && setShowConfirm(false)}
              disabled={isLoggingOut}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <LogOut className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Confirm Logout
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Are you sure you want to log out?
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
