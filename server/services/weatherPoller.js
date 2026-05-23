const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

async function pollOpenMeteo(io) {
  try {
    logger.info('Running Open-Meteo background polling for Emergency Zones...');
    const zones = await prisma.emergencyZone.findMany();
    
    for (const zone of zones) {
      let lat = 18.7557, lng = 73.4091; // Fallback
      try {
        if (zone.geojson?.coordinates?.[0]?.[0]) {
          lng = zone.geojson.coordinates[0][0][0];
          lat = zone.geojson.coordinates[0][0][1];
        }
      } catch (e) {}

      // Fetch from Open-Meteo API — no API key needed
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&hourly=precipitation,rain&forecast_days=1`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status} for zone ${zone.name}`);
      }
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
        await prisma.emergencyZone.update({
          where: { id: zone.id },
          data: { level: newLevel }
        });

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
    }
  } catch (err) {
    logger.error('Error in weather polling cron:', err);
  }
}

function startWeatherPoller(io) {
  // Poll every 5 minutes (300,000 ms)
  setInterval(() => pollOpenMeteo(io), 5 * 60 * 1000);
  
  // Also run immediately on startup after short delay
  setTimeout(() => pollOpenMeteo(io), 2000);
}

module.exports = { startWeatherPoller, pollOpenMeteo };
