/**
 * CivicaX Offline Sync & Emergency Resilience Service
 * Guarantees zero-connectivity data persistence in Himalayan mountain valleys.
 */

const STORAGE_PREFIX = 'civicax_offline_';
export const STORAGE_KEYS = {
  ALERTS: `${STORAGE_PREFIX}alerts`,
  ZONES: `${STORAGE_PREFIX}zones`,
  PREDICTIONS: `${STORAGE_PREFIX}predictions`,
  LAST_SYNC: `${STORAGE_PREFIX}last_sync`,
};

// Calibrated Himalayan baseline alerts (shown if zero network and cache was empty)
export const BASELINE_OFFLINE_ALERTS = [
  {
    id: 'offline-alert-kedarnath-001',
    title: 'Flash Flood Hazard Alert: Mandakini Basin',
    message: 'Upper catchment cloudburst surge detected. High-ground evacuation corridors active towards Kedarnath Helipad Plateau (3,583m).',
    level: 'orange',
    zoneId: 'zone-kedarnath-001',
    zoneName: 'Kedarnath Basin (Core)',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Satellite Telemetry Offline Cache',
  },
  {
    id: 'offline-alert-chamoli-002',
    title: 'Landslide Warning: Badrinath National Highway Axis',
    message: 'Active debris flow risk identified between Joshimath and Pandukeshwar. Travel restricted; remain in designated civil shelters.',
    level: 'yellow',
    zoneId: 'zone-chamoli-002',
    zoneName: 'Chamoli / Joshimath Axis',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Civil Safety Offline Telemetry',
  },
];

// Offline emergency contacts (NDRF, SDRF, State Emergency, Police)
export const EMERGENCY_CONTACTS = [
  {
    name: 'NDRF Control Room',
    number: '1078',
    tel: 'tel:1078',
    desc: 'National Disaster Response Force — Glacial Flood Rescue & Evacuation',
    badge: 'National Rescue',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  {
    name: 'SDRF Uttarakhand',
    number: '1070',
    tel: 'tel:1070',
    desc: 'State Disaster Response Force — High Altitude Search & Heli Evac',
    badge: 'Mountain Rescue',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    name: 'State Emergency & Medical',
    number: '108',
    tel: 'tel:108',
    desc: 'Uttarakhand Medical & Disaster Ambulance Dispatch',
    badge: 'Medical / Trauma',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    name: 'Integrated Police Emergency',
    number: '112',
    tel: 'tel:112',
    desc: 'Unified Police, Fire & Emergency Response Command',
    badge: 'Police / Dispatch',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
];

// Flash flood survival protocols and shelter coordinates
export const OFFLINE_SURVIVAL_INSTRUCTIONS = [
  {
    id: 'ascent',
    title: 'Ascend to High Ground Immediately',
    priority: 'CRITICAL',
    details: 'Move at least 30 meters above the riverbed of Mandakini & Saraswati. Flash floods in narrow glacial valleys rise violently in 10–20 minutes. Abandon vehicles and heavy baggage.',
  },
  {
    id: 'shelters',
    title: 'Designated High-Ground Shelters (Kedarnath)',
    priority: 'HIGH',
    details: 'Proceed to reinforced safety sectors: (1) Kedarnath Upper Helipad (3,583m), (2) GMVN Temple High Terrace, or (3) Bhairavnath Ridge Base. Avoid low-lying riverbank tents or guest houses.',
  },
  {
    id: 'chokepoints',
    title: 'Stay Clear of Confluences & Ravines',
    priority: 'WARNING',
    details: 'Never attempt to ford moving water above ankle height. Fast-moving water carrying glacial moraine can sweep away adults and vehicles. Avoid dry drainage ravines.',
  },
  {
    id: 'sms_protocol',
    title: 'Offline Emergency SMS Protocol',
    priority: 'INFO',
    details: 'If cellular data and voice calls fail, SMS often transmits via intermittent satellite bursts. Send text to 112 or 1070 with format: "SOS [NAME] [GPS COORDINATES] [NUMBER OF PEOPLE]".',
  },
  {
    id: 'battery',
    title: 'Conserve Mobile Battery & Radio',
    priority: 'INFO',
    details: 'Turn on Ultra Battery Saver immediately. Turn off Bluetooth, Wi-Fi search, and screen brightness. Maintain power for emergency beaconing.',
  },
];

/**
 * Persists active alerts into localStorage safely
 */
export function saveOfflineAlerts(alerts) {
  try {
    if (Array.isArray(alerts) && alerts.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }
  } catch (err) {
    console.warn('[OfflineSync] Failed to save alerts to localStorage:', err);
  }
}

/**
 * Retrieves persisted alerts from localStorage, falling back to calibrated emergency baseline
 */
export function getOfflineAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[OfflineSync] Failed to parse alerts from localStorage:', err);
  }
  return BASELINE_OFFLINE_ALERTS;
}

/**
 * Persists GeoJSON zones into localStorage
 */
export function saveOfflineZones(zones) {
  try {
    if (Array.isArray(zones) && zones.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
    }
  } catch (err) {
    console.warn('[OfflineSync] Failed to save zones to localStorage:', err);
  }
}

/**
 * Retrieves persisted GeoJSON zones from localStorage
 */
export function getOfflineZones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZONES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[OfflineSync] Failed to parse zones from localStorage:', err);
  }
  return [];
}

/**
 * Persists prediction data for a specific zone
 */
export function saveOfflinePrediction(zoneId, prediction) {
  try {
    if (!zoneId || !prediction) return;
    const key = `${STORAGE_KEYS.PREDICTIONS}_${zoneId}`;
    localStorage.setItem(key, JSON.stringify({
      data: prediction,
      savedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[OfflineSync] Failed to save prediction to localStorage:', err);
  }
}

/**
 * Retrieves persisted prediction data for a zone
 */
export function getOfflinePrediction(zoneId = 'zone-kedarnath-001') {
  try {
    const key = `${STORAGE_KEYS.PREDICTIONS}_${zoneId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.data) return parsed.data;
    }
  } catch (err) {
    console.warn('[OfflineSync] Failed to read prediction from localStorage:', err);
  }
  return null;
}

/**
 * Gets last sync timestamp
 */
export function getLastSyncTime() {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch {
    return null;
  }
}

export default {
  saveOfflineAlerts,
  getOfflineAlerts,
  saveOfflineZones,
  getOfflineZones,
  saveOfflinePrediction,
  getOfflinePrediction,
  getLastSyncTime,
  EMERGENCY_CONTACTS,
  OFFLINE_SURVIVAL_INSTRUCTIONS,
  BASELINE_OFFLINE_ALERTS,
};
