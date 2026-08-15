import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  toastNotification: { title: string; message: string } | null;
  clearToast: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ title: string; message: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Socket connected to server');

      if (user) {
        if (user.role === 'admin') {
          socketInstance.emit('join_admin');
        }
        socketInstance.emit('join_user', user.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('notification:new', (data: { title: string; message: string }) => {
      setToastNotification(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const clearToast = () => setToastNotification(null);

  return (
    <SocketContext.Provider value={{ socket, isConnected, toastNotification, clearToast }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
