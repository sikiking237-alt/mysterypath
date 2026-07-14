import React from 'react';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  success: 'border-green-500 bg-green-50 dark:bg-green-900/30',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
  error: 'border-red-500 bg-red-50 dark:bg-red-900/30',
  info: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30',
};

const TYPE_ICONS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: '📢',
};

export function playNotificationSound() {
  const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
  if (!soundEnabled) return;
  const audio = new Audio('/notification-sound.mp3');
  audio.play().catch(() => {});
}

export function showBrowserNotification(notif) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  const browserNotif = new Notification(notif.title || 'New notification', {
    body: notif.message,
    icon: '/favicon.ico',
  });
  browserNotif.onclick = () => {
    window.focus();
    browserNotif.close();
  };
}

export function showNotificationToast(notif) {
  const type = notif.type || 'info';
  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  const icon = TYPE_ICONS[type] || TYPE_ICONS.info;

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full shadow-lg rounded-xl pointer-events-auto border-l-4 ${style} p-4 flex gap-3 z-[99999]`}
        onClick={() => toast.dismiss(t.id)}
      >
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {notif.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
            {notif.message}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
          className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
        >
          ✕
        </button>
      </div>
    ),
    { duration: 6000, position: 'top-right', style: { zIndex: 99999 } }
  );
}

export function notifyUser(notif) {
  showNotificationToast(notif);
  playNotificationSound();
  showBrowserNotification(notif);
  window.dispatchEvent(new CustomEvent('notification-received', { detail: notif }));
}
