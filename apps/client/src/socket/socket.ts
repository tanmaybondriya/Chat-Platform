import { io, Socket } from 'socket.io-client';
import { authStore } from '../store/auth.store';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  const token = authStore.getToken();

  if (!socket) {
    socket = io('http://localhost:5000', {
      auth: { token }, //send JWT in handshake
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('socket connected', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
