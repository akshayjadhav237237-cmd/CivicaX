const { OpenAI } = require('openai');

/**
 * Builds a fallback plain-text summary based on the alert level templates.
 * 
 * @param {Object} predictionData 
 * @returns {string} Factual summary
 */
function buildFallbackSummary(predictionData) {
  const zone = predictionData.zoneName || 'Unknown Zone';
  const alertLevel = (predictionData.alertLevel || 'green').toLowerCase();

  // Extract parameters safely with fallbacks
  const riverVelocity = predictionData.riverStatus?.velocityMs !== undefined 
    ? predictionData.riverStatus.velocityMs 
    : (predictionData.riverVelocity || 0);

  const capacity = predictionData.riverStatus?.overflowRatio !== undefined 
    ? predictionData.riverStatus.overflowRatio 
    : (predictionData.capacity !== undefined ? predictionData.capacity : 0);

  const populationAtRisk = predictionData.populationAtRisk !== undefined 
    ? predictionData.populationAtRisk 
    : 0;

  const etaMinutes = predictionData.riverStatus?.etaMinutes !== undefined 
    ? predictionData.riverStatus.etaMinutes 
    : (predictionData.etaMinutes || 0);

  if (alertLevel === 'green') {
    return `ALL CLEAR: ${zone} river within safe limits at ${riverVelocity} m/s.`;
  } else if (alertLevel === 'yellow') {
    return `WATCH: Elevated rainfall in ${zone}. Monitor closely.`;
  } else if (alertLevel === 'orange') {
    // Determine capacity percentage (ratio vs percentage)
    const capPercent = capacity <= 2 ? Math.round(capacity * 100) : Math.round(capacity);
    return `WARNING: ${zone} at ${capPercent}% capacity. ${populationAtRisk} people at risk. Prepare evacuation routes.`;
  } else if (alertLevel === 'red') {
    const eta = Math.round(etaMinutes);
    return `CRITICAL: Flooding imminent in ${zone}. Water arriving in ${eta} minutes. Evacuate immediately.`;
  } else {
    return `ALL CLEAR: ${zone} river within safe limits at ${riverVelocity} m/s.`;
  }
}

/**
 * Generates a flood alert summary using OpenAI gpt-4o or falls back to templates.
 * 
 * @param {Object} predictionData 
 * @returns {Promise<string>} Summary string
 */
async function generateFloodSummary(predictionData) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[OpenAI] Missing OPENAI_API_KEY. Using fallback summary.');
    return buildFallbackSummary(predictionData);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const zoneName = predictionData.zoneName || 'Unknown';
    const alertLevel = predictionData.alertLevel || 'green';

    const rainfallCurrent = predictionData.rainfall?.current !== undefined 
      ? predictionData.rainfall.current 
      : (predictionData.rainfallCurrent || 0);

    const soilSaturation = predictionData.soilMoisture?.saturationPercent !== undefined 
      ? predictionData.soilMoisture.saturationPercent 
      : (predictionData.soilSaturation || 0);

    const riverVelocity = predictionData.riverStatus?.velocityMs !== undefined 
      ? predictionData.riverStatus.velocityMs 
      : (predictionData.riverVelocity || 0);

    const capacity = predictionData.riverStatus?.overflowRatio !== undefined 
      ? predictionData.riverStatus.overflowRatio 
      : (predictionData.capacity !== undefined ? predictionData.capacity : 0);

    const isOverflowing = predictionData.riverStatus?.isOverflowing !== undefined 
      ? predictionData.riverStatus.isOverflowing 
      : (predictionData.isOverflowing || false);

    const etaMinutes = predictionData.riverStatus?.etaMinutes !== undefined 
      ? predictionData.riverStatus.etaMinutes 
      : (predictionData.etaMinutes || 0);

    const affectedStreetsCount = predictionData.urbanImpact?.totalAffectedStreets !== undefined 
      ? predictionData.urbanImpact.totalAffectedStreets 
      : (predictionData.urbanImpact?.affectedStreets?.length !== undefined 
          ? predictionData.urbanImpact.affectedStreets.length 
          : (predictionData.affectedStreetsCount || 0));

    const maxWaterDepth = predictionData.urbanImpact?.maxDepthM !== undefined 
      ? predictionData.urbanImpact.maxDepthM 
      : (predictionData.maxWaterDepth || 0);

    const populationAtRisk = predictionData.populationAtRisk !== undefined 
      ? predictionData.populationAtRisk 
      : 0;

    const capacityPercent = capacity <= 2 ? Math.round(capacity * 100) : Math.round(capacity);

    const prompt = `Generate a plain-English flood warning summary for the following prediction data:
- Zone Name: ${zoneName}
- Alert Level: ${alertLevel}
- Current Rainfall: ${rainfallCurrent} mm/hr
- Soil Saturation: ${soilSaturation}%
- River Velocity: ${riverVelocity} m/s
- River Capacity (Overflow Ratio): ${capacity} (${capacityPercent}% capacity)
- Is River Overflowing: ${isOverflowing}
- ETA to downstream impact (Minutes): ${etaMinutes} minutes
- Affected Streets Count: ${affectedStreetsCount}
- Maximum Water Depth: ${maxWaterDepth} m
- Population at Risk: ${populationAtRisk} people

Rules to follow:
1. Be direct and factual.
2. Use urgent language only for orange/red alert levels.
3. Mention specific numbers (e.g. capacity, population, velocity, depth, eta, rainfall).
4. End with the single most critical action needed.
5. Max 60 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI flood summary generator for the CivicaX platform. Your summaries are direct, factual, and strictly follow the requested rules.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response structure from OpenAI API');
    }
  } catch (error) {
    console.warn('[OpenAI] Summary generation failed:', error.message);
    return buildFallbackSummary(predictionData);
  }
}

module.exports = {
  generateFloodSummary,
  buildFallbackSummary
};
