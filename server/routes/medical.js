/**
 * medical.js — Medical Resource Management Routes
 * Handles hospital beds, emergency ICU capacity, and blood bank levels.
 */
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();
const govGuard = [authenticate, roleGuard('government', 'admin')];

// ─── Hospital Capacities ─────────────────────────────────────────────────────

/**
 * GET /api/v1/medical/hospitals
 * Public endpoint to list all local hospitals and their dynamic bed capacities.
 */
router.get('/hospitals', async (req, res) => {
  try {
    const list = await prisma.hospitalCapacity.findMany({
      orderBy: { distanceKm: 'asc' }
    });

    const bloodList = await prisma.bloodBankStatus.findMany();
    const bloodMap = new Map(bloodList.map(b => [b.hospitalId, b]));

    // Join with blood bank data
    const joined = list.map(h => ({
      ...h,
      bloodBank: bloodMap.get(h.id) || {
        aPositive: 0,
        bPositive: 0,
        oPositive: 0,
        abPositive: 0
      }
    }));

    res.json({ success: true, data: joined });
  } catch (err) {
    logger.error('[Medical] Fetch hospitals error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve hospital list' });
  }
});

const hospitalSchema = z.object({
  name: z.string().min(3),
  distanceKm: z.number().nonnegative(),
  totalBeds: z.number().int().positive(),
  availableBeds: z.number().int().nonnegative(),
  icuBeds: z.number().int().nonnegative(),
  ambulancesTotal: z.number().int().nonnegative(),
  ambulancesDeployed: z.number().int().nonnegative()
});

/**
 * POST /api/v1/medical/hospitals
 * Register a new hospital facility.
 */
router.post('/hospitals', govGuard, async (req, res) => {
  try {
    const parsed = hospitalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const hospital = await prisma.hospitalCapacity.create({
      data: parsed.data
    });

    // Create empty blood bank registry
    await prisma.bloodBankStatus.create({
      data: {
        hospitalId: hospital.id,
        aPositive: 10,
        bPositive: 15,
        oPositive: 20,
        abPositive: 5
      }
    });

    res.status(201).json({ success: true, data: hospital, message: 'Hospital facility registered' });
  } catch (err) {
    logger.error('[Medical] Register hospital error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to register hospital facility' });
  }
});

/**
 * PUT /api/v1/medical/hospitals/:id
 * Update bed and ambulance occupancy details.
 */
router.put('/hospitals/:id', govGuard, async (req, res) => {
  try {
    const parsed = hospitalSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const hospital = await prisma.hospitalCapacity.update({
      where: { id: req.params.id },
      data: parsed.data
    });

    // Broadcast update via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('medical:hospital-update', hospital);
    }

    res.json({ success: true, data: hospital, message: 'Hospital logistics updated' });
  } catch (err) {
    logger.error('[Medical] Update hospital error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update hospital status' });
  }
});

// ─── Blood Bank Statuses ─────────────────────────────────────────────────────

const bloodSchema = z.object({
  aPositive: z.number().int().nonnegative(),
  bPositive: z.number().int().nonnegative(),
  oPositive: z.number().int().nonnegative(),
  abPositive: z.number().int().nonnegative()
});

/**
 * PUT /api/v1/medical/blood-bank/:hospitalId
 * Adjust blood pint inventories at a given facility.
 */
router.put('/blood-bank/:hospitalId', govGuard, async (req, res) => {
  try {
    const parsed = bloodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const status = await prisma.bloodBankStatus.upsert({
      where: { hospitalId: req.params.hospitalId },
      update: parsed.data,
      create: {
        hospitalId: req.params.hospitalId,
        ...parsed.data
      }
    });

    res.json({ success: true, data: status, message: 'Blood bank counts refreshed' });
  } catch (err) {
    logger.error('[Medical] Update blood bank error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to refresh blood bank registries' });
  }
});

module.exports = router;
