/**
 * apiHealthMonitor.js — External API Health Monitor
 * Pings all integrated external APIs every 2 minutes.
 * Stores results in api_health_logs table.
 * Emits 'admin:api-health-update' WebSocket event.
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 2 * 60 * 1000;

const APIS_TO_MONITOR = [
  {
    name: 'EONET (NASA Natural Events)',
    endpoint: 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=1',
    requiresKey: false,
    envKey: null,
  },
  {
    name: 'FIRMS (NASA Fire Data)',
    endpoint: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{NASA_FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/world/1`,
    requiresKey: true,
    envKey: 'NASA_FIRMS_MAP_KEY',
    configNote: 'Register free at https://firms.modaps.eosdis.nasa.gov/api/map_key/',
  },
  {
    name: 'Open-Meteo (Weather)',
    endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=18.75&longitude=73.40&hourly=rain&forecast_days=1',
    requiresKey: false,
    envKey: null,
  },
  {
    name: 'OSRM (Routing)',
    endpoint: 'https://router.project-osrm.org/route/v1/driving/73.40,18.75;73.41,18.76?overview=false',
    requiresKey: false,
    envKey: null,
  },
  {
    name: 'Nominatim (Geocoding)',
    endpoint: 'https://nominatim.openstreetmap.org/reverse?lat=18.75&lon=73.40&format=json',
    requiresKey: false,
    envKey: null,
    headers: { 'User-Agent': 'CivicaX/1.0 (civic monitoring system)' },
  },
  {
    name: 'NASA GIBS (Satellite Imagery)',
    endpoint: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible/6/0/0.jpg',
    requiresKey: false,
    envKey: null,
  },
  {
    name: 'NASA Earthdata / LANCE',
    endpoint: 'https://earthdata.nasa.gov',
    requiresKey: true,
    envKey: 'NASA_EARTHDATA_TOKEN',
    configNote: 'Register free at https://earthdata.nasa.gov',
  },
];

async function checkAPI(api) {
  const start = Date.now();

  // If key required but not configured
  if (api.requiresKey && api.envKey) {
    const key = process.env[api.envKey];
    if (!key || key.trim() === '') {
      return {
        apiName: api.name,
        endpoint: api.endpoint,
        status: 'unconfigured',
        responseTimeMs: null,
        errorMessage: `${api.envKey} not set. ${api.configNote || ''}`,
      };
    }
    // Replace placeholder in URL
    api = { ...api, endpoint: api.endpoint.replace(`{${api.envKey}}`, key) };
  }

  try {
    const res = await fetch(api.endpoint, {
      method: 'GET',
      headers: api.headers || { 'User-Agent': 'CivicaX/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const responseTimeMs = Date.now() - start;

    let status;
    if (res.status >= 200 && res.status < 300) status = 'healthy';
    else if (res.status >= 400 && res.status < 500) status = 'degraded';
    else status = 'down';

    return { apiName: api.name, endpoint: api.endpoint, status, responseTimeMs, errorMessage: null };
  } catch (err) {
    const responseTimeMs = Date.now() - start;
    return {
      apiName: api.name,
      endpoint: api.endpoint,
      status: 'down',
      responseTimeMs,
      errorMessage: err.message || 'Request failed',
    };
  }
}

async function runHealthChecks(io) {
  logger.info('[APIHealth] Running health checks on all APIs...');
  const results = await Promise.allSettled(APIS_TO_MONITOR.map(api => checkAPI(api)));
  const logs = results.map(r => r.status === 'fulfilled' ? r.value : {
    apiName: 'Unknown',
    endpoint: '',
    status: 'down',
    responseTimeMs: null,
    errorMessage: r.reason?.message,
  });

  // Save all results to DB
  for (const log of logs) {
    await prisma.apiHealthLog.create({ data: { ...log, checkedAt: new Date() } });
  }

  const healthy = logs.filter(l => l.status === 'healthy').length;
  logger.info(`[APIHealth] ✅ ${healthy}/${logs.length} APIs healthy`);

  // Emit to admin portal
  if (io) {
    io.emit('admin:api-health-update', {
      results: logs,
      checkedAt: new Date().toISOString(),
      summary: { healthy, total: logs.length },
    });
  }

  return logs;
}

function startAPIHealthMonitor(io) {
  logger.info('[APIHealth] Starting health monitor (2-min interval)');
  runHealthChecks(io);
  const interval = setInterval(() => runHealthChecks(io), POLL_INTERVAL_MS);
  return interval;
}

module.exports = { startAPIHealthMonitor, runHealthChecks };
