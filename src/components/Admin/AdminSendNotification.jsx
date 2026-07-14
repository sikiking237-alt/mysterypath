import React, { useState } from 'react';

const AdminSendNotification = ({ darkMode, onClose, onSent }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [notificationType, setNotificationType] = useState('info');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          message,
          type: notificationType,
          target
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`✅ ${data.message}`);
        setTimeout(() => {
          if (onSent) onSent();
          onClose();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send notification');
      }
    } catch (error) {
      setError('Error sending notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const targets = [
    { value: 'all', label: 'All Users', icon: '🌍', description: 'Send to all users (students + instructors)' },
    { value: 'students', label: 'Students Only', icon: '🎓', description: 'Send only to students' },
    { value: 'instructors', label: 'Instructors Only', icon: '👨‍🏫', description: 'Send only to instructors' }
  ];

  const types = [
    { value: 'info', label: 'Information', icon: 'ℹ️', color: 'blue' },
    { value: 'success', label: 'Success', icon: '✅', color: 'green' },
    { value: 'warning', label: 'Warning', icon: '⚠️', color: 'yellow' },
    { value: 'error', label: 'Error', icon: '❌', color: 'red' }
  ];

  const getPreviewClass = () => {
    switch(notificationType) {
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Modal container - clicking here does NOT close */}
      <div className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto relative`}>
        
        {/* Close button - only this closes the modal */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          ✕
        </button>

        <div className="pr-6">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            📢 Send Notification
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Notification Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notification Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {types.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNotificationType(type.value)}
                  className={`p-2 rounded-lg border-2 transition ${
                    notificationType === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{type.icon}</div>
                  <div className="text-xs">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Send to
            </label>
            <div className="grid grid-cols-3 gap-2">
              {targets.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={`p-3 rounded-lg border-2 transition ${
                    target === t.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl">{t.icon}</div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Title
            </label>
            <input
              type="text"
              placeholder="e.g., New Course Available!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength="100"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
              }`}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {title.length}/100
            </div>
          </div>

          {/* Message */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Message
            </label>
            <textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              maxLength="500"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
              }`}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {message.length}/500
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-lg border-2 ${getPreviewClass()}`}>
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title || 'Your Title Here'}
            </div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {message || 'Your message will appear here...'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Will be sent to: {targets.find(t => t.value === target)?.label}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 font-semibold"
            >
              {sending ? '📤 Sending...' : '📨 Send Notification'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSendNotification;