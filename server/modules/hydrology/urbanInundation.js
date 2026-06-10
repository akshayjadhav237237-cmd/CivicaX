/**
 * urbanInundation.js — Urban Flood Spread Calculator
 *
 * When river overflow occurs, queries the Overpass API for streets near
 * the overflow point, then estimates water depth on each segment using
 * elevation differential and overflow volume.
 */

const logger = require('../../config/logger');

const OVERPASS_URL       = 'https://overpass-api.de/api/interpreter';
const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
const TIMEOUT_MS         = 25000;

// Street width estimates by OSM highway type (metres)
const HIGHWAY_WIDTH_M = {
  motorway:      20,
  trunk:         16,
  primary:       14,
  secondary:     10,
  tertiary:       8,
  residential:    6,
  service:        5,
  footway:        2,
  path:           2,
  track:          4,
  unclassified:   7,
};

// ─── Haversine distance (inline — no external library) ─────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R     = 6371;
  const dLat  = ((lat2 - lat1) * Math.PI) / 180;
  const dLng  = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Overpass street fetch ──────────────────────────────────────────────────
async function fetchStreetsNearPoint(centerLat, centerLng, radiusKm) {
  const radiusM = Math.round(radiusKm * 1000);
  const query   = `
    [out:json][timeout:25];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|track)$"]
        (around:${radiusM},${centerLat},${centerLng});
    );
    out body geom;
  `;
  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'CivicaX/1.0' },
    body:    `data=${encodeURIComponent(query)}`,
    signal:  AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  return data.elements || [];
}

// ─── Batch elevation fetch ──────────────────────────────────────────────────
async function fetchElevations(points) {
  try {
    const res = await fetch(OPEN_ELEVATION_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'CivicaX/1.0' },
      body:    JSON.stringify({ locations: points.map(p => ({ latitude: p.lat, longitude: p.lng })) }),
      signal:  AbortSignal.timeout(15000),
    });
    if (!res.ok) return points.map(() => null);
    const data = await res.json();
    return (data.results || []).map(r => r.elevation ?? null);
  } catch {
    return points.map(() => null);
  }
}

// ─── Depth classification ───────────────────────────────────────────────────
function classifyDepth(depthM) {
  if (depthM >= 1.5) return { level: 'critical', color: '#7F1D1D' };
  if (depthM >= 0.8) return { level: 'danger',   color: '#EF4444' };
  if (depthM >= 0.3) return { level: 'warning',  color: '#F97316' };
  return              { level: 'watch',    color: '#FBBF24' };
}

/**
 * Calculate urban flood inundation for streets near an overflow point.
 *
 * @param {Object} inputs
 * @param {number} inputs.overflowVolumeM3s  - Overflow rate from manningsFlow (m³/s)
 * @param {number} inputs.centerLat          - Overflow point latitude
 * @param {number} inputs.centerLng          - Overflow point longitude
 * @param {number} [inputs.radiusKm]         - Search radius (default 2km)
 *
 * @returns {Promise<Object>}
 */
