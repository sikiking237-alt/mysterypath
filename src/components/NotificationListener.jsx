import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import createSocket from '../utils/socketClient';
import { notifyUser } from '../utils/notificationToast.jsx';

const NotificationListener = () => {
  const socketRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const pollForNew = async () => {
      try {
        const res = await fetch('/api/notifications/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Gracefully handle different HTTP error statuses
          if (res.status === 401) {
            // Unauthorized - token might be expired or invalid.
            // Consider logging the user out or refreshing the token.
            console.error('Notification polling failed: Unauthorized. Stopping polling.');
            clearInterval(pollInterval); // Stop polling
            return;
          }
          // For other errors (like 5xx), we might want to log it but keep polling.
          console.error(`Notification polling failed with status: ${res.status}`);
          return;
        }
        const notifications = await res.json();
        if (!initializedRef.current) {
          notifications.forEach((n) => seenIdsRef.current.add(n.id));
          initializedRef.current = true;
          return;
        }
        notifications
          .filter((n) => !n.is_read && !seenIdsRef.current.has(n.id))
          .forEach((n) => {
            seenIdsRef.current.add(n.id);
            notifyUser(n);
          });
      } catch (error) {
        // This will catch network errors or JSON parsing errors.
        // It's still reasonable to ignore these for a polling mechanism,
        // but logging them during development is a good idea.
        console.warn('Notification polling transient error:', error);
      }
    };

    pollForNew();
    const pollInterval = setInterval(pollForNew, 15000);

    // Enable Socket.IO with the correct backend URL
    socketRef.current = createSocket({
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: { token },
    });

    socketRef.current.on('connect_error', (err) => {
      // Handle connection errors, e.g., show a status indicator to the user
      console.error('Socket.IO connection error:', err.message);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket.IO server error:', err.message);
    });

    socketRef.current.on('new_notification', (notif) => {
      if (!notif?.id || seenIdsRef.current.has(notif.id)) return;
      seenIdsRef.current.add(notif.id);
      notifyUser(notif);
    });

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return null;
};

export default NotificationListener;
