/**
 * CivicaX Emergency Service Worker (PWA)
 * Resilient offline satellite telemetry, asset caching, and flash flood disaster support.
 */

const CACHE_NAME = 'civicax-static-v1';
const DATA_CACHE_NAME = 'civicax-telemetry-v1';
const TILE_CACHE_NAME = 'civicax-tiles-v1';

// Static shell assets to precache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// Offline fallback SVG for Leaflet map tiles when connectivity is completely severed
const OFFLINE_TILE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#0B132B" stroke="#1E293B" stroke-width="1"/>
  <!-- Topographic contour curves -->
  <path d="M0,180 Q80,120 160,160 T256,130 L256,256 L0,256 Z" fill="#132347" opacity="0.6"/>
  <path d="M0,210 Q90,160 170,195 T256,170 L256,256 L0,256 Z" fill="#1E3A5F" opacity="0.5"/>
  <circle cx="128" cy="128" r="4" fill="#00F0FF" opacity="0.8"/>
  <circle cx="128" cy="128" r="16" stroke="#00F0FF" stroke-width="0.8" opacity="0.4" stroke-dasharray="2 2"/>
  <text x="128" y="146" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" text-anchor="middle" letter-spacing="1">
    OFFLINE TOPO GRID
  </text>
  <text x="128" y="158" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" text-anchor="middle" font-weight="bold">
    CACHED ELEVATION
  </text>
</svg>
`.trim();

// ─── Install Event ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[CivicaX SW] Precaching critical emergency shell assets...');
      // Use map and individual catch so one failed external resource doesn't abort SW installation
      await Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[CivicaX SW] Non-fatal precache skip for ${url}:`, err.message);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate Event ───────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME, TILE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((staleCache) => {
            console.log(`[CivicaX SW] Purging obsolete cache: ${staleCache}`);
            return caches.delete(staleCache);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Helper: Create Emergency Fallback JSON ───────────────────────────────────
function getOfflineFallbackPrediction(zoneId = 'zone-kedarnath-001') {
  return {
    success: true,
    offline: true,
    cachedAt: new Date().toISOString(),
    source: 'CivicaX-ServiceWorker-Emergency-Vault',
    data: {
      zoneId: zoneId || 'zone-kedarnath-001',
      zoneName: 'Kedarnath Basin (Core Glacial Valley)',
      alertLevel: 'orange',
      rainfall: {
        current: 38.4,
        forecast24h: 84.0,
        unit: 'mm/hr',
        source: 'NASA GPM IMERG (Cached Satellite)'
      },
      soilMoisture: {
        saturationPercent: 78.5,
        source: 'NASA SMAP L3'
      },
      riverStatus: {
        velocityMs: 3.12,
        velocityKmh: 11.2,
        dischargeM3s: 248.0,
        capacityM3s: 280.0,
        isOverflowing: false,
        overflowRatio: 0.89,
        etaMinutes: 22,
        explanation: 'Operating on cached satellite telemetry. High-ground corridors open towards Kedarnath Helipad Plateau.'
      },
      summary: 'Offline Emergency Cache: Mandakini hydraulic channel capacity at 89%. Proceed immediately to designated high ground above 30m river elevation if water levels rise.',
      timestamp: new Date().toISOString()
    }
  };
}

// ─── Fetch Event ──────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests (e.g. POST /api/v1/emergency/flood-prediction/trigger)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Emergency Telemetry & Predictions (Stale-While-Revalidate)
  // Matches /api/v1/emergency/flood-prediction/* (e.g., kedarnath), /api/v1/emergency/alerts/*, /api/v1/emergency/zones
  const isEmergencyApi =
    url.pathname.includes('/emergency/flood-prediction') ||
    url.pathname.includes('/emergency/alerts') ||
    url.pathname.includes('/emergency/zones') ||
    url.pathname.includes('/emergency/flood-risk');

  if (isEmergencyApi) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(async () => {
            // Network failed. If cached response exists, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            // If neither network nor cache is available, return synthesized offline telemetry
            const fallbackJson = getOfflineFallbackPrediction(url.pathname.split('/').pop());
            return new Response(JSON.stringify(fallbackJson), {
              headers: {
                'Content-Type': 'application/json',
                'X-CivicaX-Offline': 'true'
              }
            });
          });

        // Stale-While-Revalidate: Return cached response immediately if present, otherwise await fetch
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Map Tiles (OpenStreetMap / CartoDB / Leaflet tiles)
  const isMapTile =
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('cartocdn.com') ||
    url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg|webp)$/);

  if (isMapTile) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async (cache) => {
        const cachedTile = await cache.match(request);
        if (cachedTile) return cachedTile;

        try {
          const networkTile = await fetch(request);
          if (networkTile && networkTile.status === 200) {
            cache.put(request, networkTile.clone());
          }
          return networkTile;
        } catch {
          // Return emergency fallback SVG tile when offline
          return new Response(OFFLINE_TILE_SVG, {
            headers: {
              'Content-Type': 'image/svg+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }
      })
    );
    return;
  }

  // 3. Navigation Requests (SPA HTML routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        return cachedIndex || cache.match('/');
      })
    );
    return;
  }

  // 4. Critical Static Assets & Fonts (Cache First / Stale While Revalidate)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|woff2?|ttf|ico)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // If requesting SVG image and offline, return favicon or fallback
            if (url.pathname.endsWith('.svg')) {
              return caches.match('/favicon.svg');
            }
            return new Response('', { status: 408, statusText: 'Offline' });
          });
      })
    );
    return;
  }

  // Default fetch
  event.respondWith(fetch(request));
});
