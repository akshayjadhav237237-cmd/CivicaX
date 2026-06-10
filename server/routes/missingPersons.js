/**
 * missingPersons.js — Missing Persons Registry Routes
 */
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();
const govGuard = [authenticate, roleGuard('government', 'admin')];

// ─── List Missing Persons ───────────────────────────────────────────────────

/**
 * GET /api/v1/missing
 * Public search registry for missing persons.
 */
router.get('/', async (req, res) => {
  try {
    const { status, q } = req.query;
    const list = await prisma.missingPerson.findMany({
      where: {
        status: status || undefined,
        OR: q ? [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ] : undefined
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (err) {
    logger.error('[Missing] Fetch registry error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to query missing registry' });
  }
});

const reportSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
  gender: z.string().min(1),
  lastKnownLat: z.number().min(-90).max(90),
  lastKnownLng: z.number().min(-180).max(180),
  description: z.string().min(10),
  photoUrl: z.string().optional(),
  reporterContact: z.string().min(5),
  reporterRelationship: z.string().min(2)
});

/**
 * POST /api/v1/missing
 * Submit a new missing person report (public zero-login / civilian).
 */
router.post('/', async (req, res) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const record = await prisma.missingPerson.create({
      data: {
        ...parsed.data,
        status: 'active'
      }
    });

    // Broadcast WebSocket alert
    const io = req.app.get('io');
    if (io) {
      io.emit('missing:new', record);
    }

    res.status(201).json({ success: true, data: record, message: `Report logged for ${parsed.data.name}` });
  } catch (err) {
    logger.error('[Missing] Record submission error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to register missing person report' });
  }
});

/**
 * PUT /api/v1/missing/:id/status
 * Mark missing person as found / active (Gov or Admin only).
 */
router.put('/:id/status', govGuard, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'found'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status parameter' });
    }

    const record = await prisma.missingPerson.update({
      where: { id: req.params.id },
      data: { status }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('missing:status-update', { id: record.id, status });
    }

    res.json({ success: true, data: record, message: `Status updated successfully to ${status}` });
  } catch (err) {
    logger.error('[Missing] Status update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update missing registry status' });
  }
});

module.exports = router;
