/**
 * landslidRisk.js — LHASA-style Landslide Risk Calculator
 *
 * Assesses landslide risk for road segments near steep terrain by combining
 * slope angle from DEM samples, rainfall intensity, and soil saturation.
 *
 * Reference: NASA LHASA model (Landslide Hazard Assessment for Situational Awareness)
 */

const logger = require('../../config/logger');

const OVERPASS_URL       = 'https://overpass-api.de/api/interpreter';
const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
const TIMEOUT_MS         = 25000;

// ─── Haversine distance (inline) ────────────────────────────────────────────
function haversineM(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Overpass road fetch ─────────────────────────────────────────────────────
async function fetchRoadsNearPoint(centerLat, centerLng, radiusKm) {
  const radiusM = Math.round(radiusKm * 1000);
  const query   = `
    [out:json][timeout:25];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|track|path)$"]
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

// ─── Batch elevation fetch ───────────────────────────────────────────────────
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

// ─── Risk classification ─────────────────────────────────────────────────────
function classifyRisk(riskScore) {
  if (riskScore >= 0.8) return { level: 'critical', color: '#EF4444' };
  if (riskScore >= 0.6) return { level: 'high',     color: '#F97316' };
  if (riskScore >= 0.3) return { level: 'moderate', color: '#FBBF24' };
  return null; // low — skip
}

/**
 * Calculate LHASA-style landslide risk for road segments near steep terrain.
 *
 * @param {Object} inputs
 * @param {number} inputs.rainfallMM   - Current rainfall (mm)
 * @param {number} inputs.soilMoisture - Volumetric water content (0.0–1.0)
 * @param {number} inputs.centerLat    - Analysis centre latitude
 * @param {number} inputs.centerLng    - Analysis centre longitude
 * @param {number} [inputs.radiusKm]   - Search radius (default 5km)
 *
 * @returns {Promise<Object>}
 */
async function calculateLandslidRisk({
  rainfallMM,
  soilMoisture,
  centerLat,
  centerLng,
  radiusKm = 5,
}) {
  logger.info(
    `[Landslide] INPUT — rainfall: ${rainfallMM}mm | soilMoisture: ${soilMoisture} | ` +
    `center: (${centerLat}, ${centerLng}) | radius: ${radiusKm}km`
  );

  const emptyResult = { riskSegments: [], totalHighRiskSegments: 0 };

  try {
    // Step 1 — Fetch roads from Overpass
    const ways = await fetchRoadsNearPoint(centerLat, centerLng, radiusKm);
    logger.info(`[Landslide] Overpass returned ${ways.length} road segments`);

    if (ways.length === 0) return emptyResult;

    // Step 2 — Sample 3 points per segment for elevation (start, mid, end)
    const samplePoints = [];
    const segmentMeta  = [];

    for (const way of ways) {
      const geom = way.geometry || [];
      if (geom.length < 2) continue;

      const startPt = geom[0];
      const midPt   = geom[Math.floor(geom.length / 2)];
      const endPt   = geom[geom.length - 1];

      samplePoints.push(
        { lat: startPt.lat, lng: startPt.lon },
        { lat: midPt.lat,   lng: midPt.lon   },
        { lat: endPt.lat,   lng: endPt.lon   },
      );
      segmentMeta.push({ way, startPt, endPt });
    }

    const elevations = await fetchElevations(samplePoints);
    logger.info(`[Landslide] Fetched ${elevations.filter(e => e !== null).length} elevation points`);

    // Step 3 — Calculate slope angle and risk per segment
    const riskSegments = [];

    for (let i = 0; i < segmentMeta.length; i++) {
      const { way, startPt, endPt } = segmentMeta[i];

      const elevStart = elevations[i * 3]     ?? null;
      const elevEnd   = elevations[i * 3 + 2] ?? null;

      // Skip segments where we couldn't get elevation data
      if (elevStart === null || elevEnd === null) continue;

      const distM        = haversineM(startPt.lat, startPt.lon, endPt.lat, endPt.lon);
      const elevDiff     = Math.abs(elevEnd - elevStart);
      const slopeAngle   = distM > 0
        ? Math.atan(elevDiff / distM) * (180 / Math.PI)
        : 0;

      // Step 3a — LHASA risk score
      let baseRisk = 0;
      if (slopeAngle > 25) baseRisk += 0.4;
      if (slopeAngle > 35) baseRisk += 0.3;  // additional
      if (rainfallMM > 50)  baseRisk += 0.2;
      if (rainfallMM > 100) baseRisk += 0.2; // additional
      if (soilMoisture > 0.6) baseRisk += 0.2;
      const riskScore = Math.min(baseRisk, 1.0);

      // Step 4 — Classify (skip low risk)
      const classification = classifyRisk(riskScore);
      if (!classification) continue;

      const { level, color } = classification;

      // Warning text
      const parts = [];
      if (slopeAngle > 35) parts.push(`${slopeAngle.toFixed(0)}° slope (severe)`);
      else if (slopeAngle > 25) parts.push(`${slopeAngle.toFixed(0)}° slope`);
      if (soilMoisture > 0.6) parts.push('saturated soil');
      if (rainfallMM > 100)   parts.push(`${rainfallMM.toFixed(0)}mm intense rainfall`);
      else if (rainfallMM > 50) parts.push(`${rainfallMM.toFixed(0)}mm rainfall`);
      const warningText = `${parts.join(' + ')} — ${level} landslide risk`;

      riskSegments.push({
        roadName:    way.tags?.name || way.tags?.['name:en'] || `${way.tags?.highway || 'road'} segment`,
        osmId:       way.id,
        coordinates: (way.geometry || []).map(n => [n.lon, n.lat]),
        slopeAngle:  parseFloat(slopeAngle.toFixed(1)),
        riskScore:   parseFloat(riskScore.toFixed(3)),
        riskLevel:   level,
        color,
        warningText,
        elevDiffM:   parseFloat(elevDiff.toFixed(0)),
        segmentDistM: parseFloat(distM.toFixed(0)),
      });
    }

    // Sort by risk score descending
    riskSegments.sort((a, b) => b.riskScore - a.riskScore);

    const totalHighRiskSegments = riskSegments.filter(
      s => s.riskLevel === 'high' || s.riskLevel === 'critical'
    ).length;

    const result = { riskSegments, totalHighRiskSegments };

    logger.info(
      `[Landslide] OUTPUT — risk segments: ${riskSegments.length} | ` +
      `high/critical: ${totalHighRiskSegments} | ` +
      `top risk: ${riskSegments[0]?.riskScore ?? 0} (${riskSegments[0]?.riskLevel ?? 'n/a'})`
    );

    return result;

  } catch (err) {
    logger.error(`[Landslide] ❌ Failed: ${err.message}`);
    return emptyResult;
  }
}

module.exports = { calculateLandslidRisk };
