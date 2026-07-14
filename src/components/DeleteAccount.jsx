// src/components/DeleteAccount.jsx - With Email Verification
import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Check, Eye, EyeOff, Mail, Send } from 'lucide-react';

const DeleteAccount = ({ darkMode, onClose, onDelete, userEmail }) => {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const sendVerificationCode = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/send-delete-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSentCode(data.code);
        setVerificationSent(true);
        setStep(2);
        // Start timer for resend
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setSuccess('Verification code sent to your email!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode !== sentCode) {
      setError('Invalid verification code');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Account deleted successfully');
        setStep(3);
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
          if (onDelete) onDelete();
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border-2`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Are you sure?
          </h3>
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Deleting your account is permanent and cannot be undone. You will lose:
        </p>
        <ul className={`mt-3 space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <li className="flex items-center gap-2">
            <span className="text-red-500">•</span>
            All your course progress and certificates
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-500">•</span>
            Access to all purchased and enrolled courses
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-500">•</span>
            Your profile, achievements, and learning history
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-500">•</span>
            Any personal data associated with your account
          </li>
        </ul>
      </div>

      <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <Mail className="w-4 h-4 inline mr-2" />
          A verification code will be sent to <strong>{userEmail || 'your email'}</strong> for security.
        </p>
      </div>

      <button
        onClick={sendVerificationCode}
        disabled={loading}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Sending Code...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Verification Code
          </>
        )}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <Mail className="w-4 h-4 inline mr-2" />
          A verification code has been sent to <strong>{userEmail || 'your email'}</strong>
        </p>
        {success && (
          <p className={`text-sm mt-2 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
            {success}
          </p>
        )}
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Enter Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg tracking-widest`}
          placeholder="Enter 6-digit code"
          maxLength="6"
        />
        {resendTimer > 0 && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Resend available in {resendTimer}s
          </p>
        )}
        {resendTimer === 0 && verificationSent && (
          <button
            onClick={sendVerificationCode}
            className="text-xs text-blue-500 hover:text-blue-600 mt-1"
          >
            Resend Code
          </button>
        )}
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Type <span className="font-bold text-red-500">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-center`}
          placeholder="Type DELETE here"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Enter your password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500 pr-10`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
          <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setStep(1)}
          className={`flex-1 py-2 rounded-lg font-medium transition ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Back
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== 'DELETE' || !password || !verificationCode || verificationCode !== sentCode}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Permanently Delete Account
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Account Deleted Successfully
      </h3>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Your account has been permanently deleted. You will be redirected to the login page.
      </p>
      <div className="animate-pulse mt-4">
        <div className="h-1 w-32 bg-red-500 rounded-full mx-auto"></div>
      </div>
    </div>
  );

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-w-md w-full relative`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2 text-red-500`}>
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h2>
        {step !== 3 && (
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default DeleteAccount;
