import React, { createContext, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import createSocket from '../utils/socketClient';

// Create a single, persistent socket instance that will be shared across the app.
// 'autoConnect: false' is crucial to prevent it from connecting before we have a token.
const socket = createSocket();
const SocketContext = createContext(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      // If we have a token and the socket isn't already connected, connect it.
      if (!socket.connected) {
        socket.auth = { token };
        socket.connect();
        console.log('🔌 Attempting to connect global socket...');
      }
    } else {
      // If there's no token (e.g., user logged out), disconnect the socket.
      if (socket.connected) {
        socket.disconnect();
        console.log('🔌 Disconnecting global socket (no token).');
      }
    }

    // Set up listeners for debugging. These are safe to re-add on re-renders.
    socket.on('connect', () => console.log('✅ Global socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('❌ Global socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('❌ Global socket connection error:', err.message));

    // This cleanup function only removes the listeners, it does not disconnect the socket,
    // which is key to preventing the race condition in Strict Mode.
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};