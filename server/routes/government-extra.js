/**
 * government-extra.js — Additional Government Routes
 * Satellite events, emergency dispatches, and grievance management.
 * Role guard: government + admin
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { sendSMS } = require('../services/notificationService');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

const govGuard = [authenticate, roleGuard('government', 'admin')];

// ─── Satellite Events ───────────────────────────────────────────────────────

/**
 * GET /api/v1/government/satellite-events
 * Returns all active satellite events from last 48 hours
 */
router.get('/satellite-events', govGuard, async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const events = await prisma.satelliteEvent.findMany({
      where: { isActive: true, detectedAt: { gte: since } },
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' }
      ],
      take: 100,
    });
    res.json({ success: true, data: events, count: events.length });
  } catch (err) {
    logger.error('satellite-events error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch satellite events' });
  }
});

// ─── Emergency Dispatches ───────────────────────────────────────────────────

const dispatchSchema = z.object({
  satelliteEventId: z.string().uuid().optional(),
  emergencyAlertId: z.string().uuid().optional(),
  serviceType: z.enum(['ambulance', 'police', 'fire', 'rescue', 'medical', 'flood_rescue']),
  quantity: z.number().int().min(1).max(500),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  destinationLabel: z.string().optional(),
  priority: z.enum(['immediate', 'high', 'standard']).default('standard'),
  notes: z.string().optional(),
});

/**
 * POST /api/v1/government/dispatch
 * Create a new emergency dispatch record
 */
router.post('/dispatch', govGuard, async (req, res) => {
  try {
    const parsed = dispatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const dispatch = await prisma.emergencyDispatch.create({
      data: {
        ...parsed.data,
        dispatchedById: req.user.id,
        status: 'dispatched',
      },
      include: { dispatchedBy: { select: { name: true, email: true } } }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'emergency_dispatch',
        payload: { dispatchId: dispatch.id, serviceType: dispatch.serviceType, quantity: dispatch.quantity },
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('dispatch:new', {
        id: dispatch.id,
        serviceType: dispatch.serviceType,
        quantity: dispatch.quantity,
        destinationLat: dispatch.destinationLat,
        destinationLng: dispatch.destinationLng,
        priority: dispatch.priority,
        dispatchedBy: dispatch.dispatchedBy?.name,
        dispatchedAt: dispatch.dispatchedAt,
      });
    }

    const label = parsed.data.destinationLabel || `${parsed.data.destinationLat.toFixed(3)}, ${parsed.data.destinationLng.toFixed(3)}`;
    res.status(201).json({
      success: true,
      data: dispatch,
      message: `Dispatch confirmed — ${dispatch.quantity} ${dispatch.serviceType} unit(s) deployed to ${label}`
    });
  } catch (err) {
    logger.error('dispatch error:', err);
    res.status(500).json({ success: false, error: 'Dispatch failed' });
  }
});

/**
 * PUT /api/v1/government/dispatch/:id/status
 * Update dispatch status
 */
router.put('/dispatch/:id/status', govGuard, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['dispatched', 'en_route', 'on_scene', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const dispatch = await prisma.emergencyDispatch.update({
      where: { id: req.params.id },
      data: { status },
    });

    const io = req.app.get('io');
    if (io) io.emit('dispatch:status-update', { id: dispatch.id, status });

    res.json({ success: true, data: dispatch });
  } catch (err) {
    logger.error('dispatch status update error:', err);
    res.status(500).json({ success: false, error: 'Status update failed' });
  }
});

/**
 * GET /api/v1/government/dispatches
 * List all dispatches (most recent first)
 */
router.get('/dispatches', govGuard, async (req, res) => {
  try {
    const { status } = req.query;
    const dispatches = await prisma.emergencyDispatch.findMany({
      where: status ? { status } : undefined,
      orderBy: { dispatchedAt: 'desc' },
      take: 50,
      include: {
        dispatchedBy: { select: { name: true, role: true } },
        satelliteEvent: { select: { title: true, eventType: true } }
      }
    });
    res.json({ success: true, data: dispatches, count: dispatches.length });
  } catch (err) {
    logger.error('dispatches list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dispatches' });
  }
});

// ─── Grievance Review Routes ────────────────────────────────────────────────

/**
 * GET /api/v1/government/grievances
 * List all grievances, filterable by status
 */
router.get('/grievances', govGuard, async (req, res) => {
  try {
    const { status } = req.query;
    const statuses = status ? status.split(',') : undefined;
    const grievances = await prisma.civicGrievance.findMany({
      where: statuses ? { status: { in: statuses } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, city: true } }, // anonymized — no name
        assignedDepartment: { select: { id: true, name: true } },
        updates: { orderBy: { createdAt: 'asc' }, take: 1 },
      }
    });
    res.json({ success: true, data: grievances, count: grievances.length });
  } catch (err) {
    logger.error('government grievances error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch grievances' });
  }
});

