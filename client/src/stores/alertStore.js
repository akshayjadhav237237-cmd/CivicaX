import { create } from 'zustand';
import api from '../services/api';

export const useAlertStore = create((set, get) => ({
  zones: [],
  activeAlerts: [],
  isLoadingZones: true,
  isLoadingAlerts: true,

  fetchZones: async () => {
    try {
      set({ isLoadingZones: true });
      const { data } = await api.get('/emergency/zones');
      // Response shape: { success, data: { type: 'FeatureCollection', features: [...] } }
      const features = data?.data?.features ?? data?.features ?? [];
      set({ zones: Array.isArray(features) ? features : [] });
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      set({ zones: [] });
    } finally {
      set({ isLoadingZones: false });
    }
  },

  fetchActiveAlerts: async () => {
    try {
      set({ isLoadingAlerts: true });
      const { data } = await api.get('/emergency/alerts/active');
      // Response shape: { success, data: [...] }
      const alerts = data?.data ?? data ?? [];
      set({ activeAlerts: Array.isArray(alerts) ? alerts : [] });
    } catch (err) {
      console.error('Failed to fetch active alerts:', err);
      set({ activeAlerts: [] });
    } finally {
      set({ isLoadingAlerts: false });
    }
  },

  addAlert: (alert) => {
    set((state) => ({
      activeAlerts: [alert, ...state.activeAlerts].sort((a, b) => {
        const levelOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
        return levelOrder[a.level] - levelOrder[b.level];
      }),
    }));
  },

  updateAlert: (updatedAlert) => {
    set((state) => ({
      activeAlerts: state.activeAlerts
        .map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
        .filter((a) => a.isActive) // remove if deactivated
        .sort((a, b) => {
          const levelOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
          return levelOrder[a.level] - levelOrder[b.level];
        }),
    }));
  },

  updateZoneLevel: (zoneId, level) => {
    set((state) => ({
      zones: state.zones.map((zone) => {
        if (zone.properties.id === zoneId) {
          return {
            ...zone,
            properties: { ...zone.properties, level },
          };
        }
        return zone;
      }),
    }));
  },
}));
