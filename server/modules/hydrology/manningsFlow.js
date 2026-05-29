/**
 * manningsFlow.js — Manning's Equation River Flow Calculator
 *
 * Computes river velocity, discharge, channel capacity, overflow status,
 * downstream ETA, and destructive force for a given runoff volume.
 *
 * Reference: Manning (1891), V = (1/n) * R^(2/3) * S^(1/2)
 */

const logger = require('../../config/logger');

// Manning's roughness coefficients by channel type
const MANNING_N = {
  natural_river:   0.035,
  mountain_stream: 0.045,
  urban_drain:     0.015,
  default:         0.040,
};

/**
 * Calculate river hydraulics using Manning's equation.
 *
 * @param {Object} inputs
 * @param {number} inputs.runoffMM          - Runoff depth from runoffCalculator (mm)
 * @param {number} inputs.catchmentAreaKm2  - Watershed area draining into the river (km²)
 * @param {number} inputs.channelWidthM     - River channel width (m)
 * @param {number} inputs.channelDepthM     - Bankfull channel depth (m)
 * @param {number} inputs.slopePercent      - Riverbed slope (%)
 * @param {string} [inputs.channelType]     - 'natural_river'|'mountain_stream'|'urban_drain'
 * @param {number} [inputs.distanceKm]      - Distance to downstream point for ETA (km)
 *
 * @returns {Object}
 */
function calculateManningsFlow({
  runoffMM,
  catchmentAreaKm2,
  channelWidthM,
  channelDepthM,
  slopePercent,
  channelType = 'natural_river',
  distanceKm  = 5,
}) {
  logger.info(
    `[Manning] INPUT — runoff: ${runoffMM}mm | catchment: ${catchmentAreaKm2}km² | ` +
    `channel: ${channelWidthM}m × ${channelDepthM}m | slope: ${slopePercent}% | type: ${channelType}`
  );

  // Guard inputs
  const runoff   = Math.max(0, runoffMM         || 0);
  const areaKm2  = Math.max(0.1, catchmentAreaKm2 || 1);
  const width    = Math.max(1, channelWidthM    || 15);
  const depth    = Math.max(0.1, channelDepthM  || 2.5);
  const slope    = Math.max(0.0001, slopePercent || 1) / 100; // convert % → fraction
  const n        = MANNING_N[channelType] || MANNING_N.default;
  const distKm   = Math.max(0.1, distanceKm || 5);

  // Step 1 — Convert runoff (mm over catchment area) to volumetric flow Q (m³/s)
  const runoffM3 = (runoff / 1000) * (areaKm2 * 1_000_000); // mm → m, km² → m²
  const Q        = runoffM3 / 3600;                           // per hour → per second

  // Step 2 — Hydraulic radius R
  const crossSectionArea = width * depth;
  const wettedPerimeter  = width + (2 * depth);
  const R                = crossSectionArea / wettedPerimeter;

  // Step 3 — Manning's velocity V (m/s)
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);

  // Step 4 — Channel capacity Qmax (m³/s)
  const Qmax = crossSectionArea * V;

  // Step 5 — Overflow
  const overflowRatio     = Qmax > 0 ? Q / Qmax : 0;
  const isOverflowing     = Q > Qmax;
  const overflowVolumeM3s = isOverflowing ? (Q - Qmax) : 0;

  // Step 6 — Downstream ETA
  const etaMinutes = V > 0 ? (distKm * 1000) / V / 60 : 9999;

  // Step 7 — Destructive force (momentum proxy): Q × V × density of water (1000 kg/m³)
  const force = Q * V * 1000; // Newtons

  // Explanation
  const pct = Math.round(overflowRatio * 100);
  const explanation = isOverflowing
    ? `River at ${pct}% capacity. Overflow imminent — ${overflowVolumeM3s.toFixed(1)} m³/s excess. Water reaches downstream in ${etaMinutes.toFixed(0)} min.`
    : `River at ${pct}% capacity. Flow within safe limits — velocity ${V.toFixed(2)} m/s.`;

  const result = {
    velocityMs:        parseFloat(V.toFixed(3)),
    velocityKmh:       parseFloat((V * 3.6).toFixed(2)),
    dischargeM3s:      parseFloat(Q.toFixed(3)),
    capacityM3s:       parseFloat(Qmax.toFixed(3)),
    isOverflowing,
    overflowRatio:     parseFloat(overflowRatio.toFixed(3)),
    overflowVolumeM3s: parseFloat(overflowVolumeM3s.toFixed(3)),
    etaMinutes:        parseFloat(etaMinutes.toFixed(1)),
    force:             parseFloat(force.toFixed(0)),
    hydraulicRadius:   parseFloat(R.toFixed(3)),
    manningN:          n,
    explanation,
  };

  logger.info(
    `[Manning] OUTPUT — V: ${result.velocityMs}m/s | Q: ${result.dischargeM3s}m³/s | ` +
    `Qmax: ${result.capacityM3s}m³/s | overflow: ${isOverflowing} | ratio: ${result.overflowRatio} | ` +
    `ETA: ${result.etaMinutes}min | force: ${result.force}N`
  );

  return result;
}

module.exports = { calculateManningsFlow, MANNING_N };