/**
 * GET /api/v1/government/grievances/:id/timeline
 * Grievance status update timeline
 */
router.get('/grievances/:id/timeline', govGuard, async (req, res) => {
  try {
    const grievance = await prisma.civicGrievance.findUnique({
      where: { id: req.params.id },
      include: {
        updates: {
          orderBy: { createdAt: 'asc' },
          include: { updatedBy: { select: { name: true, role: true } } }
        },
        assignedDepartment: { select: { name: true } },
      }
    });
    if (!grievance) return res.status(404).json({ success: false, error: 'Grievance not found' });
    res.json({ success: true, data: grievance });
  } catch (err) {
    logger.error('grievance timeline error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

const approveSchema = z.object({
  approvedBudget: z.number().positive(),
  assignedDepartmentId: z.string().uuid(),
  estimatedResolutionDays: z.number().int().min(1).max(365),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  internalNotes: z.string().optional(),
});

/**
 * PUT /api/v1/government/grievances/:id/approve
 * Approve a grievance and assign to department
 */
router.put('/grievances/:id/approve', govGuard, async (req, res) => {
  try {
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const dept = await prisma.civicDepartment.findUnique({ where: { id: parsed.data.assignedDepartmentId } });
    if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });

    const grievance = await prisma.civicGrievance.update({
      where: { id: req.params.id },
      data: {
        status: 'assigned',
        reviewedById: req.user.id,
        approvedBudget: parsed.data.approvedBudget,
        assignedDepartmentId: parsed.data.assignedDepartmentId,
        estimatedResolutionDays: parsed.data.estimatedResolutionDays,
        priority: parsed.data.priority,
        internalNotes: parsed.data.internalNotes,
      }
    });

    await prisma.grievanceUpdate.create({
      data: {
        grievanceId: req.params.id,
        updatedById: req.user.id,
        status: 'assigned',
        note: `Approved with budget ₹${parsed.data.approvedBudget.toLocaleString('en-IN')}. Assigned to ${dept.name}. Est. resolution: ${parsed.data.estimatedResolutionDays} days.`,
      }
    });

    // Notify the citizen
    await prisma.notification.create({
      data: {
        userId: grievance.submittedById,
        type: 'grievance_approved',
        title: '✅ Your Grievance Was Approved',
        body: `A budget of ₹${parsed.data.approvedBudget.toLocaleString('en-IN')} has been approved. Assigned to ${dept.name}. Expected resolution in ${parsed.data.estimatedResolutionDays} days.`,
      }
    });

    const io = req.app.get('io');
    if (io) io.emit('grievance:status-update', { grievanceId: req.params.id, status: 'assigned' });

    // SMS: notify citizen who submitted the grievance
    (async () => {
      try {
        const citizen = await prisma.user.findUnique({
          where: { id: grievance.submittedById },
          select: { phone: true },
        });
        if (citizen?.phone) {
          const msg = `✅ CivicaX Grievance Update: Your grievance "${grievance.title ?? 'submission'}" has been approved. Budget: ₹${parsed.data.approvedBudget.toLocaleString('en-IN')}. Assigned to ${dept.name}. Expected resolution: ${parsed.data.estimatedResolutionDays} days.`;
          await sendSMS(citizen.phone, msg);
        }
      } catch (smsErr) {
        logger.error('[SMS] Grievance approval SMS failed:', smsErr.message);
      }
    })();

    res.json({
      success: true,
      data: grievance,
      message: `Grievance approved and assigned to ${dept.name}. Budget: ₹${parsed.data.approvedBudget.toLocaleString('en-IN')}`
    });
  } catch (err) {
    logger.error('grievance approve error:', err);
    res.status(500).json({ success: false, error: 'Approval failed' });
  }
});

/**
 * PUT /api/v1/government/grievances/:id/reject
 * Reject a grievance with a reason
 */
router.put('/grievances/:id/reject', govGuard, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'A rejection reason is required (min 5 characters)' });
    }

    const grievance = await prisma.civicGrievance.update({
      where: { id: req.params.id },
      data: { status: 'rejected', reviewedById: req.user.id, rejectionReason: reason },
    });

    await prisma.grievanceUpdate.create({
      data: {
        grievanceId: req.params.id,
        updatedById: req.user.id,
        status: 'rejected',
        note: `Rejected: ${reason}`,
      }
    });

    await prisma.notification.create({
      data: {
        userId: grievance.submittedById,
        type: 'grievance_rejected',
        title: '❌ Your Grievance Was Reviewed',
        body: `Status: Rejected. Reason: ${reason}`,
      }
    });

    const io = req.app.get('io');
    if (io) io.emit('grievance:status-update', { grievanceId: req.params.id, status: 'rejected' });

    res.json({ success: true, data: grievance, message: 'Grievance rejected' });
  } catch (err) {
    logger.error('grievance reject error:', err);
    res.status(500).json({ success: false, error: 'Rejection failed' });
  }
});

module.exports = router;
