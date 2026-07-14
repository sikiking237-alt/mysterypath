import React, { useState, useEffect, useCallback } from "react";

const TYPE_ICONS = {
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "📢",
  urgent: "🚨",
};

const NotificationBell = ({ darkMode, collapsed = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState(null);
  const [previousNotificationIds, setPreviousNotificationIds] = useState(new Set());
  const token = localStorage.getItem("token");

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch("/api/notifications/my", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/notifications/unread/count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data);
        
        // Check for new warning or urgent notifications
        const currentIds = new Set(data.map(n => n.id));
        const newNotifications = data.filter(n => 
          !previousNotificationIds.has(n.id) && 
          (n.type === 'warning' || n.type === 'urgent' || n.type === 'error') &&
          !n.is_read
        );
        
        if (newNotifications.length > 0) {
          setPopupNotification(newNotifications[0]);
          // Auto-dismiss after 5 seconds
          setTimeout(() => setPopupNotification(null), 5000);
        }
        
        setPreviousNotificationIds(currentIds);
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.count ?? data.unread_count ?? 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Prevent infinite loops by not setting state on error
    }
  }, [token, previousNotificationIds]);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    const onNew = () => fetchNotifications();
    window.addEventListener('notification-received', onNew);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-received', onNew);
    };
  }, [token, fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  const markAsRead = async (notifId) => {
    await fetch(`/api/notifications/mark-read/${notifId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
        className={`relative p-2 rounded-lg transition ${
          collapsed ? 'w-full flex justify-center' : ''
        } ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-[99998]" onClick={() => setShowDropdown(false)} />
          <div
            className={`absolute ${collapsed ? 'left-full ml-2 top-0' : 'right-0 mt-2'} w-80 md:w-96 rounded-xl shadow-xl z-[99999] overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border`}
          >
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
              <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notifications
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                    }}
                    className={`w-full text-left p-3 border-b transition ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                    } ${!notif.is_read ? (darkMode ? 'bg-gray-700/50' : 'bg-purple-50') : ''}`}
                  >
                    <div className="flex gap-2">
                      <span className="text-lg shrink-0">{TYPE_ICONS[notif.type] || TYPE_ICONS.info}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {notif.title}
                        </div>
                        <div className={`text-sm mt-1 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {notif.message}
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {notif.created_at
                            ? new Date(notif.created_at).toLocaleString()
                            : 'Just now'}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Urgent/Warning Notification Popup */}
      {popupNotification && (
        <div className="fixed top-20 right-4 z-[200] max-w-sm animate-slide-in-right">
          <div className={`rounded-xl shadow-2xl border-2 ${
            popupNotification.type === 'urgent' 
              ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500' 
              : popupNotification.type === 'error'
              ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-400'
              : 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-500'
          }`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`text-3xl animate-pulse ${
                  popupNotification.type === 'urgent' || popupNotification.type === 'error' ? 'animate-bounce' : ''
                }`}>
                  {TYPE_ICONS[popupNotification.type] || TYPE_ICONS.warning}
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-lg ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {popupNotification.type === 'urgent' ? '🚨 URGENT' : popupNotification.type === 'error' ? '❌ ERROR' : '⚠️ WARNING'}
                  </div>
                  <div className={`font-semibold mt-1 ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-yellow-600 dark:text-yellow-300'
                  }`}>
                    {popupNotification.title}
                  </div>
                  <div className={`text-sm mt-2 ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'text-red-600 dark:text-red-200'
                      : 'text-yellow-600 dark:text-yellow-200'
                  }`}>
                    {popupNotification.message}
                  </div>
                </div>
                <button
                  onClick={() => setPopupNotification(null)}
                  className={`p-1 rounded-full ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'hover:bg-red-200 dark:hover:bg-red-800'
                      : 'hover:bg-yellow-200 dark:hover:bg-yellow-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    markAsRead(popupNotification.id);
                    setPopupNotification(null);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => setPopupNotification(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    popupNotification.type === 'urgent' || popupNotification.type === 'error'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-300'
                  }`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
