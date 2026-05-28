/**
 * pipeline.js — Satellite Disaster Intelligence Pipeline Orchestrator
 *
 * Main entry point for the disaster intelligence brain.
 * Called once from server/index.js with the Socket.io instance.
 *
 * Execution order per run:
 *   1. Fetch Open-Meteo precipitation (guaranteed, no auth)
 *   2. Fetch NASA GPM IMERG (CMR metadata, graceful null if unavailable)
 *   3. Fetch NASA SMAP soil moisture (CMR metadata, 0.35 fallback if unavailable)
 *   4. Fetch SRTM elevation (3-tier: open-elevation → opentopo → hardcoded)
 *   5. Fetch Mandakini river geometry from Overpass (for urban spread calc)
 *   6. Run floodEngine.computeFloodRisk() → risk score + street FloodZoneRisks
 *   7. processRiskResult() → save to DB, emit WebSocket events
 *
 * Steps 1–5 run with Promise.allSettled() so one API failure never blocks others.
 * Polling interval: every 10 minutes.
 */

const logger = require('../config/logger');
const { fetchOpenMeteo } = require('./satellite/openMeteo');
const { fetchGPMImerg } = require('./satellite/gpmImerg');
const { fetchSMAPSoil } = require('./satellite/smapSoil');
const { fetchSRTMElevation } = require('./terrain/srtmElevation');
const { fetchMandakiniGeometry } = require('./terrain/osmWaterways');
const { computeFloodRisk } = require('./hydrology/floodEngine');
const { processRiskResult } = require('./alerts/alertGenerator');
const { startCameraPoller } = require('./camera/cameraPoller');
const { pipelineIntervalMs } = require('../shared/kedarnath.config');

// Track last run result for the /flood-risk endpoint to serve instantly
let _lastRiskResult = null;
let _isRunning = false;

/**
 * Execute one full pipeline cycle.
 * @param {Object} io - Socket.io server instance
 */
async function runDisasterPipeline(io) {
  if (_isRunning) {
    logger.warn('[Pipeline] Previous cycle still running — skipping this tick');
    return;
  }

  _isRunning = true;
  const cycleStart = Date.now();
  logger.info('[Pipeline] ═══ Starting disaster intelligence cycle ═══');

  try {
    // ── Step 1–5: Fetch all data sources concurrently ─────────────────────
    const [
      rainResult,
      gpmResult,
      soilResult,
      terrainResult,
      waterwaysResult,
    ] = await Promise.allSettled([
      fetchOpenMeteo(),
      fetchGPMImerg(),
      fetchSMAPSoil(),
      fetchSRTMElevation(),
      fetchMandakiniGeometry(),
    ]);

    // Extract values — use fallbacks for any rejected promises
    const rain = rainResult.status === 'fulfilled'
      ? rainResult.value
      : { source: 'open_meteo', currentMmHr: 0, forecast24hTotal: 0, error: rainResult.reason?.message };

    const gpm = gpmResult.status === 'fulfilled'
      ? gpmResult.value
      : { source: 'unavailable', mmPerHour: null, error: gpmResult.reason?.message };

    const soil = soilResult.status === 'fulfilled'
      ? soilResult.value
      : { source: 'default_fallback', soilMoistureM3: 0.35, saturationPct: 78, status: 'near_saturation', fallbackReason: soilResult.reason?.message };

    const terrain = terrainResult.status === 'fulfilled'
      ? terrainResult.value
      : { source: 'hardcoded_fallback', valleySlope: 0.08, minElev: 895, maxElev: 3583, riverBedElev: 3583 };

    const waterways = waterwaysResult.status === 'fulfilled'
      ? waterwaysResult.value
      : { source: 'overpass', riverGeometry: null, error: waterwaysResult.reason?.message };

    // Log fetch summary
    logger.info(
      `[Pipeline] Data fetch complete | ` +
      `Rain: ${rain.source}(${rain.currentMmHr?.toFixed(1) ?? 'n/a'}mm/hr) | ` +
      `GPM: ${gpm.source} | ` +
      `Soil: ${soil.source}(${soil.soilMoistureM3?.toFixed(3)}m³/m³) | ` +
      `Terrain: ${terrain.source}(slope=${terrain.valleySlope?.toFixed(4)}) | ` +
      `OSM: ${waterways.riverGeometry ? 'river OK' : 'no river'}`
    );

    // ── Step 6: Compute flood risk ────────────────────────────────────────
    const riskResult = await computeFloodRisk(rain, gpm, soil, terrain, waterways);

    // Cache for instant API serving
    _lastRiskResult = riskResult;

    // ── Step 7: Persist and emit ──────────────────────────────────────────
    await processRiskResult(riskResult, io);

    const duration = ((Date.now() - cycleStart) / 1000).toFixed(1);
    logger.info(
      `[Pipeline] ✅ Cycle complete in ${duration}s | Score: ${riskResult.score}/100 | Level: ${riskResult.level.toUpperCase()} | Segments: ${riskResult.floodZoneRisks.length}`
    );
  } catch (err) {
    logger.error(`[Pipeline] ❌ Cycle failed: ${err.message}`, err.stack);
  } finally {
    _isRunning = false;
  }
}

/**
 * Get the cached result from the last pipeline run.
 * Returns null if no cycle has completed yet.
 */
function getLastRiskResult() {
  return _lastRiskResult;
}

/**
 * Start the pipeline — called once from server/index.js.
 * @param {Object} io - Socket.io server instance
 */
function startPipeline(io) {
  logger.info(`[Pipeline] Starting disaster intelligence pipeline (interval: ${pipelineIntervalMs / 60000}min)`);

  // Run immediately on startup (after a short delay for DB to be ready)
  setTimeout(() => runDisasterPipeline(io), 3000);

  // Then run on interval
  const interval = setInterval(() => runDisasterPipeline(io), pipelineIntervalMs);

  // Also start camera feed poller
  startCameraPoller(io);

  return interval;
}

module.exports = { startPipeline, runDisasterPipeline, getLastRiskResult };
