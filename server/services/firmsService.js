/**
 * firmsService.js — NASA FIRMS Fire/Hotspot Data Poller
 * Requires NASA_FIRMS_MAP_KEY env variable (free at firms.modaps.eosdis.nasa.gov/api/map_key/)
 * If key not configured: sets status 'unconfigured' and skips polling.
 * Polls every 30 minutes.
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 30 * 60 * 1000;

// Maharashtra region bounding box
const AREA = 'world'; // FIRMS uses world or a bbox

let firmsConfigured = false;
let firmsMapKey = null;

function checkFIRMSConfig() {
  firmsMapKey = process.env.NASA_FIRMS_MAP_KEY;
  firmsConfigured = !!(firmsMapKey && firmsMapKey.trim().length > 0);
  if (!firmsConfigured) {
    logger.warn('[FIRMS] NASA_FIRMS_MAP_KEY not configured — fire data unavailable. Register free at https://firms.modaps.eosdis.nasa.gov/api/map_key/');
  } else {
    logger.info('[FIRMS] API key configured — fire data polling active');
  }
  return firmsConfigured;
}

// Parse FIRMS CSV format
function parseFIRMSCSV(csv) {
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  }).filter(row => row.latitude && row.longitude);
}

function mapFIRMSConfidenceToSeverity(confidence) {
  const c = (confidence || '').toLowerCase();
  if (c === 'h' || c === 'high' || Number(confidence) >= 80) return 'critical';
  if (c === 'n' || c === 'nominal' || Number(confidence) >= 50) return 'high';
  return 'medium';
}

async function pollFIRMS(io) {
  if (!firmsConfigured) return;

  try {
    logger.info('[FIRMS] Polling fire hotspots...');
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsMapKey}/VIIRS_SNPP_NRT/${AREA}/1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });

    if (!res.ok) {
      logger.warn(`[FIRMS] HTTP ${res.status} — check your MAP_KEY validity`);
      return;
    }

    const csv = await res.text();
    const hotspots = parseFIRMSCSV(csv);
    logger.info(`[FIRMS] Received ${hotspots.length} fire hotspots`);

    let newCount = 0;
    for (const spot of hotspots.slice(0, 50)) { // limit to 50 per cycle
      try {
        const lat = parseFloat(spot.latitude);
        const lng = parseFloat(spot.longitude);
        const acqDate = spot.acq_date || '';
        const acqTime = spot.acq_time || '0000';
        const sourceId = `FIRMS:${acqDate}:${acqTime}:${lat.toFixed(4)}:${lng.toFixed(4)}`;

        const existing = await prisma.satelliteEvent.findUnique({ where: { sourceEventId: sourceId } });
        if (existing) continue;

        const severity = mapFIRMSConfidenceToSeverity(spot.confidence);
        const brightness = parseFloat(spot.bright_ti4 || spot.brightness || '0');

        const created = await prisma.satelliteEvent.create({
          data: {
            source: 'FIRMS',
            eventType: 'wildfire',
            title: `Active Fire Hotspot — ${spot.satellite || 'VIIRS'} (${acqDate})`,
            description: `Fire hotspot detected with ${spot.confidence || 'nominal'} confidence. Brightness temperature: ${brightness.toFixed(1)}K. Satellite: ${spot.satellite || 'VIIRS SNPP'}.`,
            latitude: lat,
            longitude: lng,
            severity,
            rawData: spot,
            situationalDesc: `🔥 Satellite-detected active fire hotspot at (${lat.toFixed(3)}, ${lng.toFixed(3)}). Confidence: ${spot.confidence || 'nominal'}. Brightness: ${brightness.toFixed(0)}K. Detected by ${spot.satellite || 'VIIRS SNPP'} on ${acqDate}. Ground verification required before evacuation orders.`,
            sourceEventId: sourceId,
            detectedAt: acqDate ? new Date(`${acqDate} ${acqTime.slice(0,2)}:${acqTime.slice(2)}:00`) : new Date(),
            isActive: true,
          }
        });

        newCount++;

        if (io && severity === 'critical') {
          io.emit('satellite:new-event', {
            id: created.id,
            source: 'FIRMS',
            eventType: 'wildfire',
            title: created.title,
            severity,
            lat,
            lng,
            situationalDesc: created.situationalDesc,
            detectedAt: created.detectedAt,
          });
        }
      } catch (spotErr) {
        logger.error('[FIRMS] Error saving hotspot:', spotErr.message);
      }
    }

    if (newCount > 0) logger.info(`[FIRMS] ✅ Saved ${newCount} new hotspots`);
    else logger.info('[FIRMS] No new hotspots this cycle');

  } catch (err) {
    logger.error('[FIRMS] Poll error:', err.message);
  }
}

function startFIRMSPoller(io) {
  if (!checkFIRMSConfig()) return null;
  pollFIRMS(io);
  const interval = setInterval(() => pollFIRMS(io), POLL_INTERVAL_MS);
  return interval;
}

function getFIRMSStatus() {
  return { configured: firmsConfigured, keyPresent: !!firmsMapKey };
}

module.exports = { startFIRMSPoller, getFIRMSStatus, pollFIRMS };
