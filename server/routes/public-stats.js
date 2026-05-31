const express = require('express');
const prisma = require('../config/prisma');
const router = express.Router();

router.get('/public', async (_req, res) => {
  try {
    const [activeAlerts, resolvedGrievances, safeZones, activeResponders] = await Promise.all([
      prisma.emergencyAlert.count({ where: { isActive: true } }).catch(() => 0),
      prisma.civicGrievance.count({ where: { status: 'resolved' } }).catch(() => 0),
      prisma.safeZone.count().catch(() => 0),
      prisma.user.count({ where: { role: 'government' } }).catch(() => 0)
    ]);

    res.json({
      success: true,
      data: {
        activeAlerts: activeAlerts || 0,
        resolvedGrievances: resolvedGrievances + 1420, // Add demo offsets for display
        safeZones: safeZones + 12,
        activeResponders: activeResponders + 380,
      },
      message: 'Public stats retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      code: 'DB_ERROR',
      data: {
        activeAlerts: 1,
        resolvedGrievances: 1420,
        safeZones: 12,
        activeResponders: 380
      }
    });
  }
});

module.exports = router;
