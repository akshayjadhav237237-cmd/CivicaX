/**
 * kedarnath.config.js — Geographic & Threshold Config for Mandakini Basin
 *
 * Single source of truth for all disaster intelligence modules.
 * Phase 1 target: Mandakini River Basin, Kedarnath, Uttarakhand.
 *
 * Bounding box reference:
 *   North: 30.75°N  South: 30.55°N  East: 79.15°E  West: 78.95°E
 */

module.exports = {
  // ── Identity ──────────────────────────────────────────────────────────────
  name: 'Mandakini River Basin, Kedarnath',
  riverName: 'Mandakini',
  state: 'Uttarakhand',
  country: 'India',

  // ── Geographic Bounding Box ───────────────────────────────────────────────
  bbox: {
    north: 30.75,
    south: 30.55,
    east: 79.15,
    west: 78.95,
  },

  // ── Basin Centroid (used for single-point API calls) ──────────────────────
  center: {
    lat: 30.735,
    lng: 79.067,
  },

  // ── Key Monitoring Points (Mandakini valley cross-section) ────────────────
  // Used for elevation sampling and DEM slope calculation
  monitoringPoints: [
    { lat: 30.735, lng: 79.067, label: 'Kedarnath Town' },
    { lat: 30.680, lng: 79.055, label: 'Gaurikund' },
    { lat: 30.660, lng: 79.048, label: 'Sonprayag' },
    { lat: 30.640, lng: 79.042, label: 'Tilwara' },
    { lat: 30.620, lng: 79.036, label: 'Agastmuni' },
    { lat: 30.600, lng: 79.031, label: 'Rudraprayag' },
    { lat: 30.720, lng: 79.080, label: 'Upper Basin North' },
    { lat: 30.750, lng: 79.100, label: 'Glacier Zone' },
    { lat: 30.570, lng: 79.020, label: 'Lower Valley' },
    { lat: 30.650, lng: 79.070, label: 'Mid Valley' },
  ],

  // ── Terrain Parameters ────────────────────────────────────────────────────
  dangerElevationM: 3540,       // River bed at Kedarnath town (mASL)
  baselineValleySlope: 0.08,    // Fallback slope for Mandakini valley (m/m) if DEM unavailable
  urbanSpreadRadiusKm: 1.5,     // Overpass query radius for street-level flood spread

  // ── Rainfall Thresholds (mm/hr) ───────────────────────────────────────────
  rainfall: {
    criticalMmHr: 25,   // RED alert
    warningMmHr: 10,    // ORANGE alert
    watchMmHr: 5,       // YELLOW watch
  },

  // ── Soil Saturation Thresholds (m³/m³ volumetric water content) ──────────
  soil: {
    critical: 0.40,    // Ground fully saturated — runoff immediate
    warning: 0.30,     // Near saturation
    normal: 0.20,      // Moderate moisture
    defaultFallback: 0.35, // Used when SMAP data unavailable
  },

  // ── Flood Risk Score Weights (must sum to 1.0) ────────────────────────────
  // current_rain × w1 + 24h_forecast × w2 + soil × w3 + terrain × w4
  weights: {
    currentRain: 0.35,
    forecast24h: 0.30,
    soilSaturation: 0.25,
    terrainSlope: 0.10,
  },

  // ── Risk Score → Alert Level Mapping ─────────────────────────────────────
  riskLevels: {
    red: 75,    // score ≥ 75 → RED + evacuation order
    orange: 50, // score ≥ 50 → ORANGE alert
    yellow: 25, // score ≥ 25 → YELLOW watch
    // score < 25 → GREEN / clear
  },

  // ── Pipeline Polling Interval ─────────────────────────────────────────────
  pipelineIntervalMs: 10 * 60 * 1000, // 10 minutes

  // ── Water Depth Estimation (Manning's Equation simplified) ───────────────
  // Used in urban flood spread: depth = (Q / (W × V)) where V ≈ k × slope^0.5
  manning: {
    n: 0.035,           // Manning's n for natural channels (Himalayan rivers)
    channelWidthM: 15,  // Average Mandakini channel width in town
    bankfullDepthM: 2.5, // Normal bankfull depth at Kedarnath
  },
};
