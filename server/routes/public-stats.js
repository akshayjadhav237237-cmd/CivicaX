const express = require('express');
const prisma = require('../config/prisma');
const router = express.Router();

const { DEMO_PUBLIC_STATS } = require('../shared/mockData');

router.get('/public', async (_req, res) => {
  res.json({
    success: true,
    data: DEMO_PUBLIC_STATS || {
      activeAlerts: 3,
      resolvedGrievances: 1840,
      safeZones: 5,
      activeResponders: 450,
      safeZonesCapacity: 7800,
      safeZonesAvailable: 6890,
    },
    message: 'Public stats retrieved successfully'
  });
});

module.exports = router;
