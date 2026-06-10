/**
 * volunteers.js — Volunteer Registry & Mobilization Routes
 */
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();
const govGuard = [authenticate, roleGuard('government', 'admin')];

// ─── List Volunteers (Gov & Admin only) ──────────────────────────────────────

/**
 * GET /api/v1/volunteers
 * Command Center list of registered rescue volunteers.
 */
router.get('/', govGuard, async (req, res) => {
  try {
    const list = await prisma.volunteer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (err) {
    logger.error('[Volunteers] Fetch volunteers error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve volunteer registry' });
  }
});

const volunteerSchema = z.object({
  name: z.string().min(2),
  skills: z.array(z.string()).min(1),
  languages: z.array(z.string()).default(['English', 'Hindi']),
  availability: z.enum(['immediate', '2h', '24h']),
  vehicle: z.enum(['yes', 'no']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

/**
 * POST /api/v1/volunteers
 * Register a new volunteer (public / citizen portal).
 */
router.post('/', async (req, res) => {
  try {
    const parsed = volunteerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const volunteer = await prisma.volunteer.create({
      data: parsed.data
    });

    res.status(201).json({
      success: true,
      data: volunteer,
      message: 'Thank you! You have been registered in the CivicaX Emergency Volunteer Network.'
    });
  } catch (err) {
    logger.error('[Volunteers] Registration error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to complete volunteer registration' });
  }
});

module.exports = router;
