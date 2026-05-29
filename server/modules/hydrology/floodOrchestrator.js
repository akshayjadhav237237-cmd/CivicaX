/**
 * floodOrchestrator.js — Master Flood Prediction Orchestrator
 *
 * Calls all hydrology modules in sequence, aggregates results,
 * saves to DB, and emits WebSocket events when alert level changes.
 *
 * Chain: OpenMeteo → SMAP → SRTM → OSM → Runoff → Manning's → Inundation → Landslide
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

// ─── Satellite modules (DO NOT MODIFY those files) ──────────────────────────
const { fetchOpenMeteo }         = require('../satellite/openMeteo');
const { fetchSMAPSoil }          = require('../satellite/smapSoil');
const { fetchSRTMElevation }     = require('../terrain/srtmElevation');
const { fetchMandakiniGeometry } = require('../terrain/osmWaterways');

// ─── Hydrology modules (new) ─────────────────────────────────────────────────
const { calculateRunoff }            = require('./runoffCalculator');
const { calculateManningsFlow }      = require('./manningsFlow');
const { calculateUrbanInundation }   = require('./urbanInundation');
const { calculateLandslidRisk }      = require('./landslidRisk');

const prisma = new PrismaClient();

// Kedarnath / Mandakini basin parameters
const BASIN_CATCHMENT_KM2   = 935;  // Mandakini catchment area upstream of Sonprayag
const DEFAULT_CHANNEL_WIDTH  = 15;  // metres — from kedarnath.config
const DEFAULT_CHANNEL_DEPTH  = 2.5; // metres — bankfull depth
const POPULATION_DENSITY     = 4000; // people/km² — Kedarnath valley estimate

// Previous alert level per zone (in-memory, for change detection)
const prevAlertLevel = new Map();

/**
 * Determine overall flood alert level.
 */
function computeAlertLevel(isOverflowing, overflowRatio, rainfallMM) {
  if (!isOverflowing && rainfallMM < 25)  return 'green';
  if (!isOverflowing && rainfallMM >= 25) return 'yellow';
  if (isOverflowing && overflowRatio < 1.5) return 'orange';
  return 'red';
}

/**
 * Build the plain-English summary string.
 */
function buildSummary({ alertLevel, riverStatus, urbanImpact, landslidRiskResult, populationAtRisk }) {
  const parts = [];

  const prefix = {
    green:  'ALL CLEAR',
    yellow: 'WATCH',
    orange: 'ALERT',
    red:    'CRITICAL',
  }[alertLevel] || 'UNKNOWN';

  parts.push(prefix + ':');

  if (riverStatus.isOverflowing) {
    parts.push(`River at ${Math.round(riverStatus.overflowRatio * 100)}% capacity.`);
    parts.push(`Water flowing at ${riverStatus.velocityMs} m/s will reach downstream in ${Math.round(riverStatus.etaMinutes)} min.`);
  } else {
    parts.push(`River within safe limits at ${riverStatus.velocityMs} m/s (${Math.round(riverStatus.overflowRatio * 100)}% capacity).`);
  }

  if (urbanImpact && urbanImpact.totalAffectedStreets > 0) {
    parts.push(`${urbanImpact.totalAffectedStreets} streets at flood risk (max depth ${urbanImpact.maxDepthM}m).`);
  }

  if (landslidRiskResult && landslidRiskResult.totalHighRiskSegments > 0) {
    parts.push(`${landslidRiskResult.totalHighRiskSegments} road segments at high/critical landslide risk.`);
  }

  if (populationAtRisk > 0) {
    parts.push(`Estimated ${populationAtRisk.toLocaleString()} people at risk.`);
  }

  return parts.join(' ');
}

/**
 * Main prediction function. Called per zone by satelliteService.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} zoneId
 * @param {string} zoneName
 * @param {Object} [io]  - Socket.io server instance (optional)
 * @returns {Promise<Object>} Full prediction object
 */
