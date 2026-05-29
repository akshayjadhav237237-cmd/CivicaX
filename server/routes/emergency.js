/**
 * Emergency routes — Pillar I: Disaster Management
 * Handles alert zones, active alerts, safe zones, elevation data, population estimates, satellite status
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { getSatelliteStatus } = require('../services/satelliteService');
const { sendSMS } = require('../services/notificationService');
const logger = require('../config/logger');
const { predict: floodPredict } = require('../modules/hydrology/floodOrchestrator');

let turf;
try { turf = require('@turf/turf'); } catch (_) { turf = null; }

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/emergency/zones
 * Returns GeoJSON FeatureCollection of all emergency alert zones.
 * Role required: none (public)
 */
router.get('/zones', async (_req, res) => {
  try {
    const zones = await prisma.emergencyZone.findMany();
    const featureCollection = {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        geometry: zone.geojson,
        properties: {
          id: zone.id,
          name: zone.name,
          level: zone.level,
          description: zone.description,
          updatedAt: zone.updatedAt,
        },
      })),
    };
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, data: featureCollection, message: 'Zones retrieved' });
  } catch (err) {
    logger.error('Error fetching zones:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch zones', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/alerts/active
 * Returns all currently active emergency alerts sorted by severity (red first).
 * Role required: none (public)
 */
router.get('/alerts/active', async (_req, res) => {
  try {
    const levelOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
    const alerts = await prisma.emergencyAlert.findMany({
      where: { isActive: true },
      include: { zone: true, creator: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const sorted = alerts.sort((a, b) => (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4));
    res.json({ success: true, data: sorted, message: 'Active alerts retrieved' });
  } catch (err) {
    logger.error('Error fetching active alerts:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/alerts
 * Returns all emergency alerts (history).
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      include: { zone: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: alerts, message: 'Alerts retrieved' });
  } catch (err) {
    logger.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts', code: 'DB_ERROR' });
  }
});

/**
 * POST /api/v1/emergency/alerts
 * Creates a new emergency alert and emits WebSocket event to all connected clients.
 * Input: { zoneId, level, title, description, evacuationOrder? }
 * Role required: government, admin
 */
router.post('/alerts', authenticate, roleGuard('government', 'admin'), async (req, res) => {
  try {
    const schema = z.object({
      zoneId: z.string().uuid(),
      level: z.enum(['yellow', 'orange', 'red', 'green']),
      title: z.string().min(5),
      description: z.string().min(10),
      evacuationOrder: z.boolean().optional().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }

    const alert = await prisma.emergencyAlert.create({
      data: { ...parsed.data, createdBy: req.user.id },
      include: { zone: true, creator: { select: { id: true, name: true, role: true } } },
    });

    // Update zone level to match the new alert
    await prisma.emergencyZone.update({ where: { id: parsed.data.zoneId }, data: { level: parsed.data.level } });

    // Log audit action
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE_ALERT', payload: { alertId: alert.id, level: alert.level, title: alert.title } },
    });

    // Emit WebSocket event
    const io = req.app.get('io');
    io.emit('alert:new', alert);

    // SMS: notify all users with phone numbers when level is RED
    if (parsed.data.level === 'red') {
      (async () => {
        try {
          const recipients = await prisma.user.findMany({
            where: { phone: { not: null } },
            select: { phone: true },
          });
          const msg = `🚨 RED ALERT — CivicaX: ${alert.title}. ${alert.evacuationOrder ? 'EVACUATION ORDER IN EFFECT. ' : ''}${alert.description.slice(0, 120)}`;
          for (const u of recipients) {
            await sendSMS(u.phone, msg);
          }
        } catch (smsErr) {
          logger.error('[SMS] Red alert SMS failed:', smsErr.message);
        }
      })();
    }

    logger.info(`Alert created by ${req.user.email}: ${alert.title} (${alert.level})`);
    res.status(201).json({ success: true, data: alert, message: 'Alert created and broadcast' });
  } catch (err) {
    logger.error('Error creating alert:', err);
    res.status(500).json({ success: false, error: 'Failed to create alert', code: 'DB_ERROR' });
  }
});

/**
 * PUT /api/v1/emergency/alerts/:id
 * Updates an existing alert level or status.
 * Input: { level?, isActive?, description?, evacuationOrder? }
 * Role required: government, admin
 */
router.put('/alerts/:id', authenticate, roleGuard('government', 'admin'), async (req, res) => {
  try {
    const schema = z.object({
      level: z.enum(['yellow', 'orange', 'red', 'green']).optional(),
      isActive: z.boolean().optional(),
      description: z.string().optional(),
      evacuationOrder: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }

    const alert = await prisma.emergencyAlert.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { zone: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATE_ALERT', payload: { alertId: alert.id, changes: parsed.data } },
    });

    const io = req.app.get('io');
    io.emit('alert:updated', alert);

    res.json({ success: true, data: alert, message: 'Alert updated' });
  } catch (err) {
    logger.error('Error updating alert:', err);
    res.status(500).json({ success: false, error: 'Failed to update alert', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/safe-zones
 * Returns list of safe zone locations with coordinates and capacity.
 * Role required: none (public)
 */
router.get('/safe-zones', async (_req, res) => {
  try {
    const safeZones = await prisma.safeZone.findMany({ orderBy: { name: 'asc' } });
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, data: safeZones, message: 'Safe zones retrieved' });
  } catch (err) {
    logger.error('Error fetching safe zones:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch safe zones', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/elevation?lat=&lng=
 * Returns elevation profile data for a given coordinate.
 * Uses pre-loaded SRTM data for the demo region (Lonavla, Maharashtra).
 * Role required: none (public)
 */
router.get('/elevation', async (req, res) => {
  try {
    const region = req.query.region || 'lonavla';
    const data = await prisma.elevationData.findMany({
      where: { region },
      orderBy: { sequence: 'asc' },
    });
    res.json({
      success: true,
      data,
      message: 'Elevation data retrieved',
      meta: {
        source: 'SRTM 30m resolution',
        note: 'Pre-loaded for Lonavla demo region. To use for your region, download SRTM tiles from USGS EarthExplorer and load into PostGIS.',
      },
    });
  } catch (err) {
    logger.error('Error fetching elevation:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch elevation data', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/population-estimate?zoneId=
 * Returns estimated population in a zone.
 * Calculated from: zone polygon area × average population density.
 * Role required: none (public)
 */
router.get('/population-estimate', async (req, res) => {
  try {
    const { zoneId } = req.query;
    if (!zoneId) {
      return res.status(400).json({ success: false, error: 'zoneId is required', code: 'MISSING_PARAM' });
    }

    const zone = await prisma.emergencyZone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found', code: 'NOT_FOUND' });
    }

    const densityRecord = await prisma.populationDensity.findFirst({
      where: { regionName: { contains: 'lonavla', mode: 'insensitive' } },
    });
    const densityPerSqKm = densityRecord?.densityPerSqkm || 350;

    // Use turf.js for accurate polygon area, fall back to bbox approximation
    let areaKm2 = 5;
    try {
      const coords = zone.geojson?.coordinates?.[0];
      if (coords?.length > 0) {
        if (turf) {
          // turf.area accepts a GeoJSON polygon and returns area in m²
          const polygon = { type: 'Feature', geometry: zone.geojson };
          areaKm2 = turf.area(polygon) / 1_000_000;
        } else {
          // Fallback: rough bbox approximation
          const lats = coords.map(c => c[1]);
          const lngs = coords.map(c => c[0]);
          const latRange = Math.max(...lats) - Math.min(...lats);
          const lngRange = Math.max(...lngs) - Math.min(...lngs);
          areaKm2 = latRange * 111 * lngRange * 88;
        }
      }
    } catch (_) { /* use default */ }

    const estimatedPopulation = Math.round(areaKm2 * densityPerSqKm);
    res.set('Cache-Control', 'public, max-age=120');
    res.json({
      success: true,
      data: {
        zoneId,
        zoneName: zone.name,
        estimatedPopulation,
        densityPerSqKm,
        areaKm2: Math.round(areaKm2 * 100) / 100,
        disclaimer: 'Population estimate based on census density data. Real-time CCTV person detection can refine this.',
        crowdDataNotice: 'Real-time crowd detection requires (1) Google Maps Popular Times API (paid) or (2) CCTV person detection via YOLO. Currently showing static density estimate.',
      },
      message: 'Population estimate calculated',
    });
  } catch (err) {
    logger.error('Error calculating population:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate population', code: 'CALC_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/satellite-status
 * Returns current satellite feed status. Real if APIs configured, otherwise returns unconfigured status.
 * Role required: none (public)
 */
router.get('/satellite-status', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.7557;
    const lng = parseFloat(req.query.lng) || 73.4091;
    const status = await getSatelliteStatus(lat, lng);
    res.json({ success: true, data: status, message: 'Satellite status retrieved' });
  } catch (err) {
    logger.error('Error fetching satellite status:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch satellite status', code: 'SATELLITE_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Satellite Pipeline Routes — Phase 2 (Mandakini Basin Disaster Intelligence)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/emergency/flood-risk
 * Returns the latest FloodSnapshot with full factor breakdown.
 * Serves the cached in-memory result for instant response (updated every 10 min).
 * Falls back to the most recent DB record if pipeline hasn't run yet.
 * Role required: none (public)
 */
router.get('/flood-risk', async (_req, res) => {
  try {
    // Try in-memory cache first (zero latency)
    const { getLastRiskResult } = require('../modules/pipeline');
    const cached = getLastRiskResult();

    if (cached) {
      return res.set('Cache-Control', 'public, max-age=60').json({
        success: true,
        data: cached,
        source: 'pipeline_cache',
        message: 'Flood risk retrieved from pipeline cache',
      });
    }

    // Fall back to most recent DB snapshot
    let snapshot = null;
    try {
      snapshot = await prisma.floodSnapshot.findFirst({
        orderBy: { snapshotAt: 'desc' },
      });
    } catch (dbErr) {
      // Table doesn't exist yet — migration pending
      logger.warn('[flood-risk] floodSnapshot table not found — migration may not have run yet:', dbErr.message);
      return res.json({
        success: true,
        data: null,
        status: 'pending_migration',
        message: 'Pipeline tables not yet created — redeploy with migrate deploy will fix this',
      });
    }

    if (!snapshot) {
      return res.json({
        success: true,
        data: null,
        message: 'No flood risk data yet — pipeline running on startup',
      });
    }

    res.set('Cache-Control', 'public, max-age=60').json({
      success: true,
      data: {
        score: snapshot.riskScore,
        level: snapshot.riskLevel,
        overflowDetected: snapshot.overflowDetected,
        factors: snapshot.factorsJson,
        recommendation: snapshot.recommendation,
        sources: {
          rain: snapshot.rainSource,
          soil: snapshot.soilSource,
          terrain: snapshot.terrainSource,
        },
        computedAt: snapshot.snapshotAt,
        snapshotId: snapshot.id,
      },
      source: 'database',
      message: 'Flood risk retrieved from latest snapshot',
    });
  } catch (err) {
    logger.error('Error fetching flood risk:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch flood risk', code: 'PIPELINE_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/flood-zones
 * Returns all FloodZoneRisk records for Leaflet street-level map coloring.
 * Each record has {latitude, longitude, geometry, waterDepthM, riskLevel, flowDirection}.
 * Role required: none (public)
 */
router.get('/flood-zones', async (req, res) => {
  try {
    const level = req.query.level;
    const where = level ? { riskLevel: level } : {};

    let zones = [];
    try {
      zones = await prisma.floodZoneRisk.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        take: 500,
        select: {
          id: true,
          osmSegmentId: true,
          segmentName: true,
          highway: true,
          latitude: true,
          longitude: true,
          geometry: true,
          waterDepthM: true,
          flowDirection: true,
          riskLevel: true,
          riskScore: true,
          lengthKm: true,
          updatedAt: true,
        },
      });
    } catch (dbErr) {
      logger.warn('[flood-zones] floodZoneRisk table not found — migration pending:', dbErr.message);
      return res.json({
        success: true,
        data: { type: 'FeatureCollection', features: [] },
        meta: { total: 0, level: level || 'all', status: 'pending_migration' },
        message: 'Flood zone table not yet created — redeploy will fix this',
      });
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: zones.map((z) => ({
        type: 'Feature',
        geometry: z.geometry,
        properties: {
          id: z.id,
          osmSegmentId: z.osmSegmentId,
          name: z.segmentName,
          highway: z.highway,
          lat: z.latitude,
          lng: z.longitude,
          waterDepthM: z.waterDepthM,
          flowDirection: z.flowDirection,
          riskLevel: z.riskLevel,
          riskScore: z.riskScore,
          lengthKm: z.lengthKm,
          updatedAt: z.updatedAt,
        },
      })),
    };

    res.set('Cache-Control', 'public, max-age=120').json({
      success: true,
      data: featureCollection,
      meta: {
        total: zones.length,
        level: level || 'all',
        note: 'Street-level flood zone risks derived from satellite data + Manning equation',
      },
      message: 'Flood zones retrieved',
    });
  } catch (err) {
    logger.error('Error fetching flood zones:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch flood zones', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/camera-feeds
 * Returns all registered RTSP camera feeds with latest water detection results.
 * Role required: none (public)
 */
router.get('/camera-feeds', async (_req, res) => {
  try {
    let feeds = [];
    try {
      feeds = await prisma.cameraFeed.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          locationLabel: true,
          isActive: true,
          isOnline: true,
          latencyMs: true,
          lastPolledAt: true,
          lastWaterDetected: true,
          lastDetectionConfidence: true,
          lastDetectionMethod: true,
          connectionError: true,
          updatedAt: true,
        },
      });
    } catch (dbErr) {
      logger.warn('[camera-feeds] cameraFeed table not found — migration pending:', dbErr.message);
      return res.json({
        success: true,
        data: [],
        meta: { total: 0, online: 0, waterDetected: 0, status: 'pending_migration' },
        message: 'Camera feed table not yet created — redeploy will fix this',
      });
    }

    res.set('Cache-Control', 'public, max-age=30').json({
      success: true,
      data: feeds,
      meta: {
        total: feeds.length,
        online: feeds.filter((f) => f.isOnline).length,
        waterDetected: feeds.filter((f) => f.lastWaterDetected).length,
      },
      message: 'Camera feeds retrieved',
    });
  } catch (err) {
    logger.error('Error fetching camera feeds:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch camera feeds', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/flood-prediction/:zoneId
 * Returns latest prediction + last 6 for trend analysis.
 * Public — no auth required (read-only intelligence data).
 */
router.get('/flood-prediction/:zoneId', async (req, res) => {
  const { zoneId } = req.params;
  try {
    const [latest, history] = await Promise.all([
      prisma.floodPrediction.findFirst({
        where: { zoneId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.floodPrediction.findMany({
        where: { zoneId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, alertLevel: true, createdAt: true, predictionData: true },
      }),
    ]);

    if (!latest) {
      // No prediction yet — trigger one on-demand
      logger.info(`[flood-prediction] No cached prediction for zone ${zoneId} — running on-demand`);
      try {
        const fresh = await floodPredict(30.735, 79.067, zoneId, zoneId);
        return res.json({ success: true, data: { latest: fresh, history: [fresh], onDemand: true } });
      } catch (orchErr) {
        return res.status(503).json({ success: false, error: 'Prediction engine unavailable', detail: orchErr.message });
      }
    }

    res.json({
      success: true,
      data: {
        latest:     latest.predictionData,
        history:    history.map(h => ({ id: h.id, alertLevel: h.alertLevel, createdAt: h.createdAt, summary: h.predictionData?.summary })),
        onDemand:   false,
      },
    });
  } catch (err) {
    logger.error('[flood-prediction] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch flood prediction', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/emergency/flood-predictions/active
 * Returns all zones where latest alertLevel is 'orange' or 'red'.
 * Used by government dashboard.
 * Requires: authenticated government or admin role.
 */
router.get('/flood-predictions/active', authenticate, roleGuard('government', 'admin'), async (_req, res) => {
  try {
    // Get the latest prediction per zone using a subquery approach
    const allLatest = await prisma.floodPrediction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // safety cap
    });

    // De-duplicate: keep only the most recent per zoneId
    const byZone = new Map();
    for (const p of allLatest) {
      if (!byZone.has(p.zoneId)) byZone.set(p.zoneId, p);
    }

    const active = [...byZone.values()].filter(
      p => p.alertLevel === 'orange' || p.alertLevel === 'red'
    );

    res.json({
      success: true,
      data: active.map(p => ({
        zoneId:     p.zoneId,
        alertLevel: p.alertLevel,
        createdAt:  p.createdAt,
        summary:    p.predictionData?.summary,
        riverStatus: p.predictionData?.riverStatus,
        populationAtRisk: p.predictionData?.populationAtRisk,
        resourcesNeeded:  p.predictionData?.resourcesNeeded,
      })),
      meta: { total: active.length, orange: active.filter(p => p.alertLevel === 'orange').length, red: active.filter(p => p.alertLevel === 'red').length },
    });
  } catch (err) {
    logger.error('[flood-predictions/active] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch active flood predictions', code: 'DB_ERROR' });
  }
});

module.exports = router;

