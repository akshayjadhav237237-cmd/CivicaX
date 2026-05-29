/**
 * Safety Watch routes — Pillar III: Public Security
 * Handles safety reports, confirmations, GeoJSON, and stats
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { sendSMS } = require('../services/notificationService');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/safety'),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const reportSchema = z.object({
  incidentType: z.enum(['civil_unrest', 'suspicious_activity', 'medical_emergency', 'violence', 'road_accident', 'other']),
  description: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  urgency: z.enum(['immediate', 'non_urgent']).optional().default('non_urgent'),
});

/**
 * GET /api/v1/safety/reports
 * Returns safety reports — anonymized for public, full data for admin/government
 */
router.get('/reports', optionalAuth, async (req, res) => {
  try {
    const { timeframe = '7d', page = 1, limit = 50 } = req.query;
    const daysMap = { '24h': 1, '7d': 7, '30d': 30 };
    const days = daysMap[timeframe] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const isPrivileged = req.user && ['government', 'admin'].includes(req.user.role);

    const reports = await prisma.safetyReport.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        incidentType: true,
        latitude: true,
        longitude: true,
        address: true,
        urgency: true,
        credibilityScore: true,
        status: true,
        createdAt: true,
        description: isPrivileged ? true : false, // Anonymize description for public
        userId: isPrivileged ? true : false,
        user: isPrivileged ? { select: { name: true, phone: true } } : false,
      },
      orderBy: [{ urgency: 'desc' }, { credibilityScore: 'desc' }, { createdAt: 'desc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ success: true, data: reports, message: 'Safety reports retrieved' });
  } catch (err) {
    logger.error('Error fetching safety reports:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reports', code: 'DB_ERROR' });
  }
});

/**
 * POST /api/v1/safety/reports
 * Creates a new safety report. If urgency=immediate, emits WebSocket event to government dashboard.
 */
router.post('/reports', optionalAuth, upload.array('images', 2), async (req, res) => {
  try {
    const body = {
      ...req.body,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
    };
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }

    const images = req.files?.map(f => `/uploads/safety/${f.filename}`) || [];
    const report = await prisma.safetyReport.create({
      data: { ...parsed.data, userId: req.user?.id, images },
    });

    // Emit urgent event to government dashboard
    if (parsed.data.urgency === 'immediate') {
      const io = req.app.get('io');
      io.emit('safety:urgent', { reportId: report.id, incidentType: report.incidentType, latitude: report.latitude, longitude: report.longitude, timestamp: report.createdAt });

      // SMS: notify government + admin users with phones
      (async () => {
        try {
          const govUsers = await prisma.user.findMany({
            where: { role: { in: ['government', 'admin'] }, phone: { not: null } },
            select: { phone: true },
          });
          const location = parsed.data.address || `${parsed.data.latitude.toFixed(4)}, ${parsed.data.longitude.toFixed(4)}`;
          const msg = `⚠️ URGENT Safety Report — CivicaX: ${report.incidentType.replace('_', ' ')} at ${location}. Immediate response required.`;
          for (const u of govUsers) {
            await sendSMS(u.phone, msg);
          }
        } catch (smsErr) {
          logger.error('[SMS] Urgent safety report SMS failed:', smsErr.message);
        }
      })();
    }

    logger.info(`Safety report created: ${report.incidentType} (${report.urgency}) at ${report.latitude},${report.longitude}`);
    res.status(201).json({ success: true, data: report, message: 'Safety report submitted' });
  } catch (err) {
    logger.error('Error creating safety report:', err);
    res.status(500).json({ success: false, error: 'Failed to submit report', code: 'DB_ERROR' });
  }
});

/**
 * POST /api/v1/safety/reports/:id/confirm
 * Increments the credibility score of a report
 */
router.post('/reports/:id/confirm', optionalAuth, async (req, res) => {
  try {
    const report = await prisma.safetyReport.update({
      where: { id: req.params.id },
      data: { credibilityScore: { increment: 1 } },
    });
    res.json({ success: true, data: { credibilityScore: report.credibilityScore }, message: 'Report confirmed' });
  } catch (err) {
    logger.error('Error confirming report:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm report', code: 'DB_ERROR' });
  }
});

/**
 * PUT /api/v1/safety/reports/:id
 * Updates safety report status (admin/government only)
 */
router.put('/reports/:id', authenticate, roleGuard('government', 'admin'), async (req, res) => {
  try {
    const schema = z.object({ status: z.enum(['pending', 'dispatched', 'resolved']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });

    const report = await prisma.safetyReport.update({ where: { id: req.params.id }, data: parsed.data });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'DISPATCH_SAFETY_REPORT', payload: { reportId: report.id, status: report.status } },
    });

    res.json({ success: true, data: report, message: 'Report updated' });
  } catch (err) {
    logger.error('Error updating safety report:', err);
    res.status(500).json({ success: false, error: 'Failed to update report', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/safety/reports/geojson
 * Returns safety reports as GeoJSON for heatmap rendering
 */
router.get('/reports/geojson', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const daysMap = { '24h': 1, '7d': 7, '30d': 30 };
    const days = daysMap[timeframe] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const reports = await prisma.safetyReport.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, incidentType: true, latitude: true, longitude: true, urgency: true, credibilityScore: true, createdAt: true },
    });

    const featureCollection = {
      type: 'FeatureCollection',
      features: reports.map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { id: r.id, incidentType: r.incidentType, urgency: r.urgency, credibilityScore: r.credibilityScore, createdAt: r.createdAt },
      })),
    };
    res.json({ success: true, data: featureCollection, message: 'Safety GeoJSON retrieved' });
  } catch (err) {
    logger.error('Error fetching safety GeoJSON:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch GeoJSON', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/safety/stats
 * Returns aggregated safety report stats
 */
router.get('/stats', async (_req, res) => {
  try {
    const [total, byType, urgent, last24h] = await Promise.all([
      prisma.safetyReport.count(),
      prisma.safetyReport.groupBy({ by: ['incidentType'], _count: { id: true } }),
      prisma.safetyReport.count({ where: { urgency: 'immediate', status: 'pending' } }),
      prisma.safetyReport.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    ]);
    res.json({ success: true, data: { total, byType, urgent, last24h }, message: 'Stats retrieved' });
  } catch (err) {
    logger.error('Error fetching safety stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats', code: 'DB_ERROR' });
  }
});

module.exports = router;
