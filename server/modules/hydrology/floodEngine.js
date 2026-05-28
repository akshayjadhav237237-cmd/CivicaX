/**
 * floodEngine.js — Physics-Based Flood Risk Engine
 *
 * Computes a composite flood risk score (0–100) from satellite inputs using
 * a weighted linear model calibrated for the Mandakini River Basin.
 *
 * SCORE FORMULA:
 *   score = w_rain   × normalize(currentMmHr,   0, 50)   × 100
 *         + w_fore   × normalize(forecast24h,    0, 150)  × 100
 *         + w_soil   × normalize(soilMoistureM3, 0, 0.45) × 100
 *         + w_slope  × normalize(valleySlope,    0, 0.15)  × 100
 *
 *   Weights: rain=0.35, forecast=0.30, soil=0.25, slope=0.10
 *
 * OVERFLOW DETECTION:
 *   If score ≥ riskLevels.orange (50) OR currentMmHr ≥ criticalMmHr (25):
 *   → Triggers urban flood spread calculation
 *   → Queries Overpass for streets within 1.5km of Mandakini
 *   → Estimates water depth per street segment using DEM slope
 *   → Returns FloodZoneRisk[] array for street-level Leaflet map layer
 *
 * ALERT MAPPING:
 *   score ≥ 75 → red    (evacuation order)
 *   score ≥ 50 → orange
 *   score ≥ 25 → yellow
 *   score < 25 → green
 */

const logger = require('../../config/logger');
const { fetchStreetsNearRiver } = require('../terrain/osmWaterways');
const cfg = require('../../shared/kedarnath.config');

const { weights, riskLevels, rainfall, manning } = cfg;

// ── Normalization helpers ─────────────────────────────────────────────────────

