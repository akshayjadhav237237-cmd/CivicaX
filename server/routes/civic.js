/**
 * Civic Manager routes — Pillar II: Infrastructure Reporting
 * Handles civic reports CRUD, GeoJSON, departments, and stats
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Multer upload configuration — stores to /uploads/civic/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/civic'),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Only images allowed'));
}});

const reportSchema = z.object({
  category: z.enum(['pothole', 'broken_streetlight', 'waste_management', 'drainage', 'water_supply', 'other']),
  description: z.string().min(10),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
});

/**
 * GET /api/v1/civic/reports
 * Returns all civic reports with optional filters: ?category=&status=&userId=
 * Role required: authenticated
 */
router.get('/reports', authenticate, async (req, res) => {
  try {
    const { category, status, userId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (req.user.role === 'citizen') where.userId = req.user.id; // citizens only see own reports unless filtered

    const [reports, total] = await Promise.all([
      prisma.civicReport.findMany({
        where,
        include: { user: { select: { id: true, name: true } }, department: true, timeline: { orderBy: { changedAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.civicReport.count({ where }),
    ]);

    res.json({ success: true, data: { reports, total, page: parseInt(page), limit: parseInt(limit) }, message: 'Reports retrieved' });
  } catch (err) {
    logger.error('Error fetching civic reports:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reports', code: 'DB_ERROR' });
  }
});

/**
 * POST /api/v1/civic/reports
 * Creates a new civic report with optional image uploads.
 * Input: multipart form with category, description, latitude, longitude, address + up to 3 images
 * Role required: authenticated citizen
 */
router.post('/reports', authenticate, upload.array('images', 3), async (req, res) => {
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

    const images = req.files?.map(f => `/uploads/civic/${f.filename}`) || [];
    // Generate a human-friendly report ID
    const reportCount = await prisma.civicReport.count();
    const reportCode = `CIV-2026-${String(reportCount + 1).padStart(5, '0')}`;

    const report = await prisma.civicReport.create({
      data: { ...parsed.data, userId: req.user.id, images },
      include: { user: { select: { id: true, name: true } } },
    });

    // Create initial timeline entry
    await prisma.civicReportTimeline.create({
      data: { reportId: report.id, status: 'submitted', note: 'Report submitted', changedById: req.user.id },
    });

    logger.info(`Civic report created: ${report.id} by ${req.user.email}`);
    res.status(201).json({ success: true, data: { ...report, reportCode }, message: `Report ${reportCode} submitted successfully` });
  } catch (err) {
    logger.error('Error creating civic report:', err);
    res.status(500).json({ success: false, error: 'Failed to create report', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/civic/reports/geojson
 * Returns all civic reports as GeoJSON FeatureCollection for map rendering
 */
router.get('/reports/geojson', optionalAuth, async (_req, res) => {
  try {
    const reports = await prisma.civicReport.findMany({
      select: { id: true, category: true, status: true, latitude: true, longitude: true, address: true, createdAt: true },
    });
    const featureCollection = {
      type: 'FeatureCollection',
      features: reports.map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { id: r.id, category: r.category, status: r.status, address: r.address, createdAt: r.createdAt },
      })),
    };
    res.json({ success: true, data: featureCollection, message: 'GeoJSON retrieved' });
  } catch (err) {
    logger.error('Error fetching civic GeoJSON:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch GeoJSON', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/civic/reports/:id
 * Returns single report with full timeline
 */
router.get('/reports/:id', authenticate, async (req, res) => {
  try {
    const report = await prisma.civicReport.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true } }, department: true, timeline: { orderBy: { changedAt: 'asc' }, include: { changedBy: { select: { id: true, name: true } } } } },
    });
    if (!report) return res.status(404).json({ success: false, error: 'Report not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: report, message: 'Report retrieved' });
  } catch (err) {
    logger.error('Error fetching report:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch report', code: 'DB_ERROR' });
  }
});

/**
 * PUT /api/v1/civic/reports/:id
 * Updates a report (assign department, change status, assign officer)
 * Role required: department_op, government, admin
 */
router.put('/reports/:id', authenticate, roleGuard('department_op', 'government', 'admin'), async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(['submitted', 'assigned', 'in_progress', 'resolved']).optional(),
      departmentId: z.string().uuid().optional(),
      assignedOfficer: z.string().optional(),
      note: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });

    const { note, ...updateData } = parsed.data;
    if (updateData.status === 'resolved') updateData.resolvedAt = new Date();

    const report = await prisma.civicReport.update({
      where: { id: req.params.id },
      data: updateData,
      include: { department: true },
    });

    if (parsed.data.status) {
      await prisma.civicReportTimeline.create({
        data: { reportId: report.id, status: parsed.data.status, note: note || `Status updated to ${parsed.data.status}`, changedById: req.user.id },
      });
    }

    res.json({ success: true, data: report, message: 'Report updated' });
  } catch (err) {
    logger.error('Error updating report:', err);
    res.status(500).json({ success: false, error: 'Failed to update report', code: 'DB_ERROR' });
  }
});

/**
 * DELETE /api/v1/civic/reports/:id
 * Deletes a report — admin only
 */
router.delete('/reports/:id', authenticate, roleGuard('admin'), async (req, res) => {
  try {
    await prisma.civicReport.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null, message: 'Report deleted' });
  } catch (err) {
    logger.error('Error deleting report:', err);
    res.status(500).json({ success: false, error: 'Failed to delete report', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/civic/departments
 * Returns list of city departments
 */
router.get('/departments', async (_req, res) => {
  try {
    const depts = await prisma.civicDepartment.findMany();
    res.json({ success: true, data: depts, message: 'Departments retrieved' });
  } catch (err) {
    logger.error('Error fetching departments:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch departments', code: 'DB_ERROR' });
  }
});

/**
 * GET /api/v1/civic/stats
 * Returns aggregate stats: total reports by category, avg resolution time
 */
router.get('/stats', async (_req, res) => {
  try {
    const [byCategory, byStatus, total] = await Promise.all([
      prisma.civicReport.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.civicReport.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.civicReport.count(),
    ]);

    const resolved = await prisma.civicReport.findMany({
      where: { status: 'resolved', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });
    const avgResolutionHours = resolved.length
      ? Math.round(resolved.reduce((sum, r) => sum + (new Date(r.resolvedAt) - new Date(r.createdAt)) / 3600000, 0) / resolved.length)
      : null;

    res.json({ success: true, data: { total, byCategory, byStatus, avgResolutionHours }, message: 'Stats retrieved' });
  } catch (err) {
    logger.error('Error fetching civic stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats', code: 'DB_ERROR' });
  }
});

// ─── Civic Grievances (Government Approval Workflow) ─────────────────────────

// Multer for grievance images
const grievanceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/grievances'),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const grievanceUpload = multer({ storage: grievanceStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Only images allowed'));
}});

