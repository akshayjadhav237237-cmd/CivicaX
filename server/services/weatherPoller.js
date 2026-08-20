const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { DEMO_ZONES_GEOJSON } = require('../shared/mockData');

async function pollOpenMeteo(io) {
  try {
    logger.info('Running Open-Meteo background polling for Emergency Zones...');
    let zones = [];
    try {
      zones = await prisma.emergencyZone.findMany();
    } catch (dbErr) {
      logger.debug('[WeatherPoller] Database offline, using demo zones:', dbErr.message);
      zones = DEMO_ZONES_GEOJSON.features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        level: f.properties.level,
        geojson: f.geometry,
      }));
    }

    if (!zones || zones.length === 0) {
      zones = DEMO_ZONES_GEOJSON.features.map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        level: f.properties.level,
        geojson: f.geometry,
      }));
    }
    
    for (const zone of zones) {
      let lat = 30.7346, lng = 79.0669; // Kedarnath fallback
      try {
        if (zone.geojson?.coordinates?.[0]?.[0]) {
          lng = zone.geojson.coordinates[0][0][0];
          lat = zone.geojson.coordinates[0][0][1];
        }
      } catch (e) {}

      // Fetch from Open-Meteo API — no API key needed
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&hourly=precipitation,rain&forecast_days=1`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) continue;
        const data = await response.json();

        const currentHourIndex = new Date().getHours();
        let rain1h = 0;
        if (data?.hourly?.rain && data.hourly.rain.length > currentHourIndex) {
          rain1h = data.hourly.rain[currentHourIndex];
        } else if (data?.hourly?.precipitation) {
          rain1h = data.hourly.precipitation[currentHourIndex];
        }

        const tempC = data?.current?.temperature_2m ?? null;
        logger.info(`[WeatherPoller] Zone "${zone.name}" → rain=${rain1h}mm/hr, temp=${tempC}°C at (${lat.toFixed(3)},${lng.toFixed(3)})`);

        let newLevel = 'green';
        if (rain1h > 50) newLevel = 'red';
        else if (rain1h > 25) newLevel = 'orange';
        else if (rain1h > 10) newLevel = 'yellow';

        if (zone.level !== newLevel) {
          logger.info(`Zone ${zone.name} level changed from ${zone.level} to ${newLevel} due to rain: ${rain1h}mm/hr`);
          prisma.emergencyZone.update({
            where: { id: zone.id },
            data: { level: newLevel }
          }).catch(() => {});

          if (io) {
            io.emit('zone:status-change', {
              type: 'threat_level',
              zoneId: zone.id,
              level: newLevel,
              rain1h,
              tempC,
            });
          }
        }
      } catch (zoneFetchErr) {
        logger.warn(`[WeatherPoller] Fetch error for zone ${zone.name}: ${zoneFetchErr.message}`);
      }
    }
  } catch (err) {
    logger.warn('Error in weather polling cron:', err.message);
  }
}

function startWeatherPoller(io) {
  // Poll every 5 minutes (300,000 ms)
  setInterval(() => pollOpenMeteo(io), 5 * 60 * 1000);
  
  // Also run immediately on startup after short delay
  setTimeout(() => pollOpenMeteo(io), 2000);
}

module.exports = { startWeatherPoller, pollOpenMeteo };
