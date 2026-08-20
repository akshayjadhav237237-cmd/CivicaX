import { create } from 'zustand';
import api from '../services/api';

const DEFAULT_NOTIFICATIONS = [
  { id: 'notif-1', title: '🚨 Red Alert: Chorabari Outflow Surge', body: 'Immediate mandatory evacuation advisory issued for Kedarnath Temple basin.', isRead: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'notif-2', title: '🛣️ Pothole Work Dispatched (CIV-2026-081)', body: 'Roads & Infrastructure team assigned for rapid asphalt cold-mix compaction.', isRead: false, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'notif-3', title: '⚠️ Landslide Advisory: Rambara Sector', body: 'Soil saturation reached 82.5%. Trekking route diverted via high ridge path.', isRead: true, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
];

export const useNotificationStore = create((set, get) => ({
  notifications: DEFAULT_NOTIFICATIONS,
  unreadCount: 2,
  isLoading: false,
  isOpen: false,

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  closeDrawer: () => set({ isOpen: false }),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/notifications');
      const payload = res.data?.data || res.data || {};
      let list = [];
      if (Array.isArray(payload.notifications)) {
        list = payload.notifications;
      } else if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else {
        list = DEFAULT_NOTIFICATIONS;
      }
      const count = typeof payload.unreadCount === 'number' ? payload.unreadCount : list.filter(n => !n.isRead).length;
      set({ notifications: list, unreadCount: count });
    } catch (err) {
      console.warn('Failed to fetch notifications, using default notifications:', err.message);
      set({ notifications: DEFAULT_NOTIFICATIONS, unreadCount: DEFAULT_NOTIFICATIONS.filter(n => !n.isRead).length });
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      const current = Array.isArray(state.notifications) ? state.notifications : [];
      return {
        notifications: [notification, ...current],
        unreadCount: (state.unreadCount || 0) + 1,
      };
    });
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`).catch(() => {});
      set((state) => {
        const current = Array.isArray(state.notifications) ? state.notifications : [];
        return {
          notifications: current.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, (state.unreadCount || 1) - 1),
        };
      });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all').catch(() => {});
      set((state) => {
        const current = Array.isArray(state.notifications) ? state.notifications : [];
        return {
          notifications: current.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  },
}));
