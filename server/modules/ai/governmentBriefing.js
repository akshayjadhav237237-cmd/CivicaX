const { OpenAI } = require('openai');

/**
 * Builds a structured, plain-text fallback briefing summarizing the situation report points
 * based on the provided predictionData.
 *
 * @param {Object} predictionData - The prediction data object containing hydrology/disaster intelligence
 * @returns {string} Structured plain-text briefing
 */
function buildFallbackBriefing(predictionData) {
  if (!predictionData) {
    return [
      'SITUATION REPORT: GENERAL BRIEFING',
      '1. THREAT LEVEL: No active disaster telemetry available.',
      '2. IMPACTED AREA & POPULATION: Mandakini Basin area is currently unassessed.',
      '3. RESOURCE DEPLOYMENTS: No resources requested at this time.',
      '4. REQUIRED AUTHORIZATIONS: Keep local response units on standby.',
      '5. OPERATIONAL WINDOW: Situation is stable; continue standard observations.'
    ].join('\n');
  }

  const alertLevel = (predictionData.alertLevel || 'green').toUpperCase();
  const zoneName = predictionData.zoneName || 'Mandakini Basin';
  const currentRain = predictionData.rainfall?.current ?? 0;
  const forecastRain = predictionData.rainfall?.forecast24h ?? 0;
  
  const isOverflowing = predictionData.riverStatus?.isOverflowing || false;
  const overflowRatio = predictionData.riverStatus?.overflowRatio ?? 0;
  const eta = predictionData.riverStatus?.etaMinutes ?? 0;

  const popAtRisk = predictionData.populationAtRisk ?? 0;
  const affectedArea = predictionData.urbanImpact?.estimatedAffectedAreaKm2 ?? 0;
  const affectedStreets = predictionData.urbanImpact?.totalAffectedStreets ?? 0;
  const maxDepth = predictionData.urbanImpact?.maxDepthM ?? 0;
  const landslideRiskSegments = predictionData.landslidRisk?.totalHighRiskSegments ?? 0;

  const resources = predictionData.resourcesNeeded || {};
  const boats = resources.rescueBoats ?? 0;
  const ambulances = resources.ambulances ?? 0;
  const kits = resources.reliefKits ?? 0;
  const buses = resources.evacuationBuses ?? 0;

  // 1. Current threat level and what is happening
  let threatDescription = `Current threat level is assessed as ${alertLevel}.`;
  if (currentRain > 0 || forecastRain > 0) {
    threatDescription += ` Active rainfall is measured at ${currentRain} mm/hr with an expected 24-hour total of ${forecastRain} mm.`;
  }
  threatDescription += ` The river is running at ${Math.round(overflowRatio * 100)}% of bankfull capacity${isOverflowing ? ' with active channel overflow detected' : ''}.`;

  // 2. Areas and population affected
  let affectedDescription = `Affected region: ${zoneName}.`;
  if (popAtRisk > 0 || affectedArea > 0 || affectedStreets > 0) {
    affectedDescription += ` Critical flooding threatens an area of approximately ${affectedArea} sq km, putting ${popAtRisk.toLocaleString()} citizens at risk.`;
    if (affectedStreets > 0) {
      affectedDescription += ` Over ${affectedStreets} streets are inundated with water levels peaking at ${maxDepth}m.`;
    }
  } else {
    affectedDescription += ` No active urban areas or populations are currently reported within the threat zone.`;
  }
  if (landslideRiskSegments > 0) {
    affectedDescription += ` Additionally, ${landslideRiskSegments} critical road corridor segments are vulnerable to landslides.`;
  }

  // 3. Resources already needed
  let resourcesDescription = 'No external resources have been requested at the current alert level.';
  if (boats > 0 || ambulances > 0 || kits > 0 || buses > 0) {
    const items = [];
    if (boats > 0) items.push(`${boats} rescue boats`);
    if (buses > 0) items.push(`${buses} evacuation buses`);
    if (ambulances > 0) items.push(`${ambulances} ambulances`);
    if (kits > 0) items.push(`${kits.toLocaleString()} relief kits`);
    resourcesDescription = `Immediate operational requirements include: ${items.join(', ')}.`;
  }

  // 4. Immediate actions the official must authorize
  let actionsDescription = 'Establish continuous monitoring of all satellite and sensor telemetry.';
  if (alertLevel === 'RED' || alertLevel === 'ORANGE') {
    actionsDescription = `Authorize immediate mandatory evacuation of low-lying areas, activate designated safe zones and relief camps, and deploy emergency rescue teams.`;
  } else if (alertLevel === 'YELLOW') {
    actionsDescription = `Authorize standby mobilization of emergency services, alerts to vulnerable riverside communities, and clear key transit pathways.`;
  }

  // 5. Time window before situation worsens
  let timeWindowDescription = 'The situation remains stable, with standard monitoring procedures continuing.';
  if (isOverflowing && eta > 0) {
    timeWindowDescription = `Estimated operational window before downstream flood conditions worsen is approximately ${Math.round(eta)} minutes.`;
  } else if (forecastRain > 25) {
    timeWindowDescription = `Heavy precipitation forecast suggests a critical window of 24 hours before cumulative runoff induces flooding.`;
  }

  return [
    `SITUATION REPORT: ${alertLevel} ALERT`,
    `1. THREAT LEVEL: ${threatDescription}`,
    `2. IMPACTED AREA & POPULATION: ${affectedDescription}`,
    `3. RESOURCE DEPLOYMENTS: ${resourcesDescription}`,
    `4. REQUIRED AUTHORIZATIONS: ${actionsDescription}`,
    `5. OPERATIONAL WINDOW: ${timeWindowDescription}`
  ].join('\n');
}

/**
 * Generates a formal government situation report for a District Collector.
 * Uses OpenAI gpt-4o when process.env.OPENAI_API_KEY is present,
 * and falls back to buildFallbackBriefing on failure or missing key.
 *
 * @param {Object} predictionData - The prediction data object containing hydrology/disaster intelligence
 * @returns {Promise<string>} Situation report text
 */
async function generateGovernmentBriefing(predictionData) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackBriefing(predictionData);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemPrompt = `You are briefing a District Collector during an active disaster. Write a formal 4-5 sentence situation report covering: 1. Current threat level and what is happening 2. Areas and population affected 3. Resources already needed 4. Immediate actions the official must authorize 5. Time window before situation worsens. Use formal government language. Be precise with numbers. Max 120 words.`;
    const userPrompt = `Here is the current prediction data for the disaster situation:\n${JSON.stringify(predictionData, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    if (response && response.choices && response.choices[0]?.message?.content) {
      return response.choices[0].message.content.trim();
    } else {
      throw new Error('Empty or invalid response from OpenAI');
    }
  } catch (error) {
    console.error('[AI BRIEFING] Failed to generate GPT-4o briefing. Using fallback:', error.message);
    return buildFallbackBriefing(predictionData);
  }
}

module.exports = {
  generateGovernmentBriefing,
  buildFallbackBriefing
};
