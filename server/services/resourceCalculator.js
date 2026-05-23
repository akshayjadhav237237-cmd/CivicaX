/**
 * Resource calculator service — pure formula logic, always works regardless of external configuration.
 * Based on NDMA (National Disaster Management Authority) resource planning guidelines.
 *
 * @param {Object} params
 * @param {number} params.population - Estimated affected population
 * @param {string} params.disasterType - 'flash_flood' | 'landslide' | 'both'
 * @param {string} params.severityLevel - 'moderate' | 'severe' | 'catastrophic'
 * @returns {Object} Resource estimates breakdown
 */
const calculateResources = ({ population, disasterType, severityLevel }) => {
  const pop = Math.max(0, parseInt(population) || 0);

  // Severity multipliers
  const severityMultiplier = {
    moderate: 1.0,
    severe: 1.5,
    catastrophic: 2.0,
  }[severityLevel] || 1.0;

  const adjustedPop = Math.ceil(pop * severityMultiplier);

  // Rescue boats (flood-specific)
  const rescueBoats = ['flash_flood', 'both'].includes(disasterType)
    ? Math.ceil(adjustedPop / 15)
    : 0;

  // Ambulances — 5% injury estimate
  const ambulances = Math.ceil(adjustedPop * 0.05);

  // Relief kits — 3 days per person
  const reliefKits = adjustedPop * 3;

  // Medical personnel — 2% of affected population
  const medicalPersonnel = Math.ceil(adjustedPop * 0.02);

  // Budget in INR
  const budgetINR = (rescueBoats * 50000)
    + (ambulances * 30000)
    + (reliefKits * 500)
    + (medicalPersonnel * 5000 * 7); // 7 days

  return {
    population: pop,
    adjustedPopulation: adjustedPop,
    severityMultiplier,
    disasterType,
    severityLevel,
    resources: {
      rescueBoats,
      ambulances,
      reliefKits,
      medicalPersonnel,
    },
    budgetINR,
    breakdown: {
      boatsCost: rescueBoats * 50000,
      ambulancesCost: ambulances * 30000,
      kitsCost: reliefKits * 500,
      personnelCost: medicalPersonnel * 5000 * 7,
    },
    note: 'Estimates based on standard NDMA resource planning guidelines. Adjust multipliers in config to match your state protocol.',
  };
};

module.exports = { calculateResources };
