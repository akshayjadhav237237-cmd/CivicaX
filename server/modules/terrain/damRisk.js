/**
 * damRisk.js — Check Dam Breach Vulnerability Calculator
 * Calculates structural and hydraulic breach risk scores for check dams in the Mandakini Basin.
 */
const logger = require('../../config/logger');
const prisma = require('../../config/prisma');

// Defined check dams along Mandakini River & tributaries
const DAMS = [
  { id: 'dam-01', name: 'Chorabari Tal (Glacial Lake)', location: 'Kedarnath Peak (Upper Valley)', lat: 30.748, lng: 79.062, capM3: 500000, maxFlow: 50 },
  { id: 'dam-02', name: 'Kedarnath Town Check Dam', location: 'Town Inlet', lat: 30.738, lng: 79.065, capM3: 120000, maxFlow: 35 },
  { id: 'dam-03', name: 'Rambara Weir', location: 'Mid Basin Gorge', lat: 30.692, lng: 79.058, capM3: 85000, maxFlow: 20 },
  { id: 'dam-04', name: 'Sonprayag Flood Regulator', location: 'Tributary Confluence', lat: 30.662, lng: 79.049, capM3: 250000, maxFlow: 80 }
];

/**
 * Calculates current breach risk index for all check dams.
 * Connects with rainfall data from latest snapshots.
 */
async function computeDamRisks() {
  logger.info('[DamRisk] Analyzing check dam breach vulnerability metrics...');

  let currentRain = 0.0;
  try {
    const latestSnapshot = await prisma.floodSnapshot.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    if (latestSnapshot) {
      currentRain = latestSnapshot.rainfallMmHr || 0;
    }
  } catch (err) {
    logger.warn('[DamRisk] Error querying rain telemetry:', err.message);
  }

  return DAMS.map((dam) => {
    // Dynamic simulation variables based on actual rainfall
    let waterLevelPct = 40.0 + currentRain * 2.2;
    if (dam.id === 'dam-01') {
      // Chorabari Tal gathers significant glacial melt + rain runoff
      waterLevelPct = 45.0 + currentRain * 2.8;
    }
    waterLevelPct = Math.min(100.0, parseFloat(waterLevelPct.toFixed(2)));

    // Structural integrity degrades under heavy loads (heavy rainfall)
    let structuralIntegrity = 0.95 - (currentRain * 0.005);
    if (dam.id === 'dam-02') {
      structuralIntegrity -= 0.05; // historical vulnerability
    }
    structuralIntegrity = Math.max(0.2, parseFloat(structuralIntegrity.toFixed(2)));

    const inflowRate = parseFloat((currentRain * 1.5 + (dam.capM3 * 0.0001)).toFixed(2));
    const outflowRate = parseFloat((inflowRate * Math.min(1.0, (waterLevelPct / 90))).toFixed(2));

    // Composite risk score formulation
    const levelFactor = waterLevelPct / 100;
    const integrityFactor = 1 - structuralIntegrity;
    const flowStressFactor = Math.min(1.0, inflowRate / dam.maxFlow);

    // Weights: level=0.4, structural integrity=0.4, stress factor=0.2
    const riskScore = parseFloat(((levelFactor * 0.4 + integrityFactor * 0.4 + flowStressFactor * 0.2) * 1.0).toFixed(2));

    let breachStatus = 'safe'; // 'safe' | 'watch' | 'critical'
    if (riskScore >= 0.70) breachStatus = 'critical';
    else if (riskScore >= 0.40) breachStatus = 'watch';

    return {
      ...dam,
      waterLevelPct,
      structuralIntegrity,
      inflowRate,
      outflowRate,
      riskScore,
      status: breachStatus,
      updatedAt: new Date().toISOString()
    };
  });
}

module.exports = { computeDamRisks };