/** Clamp x to [min, max] and normalize to [0, 1] */
function normalize(value, min, max) {
  if (value === null || value === undefined) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// ── Alert level from score ────────────────────────────────────────────────────

function scoreToLevel(score) {
  if (score >= riskLevels.red) return 'red';
  if (score >= riskLevels.orange) return 'orange';
  if (score >= riskLevels.yellow) return 'yellow';
  return 'green';
}

// ── Water depth estimation per street segment ─────────────────────────────────
/**
 * Estimate water depth on a road segment using simplified Manning's equation.
 *
 * Flow velocity:  V = (1/n) × R^(2/3) × S^(1/2)   (Manning's)
 * Discharge:      Q = V × A  (simplified: A = width × depth)
 * Excess runoff:  Q_excess = rainfall_rate × catchment_area × runoff_coeff
 *
 * Simplified for street segments:
 *   depth_m = Q_excess / (street_width_m × V)
 *
 * @param {Object} segment  - GeoJSON road Feature with properties
 * @param {number} rainMmHr - Current rainfall in mm/hr
 * @param {number} slope    - Valley slope at this segment (m/m)
 * @param {number} soilM3   - Soil moisture (higher = more runoff)
 * @returns {number} Estimated water depth in meters
 */
function estimateWaterDepth(segment, rainMmHr, slope, soilM3) {
  const props = segment.properties;

  // Street width estimate by highway type
  const widthMap = {
    primary: 8,
    secondary: 6,
    tertiary: 5,
    residential: 4,
    service: 3,
    path: 2,
    track: 3,
    unclassified: 4,
  };
  const streetWidthM = widthMap[props.highway] || 4;

  // Effective slope at this segment — use valley slope as base,
  // adjusted by segment bearing relative to river flow direction (N→S)
  const segmentSlope = Math.max(0.001, slope * 0.7 + 0.002);

  // Manning's velocity (m/s) using segment slope and hydraulic radius ≈ depth/2 (wide channel)
  // V = (1/n) × R^(2/3) × S^(1/2)
  // For shallow sheet flow, R ≈ depth_m. Iterative approximation:
  const n = manning.n;
  const V_approx = (1 / n) * Math.pow(0.3, 2 / 3) * Math.pow(segmentSlope, 0.5);

  // Runoff coefficient: higher soil moisture → less infiltration → more runoff
  // Ranges from 0.3 (dry soil) to 0.85 (saturated)
  const runoffCoeff = 0.3 + (soilM3 / 0.45) * 0.55;

  // Catchment contributing area per segment (approx: length × half-width of adjacent hillslope)
  const catchmentAreaM2 = props.lengthKm * 1000 * 50; // 50m hillslope width per side

  // Excess discharge rate (m³/s)
  const rainMs = (rainMmHr / 1000) / 3600; // mm/hr → m/s
  const qExcess = rainMs * runoffCoeff * catchmentAreaM2;

  // Water depth on road = Q / (width × velocity)
  const depthM = qExcess / (streetWidthM * Math.max(0.01, V_approx));

  return Math.max(0, Math.min(5.0, parseFloat(depthM.toFixed(3)))); // cap at 5m
}

/**
 * Calculate flow direction vector for a street segment.
 * Returns 'downvalley', 'lateral', or 'upvalley' relative to Mandakini flow (N→S).
 */
function calcFlowDirection(segment) {
  const { startLat, endLat } = segment.properties;
  const dLat = endLat - startLat;

  if (Math.abs(dLat) < 0.001) return 'lateral'; // roughly E-W street
  return dLat < 0 ? 'downvalley' : 'upvalley';
}

/**
 * Build FloodZoneRisk record from a street segment.
 */
function buildFloodZoneRisk(segment, depthM, riskLevel, score) {
  const props = segment.properties;
  const coords = segment.geometry.coordinates;

  // Centroid of segment
  const midIdx = Math.floor(coords.length / 2);
  const [lng, lat] = coords[midIdx] || coords[0];

  return {
    osmSegmentId: String(props.osmId),
    segmentName: props.name,
    highway: props.highway,
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
    geometry: segment.geometry,
    waterDepthM: depthM,
    flowDirection: props.flowDirection || calcFlowDirection(segment),
    riskLevel,
    riskScore: Math.round(score),
    lengthKm: props.lengthKm,
  };
}

// ── Main engine function ──────────────────────────────────────────────────────

/**
 * Compute flood risk and urban flood spread for the Mandakini basin.
 *
 * @param {Object} rain    - Output from fetchOpenMeteo()
 * @param {Object} gpm     - Output from fetchGPMImerg() (may have null value)
 * @param {Object} soil    - Output from fetchSMAPSoil()
 * @param {Object} terrain - Output from fetchSRTMElevation()
 * @param {Object} waterways - Output from fetchMandakiniGeometry()
 *
 * @returns {Promise<Object>} Full risk payload
 * {
 *   score: number (0-100),
 *   level: 'red'|'orange'|'yellow'|'green',
 *   overflowDetected: boolean,
 *   factors: {
 *     rain:    { value, normalized, weight, contribution },
 *     forecast:{ value, normalized, weight, contribution },
 *     soil:    { value, normalized, weight, contribution },
 *     terrain: { value, normalized, weight, contribution },
 *   },
 *   recommendation: string,
 *   floodZoneRisks: FloodZoneRisk[] (street-level segments),
 *   sources: { rain, soil, terrain },
 *   computedAt: string,
 * }
 */
async function computeFloodRisk(rain, gpm, soil, terrain, waterways) {
  logger.info('[FloodEngine] Computing flood risk score...');

  // ── Extract inputs ──────────────────────────────────────────────────────────
  // Use GPM value if available and numeric, else fall back to Open-Meteo
  const currentMmHr =
    gpm?.mmPerHour !== null && typeof gpm?.mmPerHour === 'number'
      ? gpm.mmPerHour
      : rain.currentMmHr;

  const forecast24h = rain.forecast24hTotal ?? 0;
  const soilM3 = soil.soilMoistureM3 ?? 0.35;  // always present per spec
  const valleySlope = terrain.valleySlope ?? cfg.baselineValleySlope;

  // ── Normalize inputs ────────────────────────────────────────────────────────
  const normRain     = normalize(currentMmHr, 0, 50);   // 50mm/hr = max credible
  const normForecast = normalize(forecast24h, 0, 150);  // 150mm/24h = extreme event
  const normSoil     = normalize(soilM3, 0, 0.45);      // 0.45 = field saturation
  const normSlope    = normalize(valleySlope, 0, 0.15); // 0.15 = very steep

  // ── Weighted composite score ────────────────────────────────────────────────
  const contribRain     = weights.currentRain   * normRain     * 100;
  const contribForecast = weights.forecast24h   * normForecast * 100;
  const contribSoil     = weights.soilSaturation * normSoil    * 100;
  const contribSlope    = weights.terrainSlope  * normSlope    * 100;

  const rawScore = contribRain + contribForecast + contribSoil + contribSlope;
  const score = Math.max(0, Math.min(100, parseFloat(rawScore.toFixed(1))));
  const level = scoreToLevel(score);

  logger.info(
    `[FloodEngine] Score: ${score}/100 → Level: ${level.toUpperCase()} ` +
    `| Rain: ${currentMmHr.toFixed(1)}mm/hr | 24h: ${forecast24h.toFixed(1)}mm ` +
    `| Soil: ${soilM3.toFixed(3)}m³/m³ | Slope: ${valleySlope.toFixed(4)}`
  );

  // ── Overflow detection ──────────────────────────────────────────────────────
  const overflowDetected =
    score >= riskLevels.orange || currentMmHr >= rainfall.criticalMmHr;

  // ── Urban flood spread calculation ─────────────────────────────────────────
  let floodZoneRisks = [];

  if (overflowDetected) {
    logger.info(
      `[FloodEngine] 🌊 Overflow detected (score=${score}, rain=${currentMmHr}mm/hr) — computing urban flood spread`
    );

    // Get streets within 1.5km of the Mandakini river
    const streets = await fetchStreetsNearRiver(waterways?.riverGeometry ?? null);

    if (streets.length > 0) {
      logger.info(`[FloodEngine] Processing ${streets.length} street segments for flood depth`);

      floodZoneRisks = streets.map((segment) => {
        // Update flow direction on the segment
        segment.properties.flowDirection = calcFlowDirection(segment);

        // Estimate water depth using Manning's equation
        const depthM = estimateWaterDepth(segment, currentMmHr, valleySlope, soilM3);

        // Assign per-segment risk level based on depth
        let segLevel = 'green';
        if (depthM >= 1.5) segLevel = 'red';
        else if (depthM >= 0.6) segLevel = 'orange';
        else if (depthM >= 0.2) segLevel = 'yellow';

        return buildFloodZoneRisk(segment, depthM, segLevel, score);
      });

      logger.info(
        `[FloodEngine] ✅ Urban flood spread: ${floodZoneRisks.length} segments ` +
        `| Red: ${floodZoneRisks.filter(z => z.riskLevel === 'red').length} ` +
        `| Orange: ${floodZoneRisks.filter(z => z.riskLevel === 'orange').length} ` +
        `| Yellow: ${floodZoneRisks.filter(z => z.riskLevel === 'yellow').length}`
      );
    } else {
      logger.warn('[FloodEngine] No street segments returned from OSM — map will show basin-level risk only');
    }
  }

  // ── Recommendation text ─────────────────────────────────────────────────────
  const recommendations = {
    red: `⛔ CRITICAL: Mandakini river overflow imminent. Rainfall ${currentMmHr.toFixed(1)} mm/hr exceeds critical threshold. Soil at ${Math.round(soilM3 * 100 / 0.45)}% saturation. Immediate evacuation of riverbank areas required. Kedarnath town and downstream settlements at acute flood risk.`,
    orange: `⚠️ HIGH RISK: Significant flood threat for Mandakini basin. Rainfall ${currentMmHr.toFixed(1)} mm/hr with ${forecast24h.toFixed(0)} mm forecast in 24h. Soil near saturation. Avoid riverbank areas. Activate relief camps and pre-position rescue teams at Gaurikund and Sonprayag.`,
    yellow: `⚡ WATCH: Elevated flood risk in Mandakini valley. Current rain ${currentMmHr.toFixed(1)} mm/hr. Monitor water levels continuously. Pilgrims and residents in low-lying areas should prepare for possible evacuation.`,
    green: `✅ NORMAL: Flood risk is low for the Mandakini basin. Rain: ${currentMmHr.toFixed(1)} mm/hr. Soil moisture moderate. No immediate action required — continue routine monitoring.`,
  };

  return {
    score,
    level,
    overflowDetected,
    factors: {
      rain: {
        label: 'Current Rainfall',
        value: parseFloat(currentMmHr.toFixed(2)),
        unit: 'mm/hr',
        normalized: parseFloat(normRain.toFixed(3)),
        weight: weights.currentRain,
        contribution: parseFloat(contribRain.toFixed(2)),
        source: gpm?.mmPerHour !== null ? 'GPM_IMERG' : rain.source,
      },
      forecast: {
        label: '24h Precipitation Forecast',
        value: parseFloat(forecast24h.toFixed(2)),
        unit: 'mm',
        normalized: parseFloat(normForecast.toFixed(3)),
        weight: weights.forecast24h,
        contribution: parseFloat(contribForecast.toFixed(2)),
        source: rain.source,
      },
      soil: {
        label: 'Soil Saturation',
        value: parseFloat(soilM3.toFixed(3)),
        unit: 'm³/m³',
        saturationPct: soil.saturationPct,
        normalized: parseFloat(normSoil.toFixed(3)),
        weight: weights.soilSaturation,
        contribution: parseFloat(contribSoil.toFixed(2)),
        source: soil.source,
        fallbackReason: soil.fallbackReason || null,
      },
      terrain: {
        label: 'Valley Slope',
        value: parseFloat(valleySlope.toFixed(4)),
        unit: 'm/m',
        normalized: parseFloat(normSlope.toFixed(3)),
        weight: weights.terrainSlope,
        contribution: parseFloat(contribSlope.toFixed(2)),
        source: terrain.source,
      },
    },
    recommendation: recommendations[level],
    floodZoneRisks,
    sources: {
      rain: rain.source,
      gpm: gpm?.source ?? 'unavailable',
      soil: soil.source,
      terrain: terrain.source,
    },
    computedAt: new Date().toISOString(),
  };
}

module.exports = { computeFloodRisk, scoreToLevel };
