import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : (import.meta.env.VITE_SOCKET_URL || window.location.origin);

export const createSocket = (options = {}) => {
  return io(SOCKET_SERVER_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: false,
    ...options,
  });
};

export default createSocket;
