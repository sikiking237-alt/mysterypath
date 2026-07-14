import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const AdminNotificationSender = ({ showNotification }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [targetUserId, setTargetUserId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showNotification('Please enter a message to send.', 'error');
      return;
    }
    if (!targetUserId.trim()) {
      showNotification('Please enter a Target User ID.', 'error');
      return;
    }

    setIsSending(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message, type, targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification.');
      }

      showNotification(`✅ Notification sent successfully to user ${targetUserId}!`, 'success');
      setMessage(''); // Clear message on success
      setTargetUserId(''); // Clear target user on success
    } catch (error) {
      console.error('Send notification error:', error);
      showNotification(`❌ ${error.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send Notification</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Send a real-time notification to a specific user by their ID.
      </p>
      <form onSubmit={handleSendNotification}>
        <div className="space-y-4">
          <div>
            <label htmlFor="notification-target" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Target User ID
            </label>
            <input
              id="notification-target"
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Enter the unique ID of the user"
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="notification-message" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Message
            </label>
            <textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your notification message here..."
              rows="3"
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="notification-type" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notification Type
            </label>
            <select
              id="notification-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSending || !message.trim() || !targetUserId.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send to User</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminNotificationSender;