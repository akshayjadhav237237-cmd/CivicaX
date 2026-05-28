/**
 * alertGenerator.js — Flood Alert & Snapshot Persistence Layer
 *
 * Consumes floodEngine output and:
 *   1. Creates/updates EmergencyAlert in DB when risk is orange or red
 *   2. Saves a FloodSnapshot record for every pipeline run (history)
 *   3. Upserts FloodZoneRisk records for street-level map layer
 *   4. Emits three WebSocket events:
 *       - 'flood:risk-update'      → full risk payload for stat cards
 *       - 'satellite:rainfall-update' → rain + soil stats for telemetry panel
 *       - 'zone:flood-level'       → zone colour change for Leaflet map
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

const prisma = new PrismaClient();

// Alert source tag added to all machine-generated alerts
const PIPELINE_ALERT_SOURCE = 'SATELLITE_PIPELINE';

// Government user ID to credit auto-created alerts to.
// Falls back to first available government/admin user.
let _systemUserId = null;

async function getSystemUserId() {
  if (_systemUserId) return _systemUserId;

  const govUser = await prisma.user.findFirst({
    where: { role: { in: ['government', 'admin'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!govUser) throw new Error('[AlertGenerator] No government/admin user found for auto-alerts');

  _systemUserId = govUser.id;
  return _systemUserId;
}

/**
 * Find or create the "Mandakini Basin" emergency zone.
 * Returns the zone ID.
 */
async function getOrCreateMandakiniZone() {
  const existing = await prisma.emergencyZone.findFirst({
    where: { name: { contains: 'Mandakini', mode: 'insensitive' } },
  });

  if (existing) return existing.id;

  // Create the zone with an approximate GeoJSON polygon of the Kedarnath basin
  const zone = await prisma.emergencyZone.create({
    data: {
      name: 'Mandakini River Basin — Kedarnath',
      level: 'green',
      description: 'Mandakini River Basin, Kedarnath, Uttarakhand. Monitored via satellite pipeline.',
      geojson: {
        type: 'Polygon',
        coordinates: [[
          [78.95, 30.55],
          [79.15, 30.55],
          [79.15, 30.75],
          [78.95, 30.75],
          [78.95, 30.55],
        ]],
      },
    },
  });

  logger.info(`[AlertGenerator] Created Mandakini zone: ${zone.id}`);
  return zone.id;
}

/**
 * Deactivate any previous satellite-generated alerts for a zone.
 */
async function deactivatePreviousAlerts(zoneId) {
  await prisma.emergencyAlert.updateMany({
    where: {
      zoneId,
      isActive: true,
      description: { contains: PIPELINE_ALERT_SOURCE },
    },
    data: { isActive: false },
  });
}

/**
 * Main processor — called by pipeline.js after every run.
 *
 * @param {Object} riskResult - Output from floodEngine.computeFloodRisk()
 * @param {Object} io - Socket.io server instance
 */
