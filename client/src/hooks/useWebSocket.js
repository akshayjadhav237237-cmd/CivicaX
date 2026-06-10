import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { useNotificationStore } from '../stores/notificationStore';
import toast from 'react-hot-toast';

const WS_URL = (import.meta.env.VITE_WS_URL || 'https://civicax-production.up.railway.app').trim();

export function useWebSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const MAX_RECONNECT_DELAY = 30000;
  
  const user = useAuthStore((state) => state.user);
  const addAlert = useAlertStore((state) => state.addAlert);
  const updateAlert = useAlertStore((state) => state.updateAlert);
  const updateZoneLevel = useAlertStore((state) => state.updateZoneLevel);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(WS_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
      randomizationFactor: 0.5,
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Join proper rooms
      if (user) {
        socket.emit('join:user', user.id);
        if (['government', 'admin'].includes(user.role)) {
          socket.emit('join:government');
        }
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      setReconnectAttempts(attempt);
    });

    // Handle incoming events
    socket.on('alert:new', (alert) => {
      addAlert(alert);
      toast.error(`NEW ALERT: ${alert.title}`, {
        duration: 8000,
        icon: '🚨',
        style: { background: '#EF4444', color: '#fff' },
      });
    });

    socket.on('alert:updated', (alert) => {
      updateAlert(alert);
      toast(`Alert Updated: ${alert.title}`, { icon: '⚠️' });
    });

    socket.on('zone:status-change', (data) => {
      if (data.type === 'safe_zone_status') {
        const sz = data.safeZone;
        toast.success(`Relief Camp Update: ${sz.name} is now ${sz.status}`, { icon: '⛺' });
      } else if (data.type === 'threat_level') {
        updateZoneLevel(data.zoneId, data.level);
        toast(`Rain Warning: Zone upgraded to ${data.level.toUpperCase()}`, { 
          icon: '🌧️',
          style: { border: data.level === 'red' ? '2px solid #EF4444' : 'none' }
        });
      }
    });

    socket.on('safety:urgent', (report) => {
      if (['government', 'admin'].includes(user?.role)) {
        toast.error(`URGENT SAFETY REPORT: ${report.incidentType.replace('_', ' ').toUpperCase()}`, {
          duration: 10000,
          icon: '🔴',
          style: { outline: '2px solid #DC2626' }
        });
      }
    });

    socket.on('notification:new', (notification) => {
      addNotification(notification);
      toast(notification.title, { icon: '🔔' });
    });

    return socket;
  }, [user, addAlert, updateAlert, updateZoneLevel, addNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const socket = connect();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [connect]);

  // eslint-disable-next-line react-hooks/refs
  return { isConnected, reconnectAttempts, socket: socketRef.current };
}
