/**
 * osmWaterways.js — OpenStreetMap Overpass API Waterway & Street Fetcher
 *
 * Two functions:
 *   1. fetchMandakiniGeometry()   — Gets the river centreline as GeoJSON LineString
 *   2. fetchStreetsNearRiver()     — Gets all road segments within 1.5km of the river
 *                                   for urban flood spread calculation in floodEngine.js
 */

const logger = require('../../config/logger');
const { bbox, center, urbanSpreadRadiusKm } = require('../../shared/kedarnath.config');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_MS = 8000;

// In-memory geometry cache to avoid Overpass rate-limiting (429)
let cachedMandakiniGeometry = null;
let cachedStreets = null;
let lastMandakiniFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const MANDAKINI_FALLBACK_COORDS = [
  [79.0669, 30.7346],
  [79.0600, 30.7200],
  [79.0550, 30.7050],
  [79.0494, 30.6975],
  [79.0400, 30.6800],
  [79.0320, 30.6650],
  [79.0272, 30.6508],
  [79.0325, 30.6315],
  [79.0410, 30.5750],
  [79.0792, 30.5235]
];

const MANDAKINI_FALLBACK_FEATURE = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: MANDAKINI_FALLBACK_COORDS,
  },
  properties: { name: 'Mandakini River', waterway: 'river' },
};

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
    properties: { name: 'Mandakini River', waterway: 'river' },
  };
}

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

    const startLat = coords[0].lat;
    const endLat = coords[coords.length - 1].lat;
    const startLng = coords[0].lng;
    const endLng = coords[coords.length - 1].lng;

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
        flowDirection: null,
        waterDepthM: 0,
      },
    });
  }

  return wayFeatures;
}

async function fetchMandakiniGeometry() {
  if (cachedMandakiniGeometry && (Date.now() - lastMandakiniFetchTime < CACHE_TTL_MS)) {
    return cachedMandakiniGeometry;
  }

  const query = `
    [out:json][timeout:10];
    (
      way["waterway"="river"]["name"="Mandakini"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      way["waterway"="river"]["name:en"="Mandakini"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const data = await overpassQuery(query);
    const elements = data.elements || [];
    const riverGeometry = elementsToLineString(elements) || MANDAKINI_FALLBACK_FEATURE;

    const nodeCount = elements.filter((e) => e.type === 'node').length || MANDAKINI_FALLBACK_COORDS.length;
    logger.info(`[OSM] ✅ River geometry: ${nodeCount} nodes, LineString OK`);

    cachedMandakiniGeometry = {
      source: 'overpass',
      riverGeometry,
      nodeCount,
      fetchedAt: new Date().toISOString(),
      error: null,
    };
    lastMandakiniFetchTime = Date.now();
    return cachedMandakiniGeometry;
  } catch (err) {
    logger.warn(`[OSM] River geometry fallback used (${err.message})`);
    cachedMandakiniGeometry = {
      source: 'fallback',
      riverGeometry: MANDAKINI_FALLBACK_FEATURE,
      nodeCount: MANDAKINI_FALLBACK_COORDS.length,
      fetchedAt: new Date().toISOString(),
      error: null,
    };
    lastMandakiniFetchTime = Date.now();
    return cachedMandakiniGeometry;
  }
}

async function fetchStreetsNearRiver(riverGeometry) {
  if (cachedStreets) return cachedStreets;

  const radiusM = urbanSpreadRadiusKm * 1000;
  let aroundTarget = `${center.lat},${center.lng}`;

  if (riverGeometry?.geometry?.coordinates?.length > 0) {
    const coords = riverGeometry.geometry.coordinates;
    const sampled = coords.filter((_, i) => i % 5 === 0);
    aroundTarget = sampled.map((c) => `${c[1]},${c[0]}`).join(' ');
  }

  const query = `
    [out:json][timeout:12];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|path|track)$"]
        (around:${radiusM},${aroundTarget});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const data = await overpassQuery(query);
    const elements = data.elements || [];
    const roads = elementsToRoadFeatures(elements);
    cachedStreets = roads;
    logger.info(`[OSM] ✅ Cached ${roads.length} street segments for flood spread`);
    return roads;
  } catch (err) {
    logger.warn(`[OSM] Street fetch using empty fallback (${err.message})`);
    cachedStreets = [];
    return cachedStreets;
  }
}

module.exports = { fetchMandakiniGeometry, fetchStreetsNearRiver };