async function processRiskResult(riskResult, io) {
  const { score, level, overflowDetected, factors, recommendation, floodZoneRisks, computedAt } = riskResult;

  try {
    const zoneId = await getOrCreateMandakiniZone();

    // ── 1. Save FloodSnapshot ───────────────────────────────────────────────
    const snapshot = await prisma.floodSnapshot.create({
      data: {
        zoneId,
        riskScore: score,
        riskLevel: level,
        rainfallMmHr: factors.rain.value,
        forecast24hMm: factors.forecast.value,
        soilMoistureM3: factors.soil.value,
        valleySlope: factors.terrain.value,
        soilSource: factors.soil.source,
        terrainSource: factors.terrain.source,
        rainSource: factors.rain.source,
        overflowDetected,
        factorsJson: factors,
        recommendation,
        snapshotAt: new Date(computedAt),
      },
    });
    logger.info(`[AlertGenerator] ✅ FloodSnapshot saved: ID=${snapshot.id} Score=${score} Level=${level}`);

    // ── 2. Update zone level ────────────────────────────────────────────────
    await prisma.emergencyZone.update({
      where: { id: zoneId },
      data: { level },
    });

    // ── 3. Create/update EmergencyAlert for orange & red ───────────────────
    if (level === 'orange' || level === 'red') {
      const systemUserId = await getSystemUserId();
      await deactivatePreviousAlerts(zoneId);

      const alert = await prisma.emergencyAlert.create({
        data: {
          zoneId,
          level,
          title: level === 'red'
            ? `🚨 CRITICAL FLOOD RISK — Mandakini Basin (Score: ${score}/100)`
            : `⚠️ Elevated Flood Alert — Mandakini Basin (Score: ${score}/100)`,
          description:
            `[${PIPELINE_ALERT_SOURCE}] ${recommendation}`,
          evacuationOrder: level === 'red',
          isActive: true,
          createdBy: systemUserId,
        },
        include: { zone: true },
      });

      logger.info(`[AlertGenerator] 🚨 EmergencyAlert created: ${alert.title}`);

      // Emit alert to all clients
      if (io) io.emit('alert:new', alert);
    } else if (level === 'green' || level === 'yellow') {
      // Deactivate any outstanding orange/red alerts when risk subsides
      await deactivatePreviousAlerts(zoneId);
    }

    // ── 4. Upsert FloodZoneRisk records (street-level) ─────────────────────
    if (floodZoneRisks && floodZoneRisks.length > 0) {
      logger.info(`[AlertGenerator] Upserting ${floodZoneRisks.length} FloodZoneRisk records...`);

      // Batch upsert — use osmSegmentId as the unique key
      for (const seg of floodZoneRisks) {
        await prisma.floodZoneRisk.upsert({
          where: { osmSegmentId: seg.osmSegmentId },
          update: {
            waterDepthM: seg.waterDepthM,
            flowDirection: seg.flowDirection,
            riskLevel: seg.riskLevel,
            riskScore: seg.riskScore,
            snapshotId: snapshot.id,
            updatedAt: new Date(),
          },
          create: {
            osmSegmentId: seg.osmSegmentId,
            segmentName: seg.segmentName,
            highway: seg.highway,
            latitude: seg.latitude,
            longitude: seg.longitude,
            geometry: seg.geometry,
            waterDepthM: seg.waterDepthM,
            flowDirection: seg.flowDirection,
            riskLevel: seg.riskLevel,
            riskScore: seg.riskScore,
            lengthKm: seg.lengthKm,
            snapshotId: snapshot.id,
          },
        });
      }
      logger.info(`[AlertGenerator] ✅ FloodZoneRisk records upserted`);
    }

    // ── 5. Emit WebSocket events ────────────────────────────────────────────
    if (io) {
      // Full risk payload for the dashboard stat cards
      io.emit('flood:risk-update', {
        score,
        level,
        overflowDetected,
        factors,
        recommendation,
        segmentCount: floodZoneRisks.length,
        computedAt,
        snapshotId: snapshot.id,
      });

      // Lighter telemetry update for the rain/soil panel
      io.emit('satellite:rainfall-update', {
        rainfallMmHr: factors.rain.value,
        forecast24hMm: factors.forecast.value,
        soilMoistureM3: factors.soil.value,
        soilSaturationPct: factors.soil.saturationPct,
        soilSource: factors.soil.source,
        rainSource: factors.rain.source,
        updatedAt: computedAt,
      });

      // Zone-level colour change for Leaflet GeoJSON layer
      io.emit('zone:flood-level', {
        zoneId,
        level,
        score,
        overflowDetected,
        updatedAt: computedAt,
      });

      logger.info(`[AlertGenerator] ✅ WebSocket events emitted (flood:risk-update, satellite:rainfall-update, zone:flood-level)`);
    }
  } catch (err) {
    logger.error(`[AlertGenerator] ❌ Processing failed: ${err.message}`, err.stack);
  }
}

module.exports = { processRiskResult, getOrCreateMandakiniZone };
