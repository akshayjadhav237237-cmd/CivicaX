/**
 * openMeteo.js — Open-Meteo Precipitation Fetcher
 *
 * Fetches real-time and 48-hour forecast precipitation for the Mandakini basin.
 * NO API KEY REQUIRED. Free, no rate limiting for basic use.
 *
 * API docs: https://open-meteo.com/en/docs
 */

const logger = require('../../config/logger');
const { center, bbox, rainfall } = require('../../shared/kedarnath.config');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 12000;

/**
 * Fetch precipitation data for the Kedarnath basin center point.
 *
 * @returns {Promise<Object>} Precipitation payload
 * {
 *   source: 'open_meteo',
 *   currentMmHr: number,         // current hour precipitation rate
 *   forecast24hTotal: number,    // sum of next 24 hourly values
 *   forecast48hTotal: number,    // sum of next 48 hourly values
 *   hourlySeries: Array<{time, precipMm, rainMm}>,
 *   temperature: number|null,
 *   windSpeedKmh: number|null,
 *   humidity: number|null,
 *   fetchedAt: string ISO8601,
 *   error: null|string,
 * }
 */
async function fetchOpenMeteo() {
  const params = new URLSearchParams({
    latitude: center.lat,
    longitude: center.lng,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
    hourly: 'precipitation,rain,snowfall',
    forecast_days: '2',
    timezone: 'Asia/Kolkata',
  });

  const url = `${OPEN_METEO_BASE}?${params.toString()}`;

  try {
    logger.info(`[OpenMeteo] Fetching precipitation for Kedarnath (${center.lat}, ${center.lng})`);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'CivicaX-DisasterPipeline/1.0' },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // Current hour index
    const now = new Date();
    const currentHourIndex = now.getHours();

    // Extract hourly arrays
    const times = data.hourly?.time || [];
    const precipArr = data.hourly?.precipitation || [];
    const rainArr = data.hourly?.rain || [];

    // Build the hourly series (next 48h)
    const hourlySeries = times.map((t, i) => ({
      time: t,
      precipMm: precipArr[i] ?? 0,
      rainMm: rainArr[i] ?? 0,
    }));

    // Current precipitation rate (use whichever array has data)
    const currentMmHr =
      (data.current?.precipitation ?? null) !== null
        ? data.current.precipitation
        : (rainArr[currentHourIndex] ?? precipArr[currentHourIndex] ?? 0);

    // Forecast totals
    const next24 = hourlySeries.slice(0, 24).reduce((sum, h) => sum + h.precipMm, 0);
    const next48 = hourlySeries.slice(0, 48).reduce((sum, h) => sum + h.precipMm, 0);

    logger.info(
      `[OpenMeteo] ✅ Current: ${currentMmHr.toFixed(1)} mm/hr | 24h: ${next24.toFixed(1)} mm | 48h: ${next48.toFixed(1)} mm`
    );

    return {
      source: 'open_meteo',
      currentMmHr: parseFloat(currentMmHr.toFixed(2)),
      forecast24hTotal: parseFloat(next24.toFixed(2)),
      forecast48hTotal: parseFloat(next48.toFixed(2)),
      hourlySeries: hourlySeries.slice(0, 48),
      temperature: data.current?.temperature_2m ?? null,
      windSpeedKmh: data.current?.wind_speed_10m ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      fetchedAt: new Date().toISOString(),
      error: null,
    };
  } catch (err) {
    logger.error(`[OpenMeteo] ❌ Fetch failed: ${err.message}`);
    return {
      source: 'open_meteo',
      currentMmHr: 0,
      forecast24hTotal: 0,
      forecast48hTotal: 0,
      hourlySeries: [],
      temperature: null,
      windSpeedKmh: null,
      humidity: null,
      fetchedAt: new Date().toISOString(),
      error: err.message,
    };
  }
}

module.exports = { fetchOpenMeteo };
