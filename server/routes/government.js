/**
 * Government Command Center routes
 * Role required: government, admin for all endpoints
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { calculateResources } = require('../services/resourceCalculator');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// All government routes require authentication + government/admin role
router.use(authenticate, roleGuard('government', 'admin'));

/**
 * POST /api/v1/government/resource-estimate
 * Input: { population, disasterType, severityLevel }
 * Output: resource breakdown with formula results
 */
router.post('/resource-estimate', async (req, res) => {
  try {
    const schema = z.object({
      population: z.number().positive(),
      disasterType: z.enum(['flash_flood', 'landslide', 'both']),
      severityLevel: z.enum(['moderate', 'severe', 'catastrophic']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const result = calculateResources(parsed.data);
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'RESOURCE_ESTIMATE', payload: parsed.data },
    });
    res.json({ success: true, data: result, message: 'Resource estimate calculated' });
  } catch (err) {
    logger.error('Resource estimate error:', err);
    res.status(500).json({ success: false, error: 'Calculation failed', code: 'CALC_ERROR' });
  }
});

/**
 * PUT /api/v1/government/safe-zones/:id/activate
 * Activates a relief camp and emits WebSocket event
 */
router.put('/safe-zones/:id/activate', async (req, res) => {
  try {
    const schema = z.object({ status: z.enum(['available', 'activated', 'at_capacity']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });

    const safeZone = await prisma.safeZone.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'ACTIVATE_CAMP', payload: { safeZoneId: safeZone.id, name: safeZone.name, status: safeZone.status } },
    });

    const io = req.app.get('io');
    io.emit('zone:status-change', { type: 'safe_zone_status', safeZone });

    logger.info(`Safe zone ${safeZone.name} status changed to ${safeZone.status} by ${req.user.email}`);
    res.json({ success: true, data: safeZone, message: `Camp ${safeZone.status === 'activated' ? 'activated' : 'status updated'}` });
  } catch (err) {
    logger.error('Safe zone activate error:', err);
    res.status(500).json({ success: false, error: 'Failed to update safe zone', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/government/audit-log
 * Returns audit log (append-only — cannot be modified)
 */
router.get('/audit-log', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: { logs, total, page: parseInt(page) }, message: 'Audit log retrieved' });
  } catch (err) {
    logger.error('Audit log error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit log', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/government/impact-summary
 * Returns population in red zones, civic issues count, urgent safety reports, safe zone capacity
 */
router.get('/impact-summary', async (_req, res) => {
  try {
    const [urgentSafety, activeCivic, safeZones] = await Promise.all([
      prisma.safetyReport.count({ where: { urgency: 'immediate', status: 'pending' } }),
      prisma.civicReport.count({ where: { status: { in: ['submitted', 'assigned', 'in_progress'] } } }),
      prisma.safeZone.findMany({ select: { capacity: true, status: true } }),
    ]);

    const availableCapacity = safeZones
      .filter(z => z.status === 'available' || z.status === 'activated')
      .reduce((sum, z) => sum + z.capacity, 0);

    res.json({
      success: true,
      data: {
        urgentSafetyReports: urgentSafety,
        activeCivicIssues: activeCivic,
        safeZoneCapacityAvailable: availableCapacity,
        note: 'Population in red zones calculated client-side from zone geometries × density table',
      },
      message: 'Impact summary retrieved',
    });
  } catch (err) {
    logger.error('Impact summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch impact summary', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/government/users
 * Lists all users (admin only effectively, but government can see their team)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, city: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users, message: 'Users retrieved' });
  } catch (err) {
    logger.error('Users list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users', code: 'DB_ERROR' });
  }
});

module.exports = router;
