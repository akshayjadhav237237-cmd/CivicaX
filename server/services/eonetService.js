/**
 * eonetService.js — NASA EONET Natural Event Poller
 * Polls with NO API key required. Runs every 15 minutes.
 * Detects floods, wildfires, storms, landslides.
 * Stores to satellite_events table and emits WebSocket events.
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50';
const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// Map EONET categories to our severity levels
function mapCategoryToSeverity(categories = [], closed) {
  if (closed) return 'low';
  const cats = categories.map(c => c.id?.toLowerCase() || '');
  if (cats.some(c => c.includes('wildfires') || c.includes('severeStorms'))) return 'high';
  if (cats.some(c => c.includes('floods') || c.includes('landslides'))) return 'high';
  if (cats.some(c => c.includes('volcano'))) return 'critical';
  return 'medium';
}

function getCategoryEventType(categories = []) {
  const cat = categories[0]?.id?.toLowerCase() || 'other';
  if (cat.includes('fire')) return 'wildfire';
  if (cat.includes('flood')) return 'flood';
  if (cat.includes('storm')) return 'severe_storm';
  if (cat.includes('landslide')) return 'landslide';
  if (cat.includes('volcano')) return 'volcanic';
  if (cat.includes('drought')) return 'drought';
  if (cat.includes('ice')) return 'sea_ice';
  return 'natural_event';
}

// Build a situational description from event data
function buildSituationalDesc(event, eventType, lat, lng) {
  const title = event.title || 'Natural event';
  const srcLabel = event.sources?.map(s => s.id).join(', ') || 'NASA EONET';
  const geo = (lat && lng) ? `at coordinates ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E` : '';
  const templates = {
    wildfire: `🔥 Active wildfire detected: "${title}" ${geo}. Monitored via ${srcLabel}. Wind-driven spread possible. Check local advisories and evacuation routes. Population within the fire perimeter should evacuate immediately.`,
    flood: `🌊 Flood event active: "${title}" ${geo}. Monitored via ${srcLabel}. Downstream areas are at elevated risk. Citizens should avoid low-lying areas and move to high ground. Emergency shelters are being activated.`,
    severe_storm: `⛈️ Severe storm system: "${title}" ${geo}. Monitored via ${srcLabel}. High wind speeds and heavy rainfall expected. Seek shelter immediately and stay indoors. Waterways may overflow.`,
    landslide: `⛰️ Landslide risk: "${title}" ${geo}. Monitored via ${srcLabel}. Saturated soil conditions detected. Do not travel through ghat or hilly sections. Downhill structures should be evacuated as a precaution.`,
    volcanic: `🌋 Volcanic activity: "${title}" ${geo}. Monitored via ${srcLabel}. Ash fall and lava flow risk. Follow official exclusion zone advisories immediately.`,
    natural_event: `🛰️ Natural event monitored: "${title}" ${geo}. Data source: ${srcLabel}. Monitoring is ongoing. Citizens should follow local authority advisories.`
  };
  return templates[eventType] || templates.natural_event;
}

async function pollEONET(io) {
  try {
    logger.info('[EONET] Polling natural events...');
    const res = await fetch(EONET_URL, {
      headers: { 'User-Agent': 'CivicaX/1.0 (civic monitoring platform)' },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      logger.warn(`[EONET] HTTP ${res.status} — skipping this poll cycle`);
      return;
    }

    const data = await res.json();
    const events = data.events || [];
    logger.info(`[EONET] Received ${events.length} open events`);

    let newCount = 0;
    for (const event of events) {
      try {
        const sourceId = `EONET:${event.id}`;
        const existing = await prisma.satelliteEvent.findUnique({ where: { sourceEventId: sourceId } });
        if (existing) continue; // already stored

        // Extract coordinates from geometry
        let lat = null, lng = null;
        const geoms = event.geometry || [];
        if (geoms.length > 0) {
          const lastGeom = geoms[geoms.length - 1];
          if (lastGeom.type === 'Point' && lastGeom.coordinates) {
            [lng, lat] = lastGeom.coordinates; // GeoJSON is [lng, lat]
          } else if (lastGeom.type === 'Polygon' && lastGeom.coordinates?.[0]) {
            const firstPt = lastGeom.coordinates[0][0];
            [lng, lat] = firstPt;
          }
        }

        const eventType = getCategoryEventType(event.categories);
        const severity = mapCategoryToSeverity(event.categories, event.closed);
        const desc = buildSituationalDesc(event, eventType, lat, lng);

        const created = await prisma.satelliteEvent.create({
          data: {
            source: 'EONET',
            eventType,
            title: event.title,
            description: event.description || 'No additional description available.',
            latitude: lat,
            longitude: lng,
            severity,
            rawData: event,
            situationalDesc: desc,
            sourceEventId: sourceId,
            detectedAt: event.geometry?.[0]?.date
              ? new Date(event.geometry[0].date)
              : new Date(),
            isActive: !event.closed,
          }
        });

        newCount++;

        // Emit WebSocket event to all connected clients
        if (io && (severity === 'high' || severity === 'critical')) {
          io.emit('satellite:new-event', {
            id: created.id,
            source: 'EONET',
            eventType,
            title: event.title,
            severity,
            lat,
            lng,
            situationalDesc: desc,
            detectedAt: created.detectedAt,
          });
        }
      } catch (eventErr) {
        logger.error(`[EONET] Error saving event ${event.id}:`, eventErr.message);
      }
    }

    if (newCount > 0) {
      logger.info(`[EONET] ✅ Saved ${newCount} new events to database`);
    } else {
      logger.info('[EONET] No new events this cycle');
    }
  } catch (err) {
    logger.error('[EONET] Poll error:', err.message);
  }
}

function startEONETPoller(io) {
  logger.info('[EONET] Starting poller (15-min interval, no key required)');
  // Run immediately on start, then on interval
  pollEONET(io);
  const interval = setInterval(() => pollEONET(io), POLL_INTERVAL_MS);
  return interval;
}

module.exports = { startEONETPoller, pollEONET };
