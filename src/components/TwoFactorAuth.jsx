// src/components/TwoFactorAuth.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, RefreshCw, Copy, Download } from 'lucide-react';

const TwoFactorAuth = ({ darkMode, onEnable, onDisable }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check 2FA status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/two-factor/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setIsEnabled(data.is_enabled);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    setError('');
    setIsSettingUp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/two-factor/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setSecret(data.secret);
        setQrCode(data.qr_code);
        // Generate backup codes (in production, these would come from backend)
        const codes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setBackupCodes(codes);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError('');
    setIsVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/two-factor/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: secret,
          code: verificationCode
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('2FA enabled successfully!');
        setIsEnabled(true);
        setShowBackupCodes(true);
        if (onEnable) onEnable();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA?')) return;
    
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/two-factor/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('2FA disabled successfully');
        setIsEnabled(false);
        setSecret('');
        setQrCode('');
        setBackupCodes([]);
        setShowBackupCodes(false);
        if (onDisable) onDisable();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isSettingUp) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
          <Shield className="w-5 h-5 text-green-500" />
          <div>
            <p className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Two-Factor Authentication Enabled</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your account is protected with 2FA</p>
          </div>
        </div>
        <button
          onClick={handleDisable}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Disable 2FA
        </button>
      </div>
    );
  }

  if (qrCode) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Scan QR Code
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center mb-4">
            <img 
              src={`data:image/png;base64,${qrCode}`} 
              alt="QR Code" 
              className="w-48 h-48 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Secret Key: <span className="font-mono">{secret}</span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(secret);
                setSuccess('Secret key copied!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition`}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Verify Code
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
            Enter the 6-digit code from your authenticator app
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              maxLength="6"
              className={`px-4 py-2 rounded-lg border text-center text-lg font-mono ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            <button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>

        {showBackupCodes && (
          <div className={`p-4 rounded-xl border-2 ${darkMode ? 'border-yellow-500/30 bg-yellow-900/20' : 'border-yellow-400 bg-yellow-50'}`}>
            <h3 className={`font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
              ⚠️ Backup Codes
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              Save these backup codes in a secure place. Each code can be used once.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {backupCodes.map((code, index) => (
                <div key={index} className={`px-3 py-1 rounded font-mono text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyBackupCodes}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
          </div>
        )}
        {success && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
            <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>{success}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <Shield className="w-5 h-5 text-gray-400" />
        <div>
          <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Two-Factor Authentication
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Add an extra layer of security to your account
          </p>
        </div>
      </div>
      <button
        onClick={handleSetup}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Enable 2FA
      </button>
      {error && (
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
          <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
        </div>
      )}
      {success && (
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
          <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>{success}</p>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
