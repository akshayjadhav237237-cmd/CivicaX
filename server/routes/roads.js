/**
 * roads.js — Road Closure & Blockage Log Management Routes
 */
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();
const govGuard = [authenticate, roleGuard('government', 'admin')];

// ─── List Road Closures ──────────────────────────────────────────────────────

/**
 * GET /api/v1/roads/closures
 * Public endpoint to list active and cleared road blockages in Kedarnath zone.
 */
router.get('/closures', async (req, res) => {
  try {
    const list = await prisma.roadClosure.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (err) {
    logger.error('[Roads] Fetch closures error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve road closure list' });
  }
});

const closureSchema = z.object({
  roadName: z.string().min(3),
  blockageType: z.enum(['flood', 'landslide', 'accident', 'bridge_damage', 'other']),
  severity: z.enum(['partial', 'full']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photoUrl: z.string().optional()
});

/**
 * POST /api/v1/roads/closures
 * Report a new road blockage (Gov or Admin).
 */
router.post('/closures', govGuard, async (req, res) => {
  try {
    const parsed = closureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const closure = await prisma.roadClosure.create({
      data: {
        ...parsed.data,
        status: 'active'
      }
    });

    // Notify command center clients via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('road:blockage', closure);
    }

    res.status(201).json({ success: true, data: closure, message: `Road blockage logged: ${parsed.data.roadName}` });
  } catch (err) {
    logger.error('[Roads] Log closure error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to record road blockage' });
  }
});

/**
 * PUT /api/v1/roads/closures/:id/clear
 * Mark a road blockage as cleared (Gov or Admin).
 */
router.put('/closures/:id/clear', govGuard, async (req, res) => {
  try {
    const closure = await prisma.roadClosure.update({
      where: { id: req.params.id },
      data: {
        status: 'cleared'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('road:cleared', { id: closure.id });
    }

    res.json({ success: true, data: closure, message: 'Road marked as CLEARED & operational.' });
  } catch (err) {
    logger.error('[Roads] Clear closure error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear road blockage status' });
  }
});

module.exports = router;
