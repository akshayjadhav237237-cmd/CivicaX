/**
 * osmWaterways.js — OpenStreetMap Overpass API Waterway & Street Fetcher
 *
 * Two functions:
 *   1. fetchMandakiniGeometry()   — Gets the river centreline as GeoJSON LineString
 *   2. fetchStreetsNearRiver()     — Gets all road segments within 1.5km of the river
 *                                   for urban flood spread calculation in floodEngine.js
 *
 * No API key required. Overpass is free and rate-limited at ~10k/day for anonymous use.
 *
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

const logger = require('../../config/logger');
const { bbox, center, urbanSpreadRadiusKm } = require('../../shared/kedarnath.config');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_MS = 20000;

/**
 * Execute an Overpass QL query.
 */
async function overpassQuery(query) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'CivicaX-DisasterPipeline/1.0 (flood monitoring)',
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * Convert Overpass node/way elements to a GeoJSON LineString.
 */
function elementsToLineString(elements) {
  const nodes = {};
  const ways = [];

  for (const el of elements) {
    if (el.type === 'node') {
      nodes[el.id] = [el.lon, el.lat];
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }

  // Merge all way nodes into a single coordinate array
  const coords = [];
  for (const way of ways) {
    for (const nodeId of (way.nodes || [])) {
      if (nodes[nodeId]) coords.push(nodes[nodeId]);
    }
  }

  if (coords.length === 0) return null;

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: { name: 'Mandakini', waterway: 'river' },
  };
}

/**
 * Convert Overpass way elements to an array of GeoJSON LineString Features.
 * Each feature represents one road segment.
 */
function elementsToRoadFeatures(elements) {
  const nodes = {};
  const wayFeatures = [];

  for (const el of elements) {
    if (el.type === 'node') {
      nodes[el.id] = { lat: el.lat, lng: el.lon };
    }
  }

  for (const el of elements) {
    if (el.type !== 'way') continue;

    const coords = (el.nodes || [])
      .map((nid) => nodes[nid])
      .filter(Boolean);

    if (coords.length < 2) continue;

    // Calculate segment slope (crude — using start/end lat difference as proxy)
    // Will be refined by actual DEM data in floodEngine
    const startLat = coords[0].lat;
    const endLat = coords[coords.length - 1].lat;
    const startLng = coords[0].lng;
    const endLng = coords[coords.length - 1].lng;

    // Distance approximation (km)
    const dLat = (endLat - startLat) * 111;
    const dLng = (endLng - startLng) * 111 * Math.cos(startLat * Math.PI / 180);
    const lengthKm = Math.sqrt(dLat * dLat + dLng * dLng);

    wayFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords.map((c) => [c.lng, c.lat]),
      },
      properties: {
        osmId: el.id,
        name: el.tags?.name || el.tags?.['name:en'] || null,
        highway: el.tags?.highway || 'unclassified',
        lengthKm: parseFloat(lengthKm.toFixed(4)),
        startLat,
        startLng,
        endLat,
        endLng,
        // flowDirection and waterDepthM will be populated by floodEngine
        flowDirection: null,
        waterDepthM: 0,
      },
    });
  }

  return wayFeatures;
}

/**
 * Fetch the Mandakini river centreline geometry from OSM.
 *
 * @returns {Promise<Object>}
 * {
 *   source: 'overpass',
 *   riverGeometry: GeoJSON Feature (LineString) | null,
 *   nodeCount: number,
 *   fetchedAt: string,
 *   error: null | string,
 * }
 */
async function fetchMandakiniGeometry() {
  const query = `
    [out:json][timeout:20];
    (
      way["waterway"="river"]["name"="Mandakini"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      way["waterway"="river"]["name:en"="Mandakini"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    logger.info('[OSM] Fetching Mandakini river geometry...');
    const data = await overpassQuery(query);
    const elements = data.elements || [];
    const riverGeometry = elementsToLineString(elements);

    const nodeCount = elements.filter((e) => e.type === 'node').length;
    logger.info(`[OSM] ✅ River geometry: ${nodeCount} nodes, ${riverGeometry ? 'LineString OK' : 'null'}`);

    return {
      source: 'overpass',
      riverGeometry,
      nodeCount,
      fetchedAt: new Date().toISOString(),
      error: riverGeometry ? null : 'No Mandakini way found in OSM within bbox',
    };
  } catch (err) {
    logger.error(`[OSM] ❌ River geometry fetch failed: ${err.message}`);
    return {
      source: 'overpass',
      riverGeometry: null,
      nodeCount: 0,
      fetchedAt: new Date().toISOString(),
      error: err.message,
    };
  }
}

/**
 * Fetch all road/street segments within `urbanSpreadRadiusKm` km of the Mandakini river.
 * Used to calculate street-level flood spread in floodEngine.js.
 *
 * @param {Object} riverGeometry - GeoJSON LineString from fetchMandakiniGeometry()
 * @returns {Promise<Array>} Array of GeoJSON road Features with properties for flood calc
 */
async function fetchStreetsNearRiver(riverGeometry) {
  // If we don't have river geometry, fall back to bbox-based query around center
  const radiusM = urbanSpreadRadiusKm * 1000; // convert to meters

  // Build an around query using the river linestring points or center
  let aroundTarget;
  if (riverGeometry?.geometry?.coordinates?.length > 0) {
    // Sample every 5th point of the river to build the around set
    const coords = riverGeometry.geometry.coordinates;
    const sampled = coords.filter((_, i) => i % 5 === 0);
    aroundTarget = sampled.map((c) => `${c[1]},${c[0]}`).join(' ');
  } else {
    // Fall back to center point query
    aroundTarget = `${center.lat},${center.lng}`;
  }

  // Query roads/paths within radius — include primary, secondary, tertiary, residential
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|path|track)$"]
        (around:${radiusM},${aroundTarget});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    logger.info(`[OSM] Fetching streets within ${urbanSpreadRadiusKm}km of Mandakini river...`);
    const data = await overpassQuery(query);
    const elements = data.elements || [];
    const roads = elementsToRoadFeatures(elements);

    logger.info(`[OSM] ✅ Found ${roads.length} street segments for flood spread calculation`);
    return roads;
  } catch (err) {
    logger.error(`[OSM] ❌ Street fetch failed: ${err.message}`);
    return []; // Return empty array — flood spread calculation will skip street layer
  }
}

module.exports = { fetchMandakiniGeometry, fetchStreetsNearRiver };
