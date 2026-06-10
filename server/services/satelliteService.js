/**
 * Satellite data service — fetches real precipitation and weather data.
 *
 * INTEGRATION STATUS:
 * - OpenWeatherMap: REQUIRES API KEY (register at https://openweathermap.org/api, free tier available)
 * - NASA LANCE: REQUIRES NASA Earthdata token (register at https://earthdata.nasa.gov)
 * - NASA SMAP: REQUIRES NASA Earthdata account (same registration)
 *
 * When API keys are not configured, this service returns { configured: false } status objects
 * so the frontend can show proper "Integration Required" notices.
 */
const axios = require('axios');
const logger = require('../config/logger');

const getPrecipitationData = async (lat = 18.7557, lng = 73.4091) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&hourly=precipitation,rain&forecast_days=1`;
    const response = await axios.get(url);
    const data = response.data;
    
    // Extract rainfall from response.hourly.rain[0]
    const precipitationRate = data?.hourly?.rain?.[0] || 0;
    // Extract temperature from response.current.temperature_2m
    const temperature = data?.current?.temperature_2m;
    
    return {
      configured: true,
      precipitationRate,
      unit: 'mm/hr',
      temperature,
      humidity: null, // Open-Meteo URL provided does not include humidity
      description: 'Fetched from Open-Meteo',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('[SatelliteService] Open-Meteo API error:', err.message);
    return { configured: true, error: 'API call failed', message: err.message };
  }
};

/**
 * Returns soil moisture data from NASA SMAP satellite.
 * REQUIRES: NASA Earthdata account at https://earthdata.nasa.gov
 * The actual endpoint is NASA's SMAP Level-3 product via OPeNDAP or CMR API.
 *
 * @returns {Object} Soil moisture data or unconfigured status
 */
const getSoilMoistureData = async () => {
  if (!process.env.NASA_EARTHDATA_TOKEN) {
    logger.warn('[SatelliteService] NASA Earthdata token not configured. Soil moisture data unavailable.');
    return {
      configured: false,
      source: 'NASA SMAP Earthdata',
      message: 'Soil moisture data requires a NASA Earthdata account and token. Register at https://earthdata.nasa.gov',
      setupKey: 'NASA_EARTHDATA_TOKEN',
    };
  }

  // NOTE: When configured, this would call:
  // https://n5eil01u.ecs.nsidc.org/SMAP/SPL3SMP.008/<date>/SMAP_L3_SM_P_<date>_R18290_001.h5
  // via the NASA CMR search API at https://cmr.earthdata.nasa.gov/search/granules.json
  // For implementation, use the earthaccess Python library or NASA's CMR JSON API with 6-month look-ahead
  return {
    configured: true,
    soilMoistureIndex: null,
    unit: 'm³/m³',
    message: 'NASA SMAP token found but integration requires additional setup. See SETUP.md.',
  };
};

/**
 * Computes ground saturation status from soil moisture index.
 * @param {number|null} soilMoistureIndex
 * @returns {string} Saturation status
 */
const computeSaturationStatus = (soilMoistureIndex) => {
  if (soilMoistureIndex === null || soilMoistureIndex === undefined) return 'awaiting_feed';
  if (soilMoistureIndex > 0.45) return 'saturated';
  if (soilMoistureIndex > 0.35) return 'near_saturation';
  if (soilMoistureIndex > 0.20) return 'moderate';
  return 'dry';
};

const getSatelliteStatus = async (lat, lng) => {
  const [precipitation, soilMoisture] = await Promise.all([
    getPrecipitationData(lat, lng),
    getSoilMoistureData(),
  ]);

  const soilIndex = soilMoisture.configured ? soilMoisture.soilMoistureIndex : null;
  const saturationStatus = computeSaturationStatus(soilIndex);

  return {
    precipitation,
    soilMoisture,
    saturationStatus: {
      status: saturationStatus,
      threshold: 0.45,
      current: soilIndex,
      unit: 'm³/m³',
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = { getSatelliteStatus, getPrecipitationData, getSoilMoistureData };