async function calculateUrbanInundation({
  overflowVolumeM3s,
  centerLat,
  centerLng,
  radiusKm = 2,
}) {
  logger.info(
    `[Inundation] INPUT — overflow: ${overflowVolumeM3s}m³/s | ` +
    `center: (${centerLat}, ${centerLng}) | radius: ${radiusKm}km`
  );

  const emptyResult = {
    affectedStreets:          [],
    totalAffectedStreets:     0,
    maxDepthM:                0,
    estimatedAffectedAreaKm2: 0,
    criticalZones:            [],
  };

  if (overflowVolumeM3s <= 0) return emptyResult;

  try {
    // Step 1 — Fetch streets from Overpass
    const ways = await fetchStreetsNearPoint(centerLat, centerLng, radiusKm);
    logger.info(`[Inundation] Overpass returned ${ways.length} street segments`);

    if (ways.length === 0) return emptyResult;

    // Step 2 — Fetch overflow point elevation
    const [overflowElevArr] = await fetchElevations([{ lat: centerLat, lng: centerLng }]);
    const overflowElevation = overflowElevArr ?? 3540; // fallback to Kedarnath town elevation

    // Step 3 — Collect midpoints for batch elevation query
    const midpoints = ways.map(way => {
      const geom   = way.geometry || [];
      const midIdx = Math.floor(geom.length / 2);
      const mid    = geom[midIdx] || geom[0] || { lat: centerLat, lon: centerLng };
      return { lat: mid.lat, lng: mid.lon };
    });

    const elevations = await fetchElevations(midpoints);
    logger.info(`[Inundation] Fetched ${elevations.filter(e => e !== null).length}/${ways.length} elevations`);

    // Step 4 — Process each street
    const affectedStreets = [];

    for (let i = 0; i < ways.length; i++) {
      const way           = ways[i];
      const streetElevation = elevations[i] ?? overflowElevation;
      const elevationDiff   = overflowElevation - streetElevation;

      // Only streets LOWER than overflow point flood
      if (elevationDiff <= 0) continue;

      const geom       = way.geometry || [];
      if (geom.length < 2) continue;

      // Calculate street length using Haversine
      let streetLengthM = 0;
      for (let j = 1; j < geom.length; j++) {
        streetLengthM += haversineKm(geom[j-1].lat, geom[j-1].lon, geom[j].lat, geom[j].lon) * 1000;
      }

      const highwayType = way.tags?.highway || 'unclassified';
      const streetWidthM   = HIGHWAY_WIDTH_M[highwayType] || 7;
      const streetVolumeM3 = streetLengthM * streetWidthM * 1; // 1m reference depth

      // Time to fill this street segment
      const fillTimeMinutes = overflowVolumeM3s > 0
        ? streetVolumeM3 / overflowVolumeM3s / 60
        : 9999;

      // Water depth estimate (elevation diff × 0.6 flow factor, capped at 3m)
      const waterDepthM = Math.min(elevationDiff * 0.6, 3.0);

      const { level, color } = classifyDepth(waterDepthM);

      affectedStreets.push({
        streetName:       way.tags?.name || way.tags?.['name:en'] || `${highwayType} segment`,
        osmId:            way.id,
        coordinates:      geom.map(n => [n.lon, n.lat]),
        waterDepthM:      parseFloat(waterDepthM.toFixed(2)),
        level,
        color,
        fillTimeMinutes:  parseFloat(fillTimeMinutes.toFixed(1)),
        highwayType,
        streetLengthM:    parseFloat(streetLengthM.toFixed(0)),
        elevationDiff:    parseFloat(elevationDiff.toFixed(1)),
      });
    }

    // Sort by depth descending
    affectedStreets.sort((a, b) => b.waterDepthM - a.waterDepthM);

    const maxDepthM = affectedStreets[0]?.waterDepthM ?? 0;
    const criticalZones = affectedStreets
      .filter(s => s.waterDepthM >= 1.5)
      .map(s => s.streetName);

    // Rough area estimate from total street length × average width
    const totalLengthKm = affectedStreets.reduce((s, r) => s + r.streetLengthM / 1000, 0);
    const estimatedAffectedAreaKm2 = parseFloat((totalLengthKm * 0.007).toFixed(3));

    const result = {
      affectedStreets,
      totalAffectedStreets:     affectedStreets.length,
      maxDepthM:                parseFloat(maxDepthM.toFixed(2)),
      estimatedAffectedAreaKm2,
      criticalZones,
    };

    logger.info(
      `[Inundation] OUTPUT — affected streets: ${result.totalAffectedStreets} | ` +
      `maxDepth: ${result.maxDepthM}m | criticalZones: ${criticalZones.length} | ` +
      `area: ${result.estimatedAffectedAreaKm2}km²`
    );

    return result;

  } catch (err) {
    logger.error(`[Inundation] ❌ Failed: ${err.message}`);
    return emptyResult;
  }
}

module.exports = { calculateUrbanInundation };