async function predict(lat, lng, zoneId, zoneName, io = null) {
  logger.info(`[FloodOrchestrator] ▶ Starting prediction for zone: ${zoneName} (${lat}, ${lng})`);

  // ── Step 1: Fetch rainfall ────────────────────────────────────────────────
  let rainfallData = { currentMmHr: 0, forecast24hTotal: 0 };
  try {
    rainfallData = await fetchOpenMeteo();
    logger.info(`[FloodOrchestrator] ✅ Rainfall — current: ${rainfallData.currentMmHr}mm/hr | 24h: ${rainfallData.forecast24hTotal}mm`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ Rainfall fetch failed: ${err.message} — using defaults`);
  }

  // ── Step 2: Fetch soil moisture ───────────────────────────────────────────
  let soilData = { soilMoistureM3: 0.35, saturationPct: 78, source: 'default_fallback' };
  try {
    soilData = await fetchSMAPSoil();
    logger.info(`[FloodOrchestrator] ✅ Soil — ${soilData.soilMoistureM3} m³/m³ (${soilData.source})`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ Soil fetch failed: ${err.message} — using defaults`);
  }

  // ── Step 3: Fetch terrain slope ───────────────────────────────────────────
  let terrainData = { valleySlope: 0.08, source: 'hardcoded_fallback' };
  try {
    terrainData = await fetchSRTMElevation();
    logger.info(`[FloodOrchestrator] ✅ Terrain — slope: ${terrainData.valleySlope} m/m (${terrainData.source})`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ Terrain fetch failed: ${err.message} — using defaults`);
  }

  // ── Step 4: Fetch river geometry ──────────────────────────────────────────
  try {
    await fetchMandakiniGeometry();
    logger.info(`[FloodOrchestrator] ✅ River geometry fetched`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ River geometry fetch failed: ${err.message}`);
  }

  const rainfallMM   = rainfallData.currentMmHr || 0;
  const soilMoisture = soilData.soilMoistureM3  || 0.35;
  const slopePercent = (terrainData.valleySlope  || 0.08) * 100; // m/m → %

  // ── Step 5: Runoff calculation ────────────────────────────────────────────
  let runoffResult = { runoffMM: 0, runoffPercent: 0, soilAbsorptionMM: 0, curveNumber: 75, explanation: 'Defaults used' };
  try {
    runoffResult = calculateRunoff({ rainfallMM, soilMoisture, slopePercent });
    logger.info(`[FloodOrchestrator] ✅ Runoff — ${runoffResult.runoffMM}mm (${runoffResult.runoffPercent}%)`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ Runoff calc failed: ${err.message}`);
  }

  // ── Step 6: Manning's flow ────────────────────────────────────────────────
  let flowResult = {
    velocityMs: 0, velocityKmh: 0, dischargeM3s: 0, capacityM3s: 0,
    isOverflowing: false, overflowRatio: 0, overflowVolumeM3s: 0,
    etaMinutes: 0, force: 0, explanation: 'Defaults used',
  };
  try {
    flowResult = calculateManningsFlow({
      runoffMM:         runoffResult.runoffMM,
      catchmentAreaKm2: BASIN_CATCHMENT_KM2,
      channelWidthM:    DEFAULT_CHANNEL_WIDTH,
      channelDepthM:    DEFAULT_CHANNEL_DEPTH,
      slopePercent,
      channelType:      'mountain_stream',
      distanceKm:       5,
    });
    logger.info(`[FloodOrchestrator] ✅ Manning's — V: ${flowResult.velocityMs}m/s | overflow: ${flowResult.isOverflowing} | ratio: ${flowResult.overflowRatio}`);
  } catch (err) {
    logger.warn(`[FloodOrchestrator] ⚠️ Manning's calc failed: ${err.message}`);
  }

  // ── Step 7: Urban inundation + landslide (only if overflowing) ───────────
  let urbanImpact       = null;
  let landslidRiskResult = null;

  if (flowResult.isOverflowing) {
    logger.info(`[FloodOrchestrator] ⚠️ Overflow detected — running inundation + landslide analysis`);

    try {
      urbanImpact = await calculateUrbanInundation({
        overflowVolumeM3s: flowResult.overflowVolumeM3s,
        centerLat: lat,
        centerLng: lng,
        radiusKm:  2,
      });
      logger.info(`[FloodOrchestrator] ✅ Inundation — ${urbanImpact.totalAffectedStreets} streets | maxDepth: ${urbanImpact.maxDepthM}m`);
    } catch (err) {
      logger.warn(`[FloodOrchestrator] ⚠️ Inundation calc failed: ${err.message}`);
      urbanImpact = { affectedStreets: [], totalAffectedStreets: 0, maxDepthM: 0, estimatedAffectedAreaKm2: 0, criticalZones: [] };
    }

    try {
      landslidRiskResult = await calculateLandslidRisk({
        rainfallMM,
        soilMoisture,
        centerLat: lat,
        centerLng: lng,
        radiusKm:  5,
      });
      logger.info(`[FloodOrchestrator] ✅ Landslide — ${landslidRiskResult.riskSegments.length} at-risk segments`);
    } catch (err) {
      logger.warn(`[FloodOrchestrator] ⚠️ Landslide calc failed: ${err.message}`);
      landslidRiskResult = { riskSegments: [], totalHighRiskSegments: 0 };
    }
  }

  // ── Step 8: Alert level ───────────────────────────────────────────────────
  const alertLevel = computeAlertLevel(flowResult.isOverflowing, flowResult.overflowRatio, rainfallMM);

  // ── Step 9: Population at risk ────────────────────────────────────────────
  const affectedAreaKm2  = urbanImpact?.estimatedAffectedAreaKm2 || 0;
  const populationAtRisk = Math.round(affectedAreaKm2 * POPULATION_DENSITY);

  // ── Step 10: Resources needed ─────────────────────────────────────────────
  let resourcesNeeded = null;
  if (alertLevel === 'orange' || alertLevel === 'red') {
    resourcesNeeded = {
      rescueBoats:       Math.ceil(populationAtRisk * 0.067 / 1000),
      ambulances:        Math.ceil(populationAtRisk * 0.05  / 100),
      reliefKits:        populationAtRisk * 3,
      evacuationBuses:   Math.ceil(populationAtRisk / 50),
    };
  }

  // ── Step 11: Build prediction object ─────────────────────────────────────
  const summary = buildSummary({ alertLevel, riverStatus: flowResult, urbanImpact, landslidRiskResult, populationAtRisk });

  const prediction = {
    zoneId,
    zoneName,
    lat,
    lng,
    timestamp: new Date().toISOString(),
    alertLevel,

    rainfall: {
      current:     rainfallMM,
      forecast24h: rainfallData.forecast24hTotal || 0,
      unit:        'mm/hr',
      source:      rainfallData.source || 'open_meteo',
    },

    soilMoisture: {
      value:            soilMoisture,
      saturationPercent: soilData.saturationPct || 0,
      source:           soilData.source || 'default_fallback',
    },

    runoff: {
      runoffMM:         runoffResult.runoffMM,
      runoffPercent:    runoffResult.runoffPercent,
      curveNumber:      runoffResult.curveNumber,
      explanation:      runoffResult.explanation,
    },

    riverStatus: {
      velocityMs:        flowResult.velocityMs,
      velocityKmh:       flowResult.velocityKmh,
      dischargeM3s:      flowResult.dischargeM3s,
      capacityM3s:       flowResult.capacityM3s,
      isOverflowing:     flowResult.isOverflowing,
      overflowRatio:     flowResult.overflowRatio,
      overflowVolumeM3s: flowResult.overflowVolumeM3s,
      etaMinutes:        flowResult.etaMinutes,
      force:             flowResult.force,
      explanation:       flowResult.explanation,
    },

    urbanImpact: urbanImpact
      ? {
          affectedStreets:          urbanImpact.affectedStreets,
          totalAffectedStreets:     urbanImpact.totalAffectedStreets,
          maxDepthM:                urbanImpact.maxDepthM,
          estimatedAffectedAreaKm2: urbanImpact.estimatedAffectedAreaKm2,
          criticalZones:            urbanImpact.criticalZones,
        }
      : null,

    landslidRisk: landslidRiskResult
      ? {
          riskSegments:          landslidRiskResult.riskSegments,
          totalHighRiskSegments: landslidRiskResult.totalHighRiskSegments,
        }
      : null,

    populationAtRisk,
    resourcesNeeded,
    summary,
  };

  logger.info(`[FloodOrchestrator] 📊 Prediction complete — alertLevel: ${alertLevel} | pop at risk: ${populationAtRisk} | ${summary}`);

  // ── Step 12: Save to DB ───────────────────────────────────────────────────
  try {
    await prisma.floodPrediction.create({
      data: {
        zoneId,
        alertLevel,
        predictionData: prediction,
      },
    });
    logger.info(`[FloodOrchestrator] 💾 Saved prediction to DB`);
  } catch (dbErr) {
    logger.warn(`[FloodOrchestrator] ⚠️ DB save failed (migration pending?): ${dbErr.message}`);
  }

  // ── Step 13: WebSocket emit if alert level changed ────────────────────────
  const prev = prevAlertLevel.get(zoneId);
  if (io && prev !== alertLevel) {
    logger.info(`[FloodOrchestrator] 📡 Alert level changed ${prev ?? 'none'} → ${alertLevel} — emitting WebSocket`);
    io.emit('zone:flood-prediction', prediction);
  }
  prevAlertLevel.set(zoneId, alertLevel);

  return prediction;
}

module.exports = { predict };
