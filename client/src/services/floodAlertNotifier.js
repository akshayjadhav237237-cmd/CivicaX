/**
 * floodAlertNotifier.js
 * ---------------------
 * Pure JS browser notification service — no React imports.
 * Call initFloodAlertNotifier(socket) on app mount.
 * Returns a cleanup function that removes the socket listener.
 */

const SEVERITY = { green: 0, yellow: 1, orange: 2, red: 3 };

export function initFloodAlertNotifier(socket) {
  // Guard: socket must be provided
  if (!socket) return () => {};

  // Request notification permission if not yet decided
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Track last known alert level per zone to detect worsening
  const lastAlertLevel = new Map(); // zoneId → alertLevel

  const handler = (prediction) => {
    const {
      zoneId,
      zoneName,
      alertLevel,
      riverStatus,
      summary,
    } = prediction ?? {};

    // Guard: must have the minimum fields we need
    if (!zoneId || !alertLevel) return;

    // Skip if the level isn't in our severity map (unknown value)
    if (SEVERITY[alertLevel] === undefined) return;

    const prev = lastAlertLevel.get(zoneId);
    const isWorse =
      prev === undefined || SEVERITY[alertLevel] > SEVERITY[prev];

    // Always record the latest level regardless of whether we notify
    lastAlertLevel.set(zoneId, alertLevel);

    // Only fire a notification when the situation is worsening
    if (!isWorse) return;

    // Bail out if the browser doesn't support notifications or permission denied
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Fire a general flood alert for orange or red levels
    if (alertLevel === 'orange' || alertLevel === 'red') {
      try {
        new Notification('⚠️ CivicaX Flood Alert', {
          body: summary ?? `Alert level ${alertLevel.toUpperCase()} in ${zoneName ?? zoneId}.`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: zoneId,           // prevents duplicate notifications for same zone
          requireInteraction: true,
        });
      } catch (err) {
        // Notification constructor can throw in some environments — fail silently
        console.warn('[FloodAlertNotifier] Failed to create alert notification:', err);
      }
    }

    // Fire an evacuation notification when red + flood arriving within 15 minutes
    if (alertLevel === 'red' && (riverStatus?.etaMinutes ?? Infinity) <= 15) {
      setTimeout(() => {
        try {
          new Notification('🚨 EVACUATE NOW — ' + (zoneName ?? zoneId), {
            body: `Flood water arriving in ${Math.round(riverStatus.etaMinutes)} minutes. Move to higher ground immediately.`,
            requireInteraction: true,
            tag: zoneId + '-evacuate',
          });
        } catch (err) {
          console.warn('[FloodAlertNotifier] Failed to create evacuate notification:', err);
        }
      }, 2000); // slight delay so two notifications don't stack instantly
    }
  };

  socket.on('zone:flood-prediction', handler);

  // Return cleanup function
  return () => {
    socket.off('zone:flood-prediction', handler);
  };
}