/**
 * POST /api/v1/civic/grievances
 * Submit a new civic grievance (citizen)
 */
router.post('/grievances', authenticate, grievanceUpload.array('images', 3), async (req, res) => {
  try {
    const { category, title, description, address, latitude, longitude } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ success: false, error: 'category, title, and description are required' });
    }
    if (!description || description.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Description must be at least 20 characters' });
    }

    const imageUrls = (req.files || []).map(f => `/uploads/grievances/${f.filename}`);

    const grievance = await prisma.civicGrievance.create({
      data: {
        submittedById: req.user.id,
        category,
        title,
        description,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: imageUrls,
        status: 'submitted',
      }
    });

    // Create first timeline entry
    await prisma.grievanceUpdate.create({
      data: {
        grievanceId: grievance.id,
        updatedById: req.user.id,
        status: 'submitted',
        note: 'Grievance submitted by citizen',
      }
    });

    // Human-readable ID for display: GRV-2026-NNNNN
    const year = new Date().getFullYear();
    const shortId = grievance.id.slice(0, 5).toUpperCase();
    const reportCode = `GRV-${year}-${shortId}`;

    const io = req.app.get('io');
    if (io) io.emit('grievance:new-submission', { grievanceId: grievance.id, category, title });

    res.status(201).json({
      success: true,
      data: { ...grievance, reportCode },
      message: `Grievance ${reportCode} submitted successfully`,
    });
  } catch (err) {
    logger.error('grievance submit error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit grievance' });
  }
});

/**
 * GET /api/v1/civic/grievances/mine
 * Get all grievances submitted by the logged-in citizen
 */
router.get('/grievances/mine', authenticate, async (req, res) => {
  try {
    const grievances = await prisma.civicGrievance.findMany({
      where: { submittedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedDepartment: { select: { name: true } },
        updates: { orderBy: { createdAt: 'asc' } },
        feedback: true,
      }
    });
    res.json({ success: true, data: grievances });
  } catch (err) {
    logger.error('grievances/mine error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch your grievances' });
  }
});

/**
 * GET /api/v1/civic/grievances/:id
 * Get single grievance details (owner or government/admin)
 */
router.get('/grievances/:id', authenticate, async (req, res) => {
  try {
    const grievance = await prisma.civicGrievance.findUnique({
      where: { id: req.params.id },
      include: {
        updates: { orderBy: { createdAt: 'asc' }, include: { updatedBy: { select: { name: true, role: true } } } },
        assignedDepartment: { select: { name: true, email: true } },
        feedback: true,
      }
    });
    if (!grievance) return res.status(404).json({ success: false, error: 'Grievance not found' });
    // Only owner or government/admin can view
    if (grievance.submittedById !== req.user.id && !['government', 'admin', 'department_op'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.json({ success: true, data: grievance });
  } catch (err) {
    logger.error('grievance detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch grievance' });
  }
});

/**
 * POST /api/v1/civic/grievances/:id/feedback
 * Submit star rating feedback after resolution (citizen)
 */
router.post('/grievances/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ratingMap = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
    const ratingEnum = ratingMap[Number(rating)];
    if (!ratingEnum) return res.status(400).json({ success: false, error: 'Rating must be 1-5' });

    const grievance = await prisma.civicGrievance.findUnique({ where: { id: req.params.id } });
    if (!grievance) return res.status(404).json({ success: false, error: 'Grievance not found' });
    if (grievance.submittedById !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied' });
    if (grievance.status !== 'resolved') return res.status(400).json({ success: false, error: 'Can only give feedback on resolved grievances' });

    const existing = await prisma.grievanceFeedback.findUnique({ where: { grievanceId: req.params.id } });
    if (existing) return res.status(409).json({ success: false, error: 'Feedback already submitted' });

    const feedback = await prisma.grievanceFeedback.create({
      data: { grievanceId: req.params.id, rating: ratingEnum, comment: comment || null }
    });
    res.status(201).json({ success: true, data: feedback, message: 'Thank you for your feedback!' });
  } catch (err) {
    logger.error('grievance feedback error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

module.exports = router;
