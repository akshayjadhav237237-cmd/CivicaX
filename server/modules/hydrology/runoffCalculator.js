/**
 * runoffCalculator.js — SCS Curve Number Runoff Model
 *
 * Calculates how much rainfall becomes surface runoff using the
 * USDA Soil Conservation Service (SCS) Curve Number method.
 *
 * Reference: NEH Part 630, Chapter 10
 */

const logger = require('../../config/logger');

/**
 * Determine the SCS Curve Number from soil moisture.
 * Higher CN → more saturated → more runoff.
 */
function getCurveNumber(soilMoisture) {
  if (soilMoisture < 0.3) return 60;   // Dry — absorbs more
  if (soilMoisture <= 0.6) return 75;  // Moderate
  return 90;                            // Saturated — most becomes runoff
}

/**
 * Calculate runoff using the SCS-CN method with slope multiplier.
 *
 * @param {Object} inputs
 * @param {number} inputs.rainfallMM     - Total rainfall (mm)
 * @param {number} inputs.soilMoisture   - Volumetric water content (0.0–1.0)
 * @param {number} inputs.slopePercent   - Terrain slope as percent (e.g. 8.0 for 8%)
 *
 * @returns {Object}
 * {
 *   runoffMM: number,
 *   runoffPercent: number,
 *   soilAbsorptionMM: number,
 *   curveNumber: number,
 *   slopeMultiplier: number,
 *   retentionS: number,
 *   explanation: string
 * }
 */
function calculateRunoff({ rainfallMM, soilMoisture, slopePercent }) {
  logger.info(
    `[Runoff] INPUT — rainfall: ${rainfallMM}mm | soilMoisture: ${soilMoisture} | slope: ${slopePercent}%`
  );

  // Guard against invalid inputs
  const P  = Math.max(0, rainfallMM    || 0);
  const sm = Math.min(1, Math.max(0, soilMoisture || 0.35));
  const sp = Math.max(0, slopePercent  || 0);

  // Step 1 — Curve Number
  const CN = getCurveNumber(sm);

  // Step 2 — Potential retention S (mm)
  const S = (25400 / CN) - 254;

  // Step 3 — Initial abstraction (0.2 * S)
  const Ia = 0.2 * S;

  // Step 4 — SCS runoff depth Qa (mm)
  let Qa = 0;
  if (P > Ia) {
    Qa = Math.pow(P - Ia, 2) / (P + 0.8 * S);
  }

  // Step 5 — Slope multiplier (steeper = more runoff momentum)
  const slopeMultiplier = 1 + (sp / 100) * 0.5;
  const finalRunoffMM   = Qa * slopeMultiplier;

  // Derived values
  const runoffPercent      = P > 0 ? Math.min(100, (finalRunoffMM / P) * 100) : 0;
  const soilAbsorptionMM   = Math.max(0, P - finalRunoffMM);

  // Human-readable explanation
  const soilLabel =
    sm < 0.3   ? 'Dry soil'
    : sm <= 0.6 ? 'Moderately saturated soil'
    :             'Saturated soil';
  const explanation =
    `${soilLabel} (CN=${CN}) — ${runoffPercent.toFixed(0)}% of rainfall will run off` +
    ` (${finalRunoffMM.toFixed(1)}mm runoff from ${P.toFixed(1)}mm rain, slope ×${slopeMultiplier.toFixed(2)})`;

  const result = {
    runoffMM:          parseFloat(finalRunoffMM.toFixed(3)),
    runoffPercent:     parseFloat(runoffPercent.toFixed(1)),
    soilAbsorptionMM:  parseFloat(soilAbsorptionMM.toFixed(3)),
    curveNumber:       CN,
    slopeMultiplier:   parseFloat(slopeMultiplier.toFixed(3)),
    retentionS:        parseFloat(S.toFixed(2)),
    explanation,
  };

  logger.info(
    `[Runoff] OUTPUT — runoff: ${result.runoffMM}mm (${result.runoffPercent}%) | ` +
    `absorption: ${result.soilAbsorptionMM}mm | CN: ${CN} | explanation: ${explanation}`
  );

  return result;
}

module.exports = { calculateRunoff, getCurveNumber };
