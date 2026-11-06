/**
 * Health Check Route
 * GET /api/v1/health and GET /health
 *
 * Returns:
 * - System uptime
 * - Memory usage
 * - Database connectivity status ('ONLINE' or 'OFFLINE_DEMO_MODE')
 * - Satellite Disaster Intelligence pipeline status
 * - Service version & environment metadata
 */

const express = require('express');
const router = express.Router();
const { checkDatabaseConnection } = require('../config/prisma');

let getPipelineStatus;
try {
  ({ getPipelineStatus } = require('../modules/pipeline'));
} catch (_err) {
  getPipelineStatus = () => ({ status: 'STANDBY', isRunning: false });
}

router.get('/', async (_req, res) => {
  const startTime = Date.now();
  const dbStatus = await checkDatabaseConnection(2500);
  const pipeline = typeof getPipelineStatus === 'function'
    ? getPipelineStatus()
    : { status: 'STANDBY', isRunning: false };

  const memory = process.memoryUsage();

  res.status(200).json({
    success: true,
    message: 'Server running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    pipeline: pipeline,
    memory: {
      heapUsedMb: +(memory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: +(memory.heapTotal / 1024 / 1024).toFixed(2),
      rssMb: +(memory.rss / 1024 / 1024).toFixed(2),
    },
    latencyMs: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
  });
});

module.exports = router;
