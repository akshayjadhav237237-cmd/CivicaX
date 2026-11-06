import { create } from 'zustand';
import api from '../services/api';
import {
  saveOfflineAlerts,
  getOfflineAlerts,
  saveOfflineZones,
  getOfflineZones,
} from '../services/offlineSync';

export const useAlertStore = create((set, get) => ({
  zones: getOfflineZones() || [],
  activeAlerts: getOfflineAlerts() || [],
  isLoadingZones: false,
  isLoadingAlerts: false,

  fetchZones: async () => {
    try {
      set({ isLoadingZones: true });
      const { data } = await api.get('/emergency/zones');
      // Response shape: { success, data: { type: 'FeatureCollection', features: [...] } }
      const features = data?.data?.features ?? data?.features ?? [];
      const validFeatures = Array.isArray(features) ? features : [];
      if (validFeatures.length > 0) {
        saveOfflineZones(validFeatures);
        set({ zones: validFeatures });
      } else {
        // Retain offline cached zones if API returns empty
        const cached = getOfflineZones();
        set({ zones: cached.length > 0 ? cached : [] });
      }
    } catch (err) {
      console.warn('[AlertStore] Failed to fetch zones from network, using offline cache:', err.message);
      const cached = getOfflineZones();
      set({ zones: cached });
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
      const validAlerts = Array.isArray(alerts) ? alerts : [];
      if (validAlerts.length > 0) {
        saveOfflineAlerts(validAlerts);
        set({ activeAlerts: validAlerts });
      } else {
        // Fallback to offline cached alerts if response empty
        const cached = getOfflineAlerts();
        set({ activeAlerts: cached });
      }
    } catch (err) {
      console.warn('[AlertStore] Network fetch failed, activating offline persisted alerts:', err.message);
      const cached = getOfflineAlerts();
      set({ activeAlerts: cached });
    } finally {
      set({ isLoadingAlerts: false });
    }
  },

  addAlert: (alert) => {
    set((state) => {
      const updated = [alert, ...state.activeAlerts].sort((a, b) => {
        const levelOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
        return (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4);
      });
      saveOfflineAlerts(updated);
      return { activeAlerts: updated };
    });
  },

  updateAlert: (updatedAlert) => {
    set((state) => {
      const updated = state.activeAlerts
        .map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
        .filter((a) => a.isActive) // remove if deactivated
        .sort((a, b) => {
          const levelOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
          return (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4);
        });
      saveOfflineAlerts(updated);
      return { activeAlerts: updated };
    });
  },

  updateZoneLevel: (zoneId, level) => {
    set((state) => {
      const updated = state.zones.map((zone) => {
        if (zone.properties?.id === zoneId) {
          return {
            ...zone,
            properties: { ...zone.properties, level },
          };
        }
        return zone;
      });
      saveOfflineZones(updated);
      return { zones: updated };
    });
  },
}));
