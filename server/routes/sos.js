/**
 * sos.js — Citizen SOS Emergency Panic Routes
 */
const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { sendSMS } = require('../services/notificationService');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();

// ─── Trigger Citizen SOS (Public / Citizen bypass) ──────────────────────────

const sosSchema = z.object({
  userId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z.string().max(300).default('EMERGENCY — I need help'),
  phone: z.string().optional()
});

/**
 * POST /api/v1/sos/trigger
 * Public panic route. Creates an active SOS signal and broadcasts via Socket.io.
 */
router.post('/trigger', async (req, res) => {
  try {
    const parsed = sosSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }

    const { userId, latitude, longitude, message, phone } = parsed.data;

    // Use default system user id if userId not provided (e.g. guest SOS)
    let finalUserId = userId;
    if (!finalUserId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'citizen' } });
      finalUserId = defaultUser?.id || 'anonymous';
    }

    const signal = await prisma.sOSSignal.create({
      data: {
        userId: finalUserId,
        latitude,
        longitude,
        message: `${message}${phone ? ` | Contact: ${phone}` : ''}`,
        status: 'active'
      }
    });

    // Broadcast to command centers in real time via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('sos:new', {
        id: signal.id,
        userId: signal.userId,
        latitude: signal.latitude,
        longitude: signal.longitude,
        message: signal.message,
        status: signal.status,
        createdAt: signal.createdAt
      });
      logger.info(`[SOS] Broadcasted new active SOS: ${signal.id} via WebSockets`);
    }

    // Try sending SMS alert if emergency contacts exist (simulated via SMSLog)
    try {
      const smsMsg = `🚨 EMERGENCY: CivicaX Citizen Panic Triggered! Centroid: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Message: ${message}`;
      await prisma.sMSLog.create({
        data: {
          phoneNumber: phone || '+919999999999',
          message: smsMsg,
          status: 'sent'
        }
      });
      
      // If Twilio is active, call sendSMS
      if (phone) {
        await sendSMS(phone, smsMsg);
      }
    } catch (smsErr) {
      logger.warn('[SOS] Simulated Twilio SMS trigger warning:', smsErr.message);
    }

    res.status(201).json({
      success: true,
      data: signal,
      message: '🚨 SOS PANIC SIGNAL RECEIVED! Rescue services have been notified immediately.'
    });
  } catch (err) {
    logger.error('[SOS] Trigger error:', err.message);
    res.status(500).json({ success: false, error: 'SOS trigger failure' });
  }
});

// ─── Active SOS list (Gov & Admin only) ──────────────────────────────────────

/**
 * GET /api/v1/sos/active
 * Retrieve list of all active SOS signals.
 */
router.get('/active', authenticate, roleGuard('government', 'admin'), async (req, res) => {
  try {
    const signals = await prisma.sOSSignal.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: signals });
  } catch (err) {
    logger.error('[SOS] Fetch active signals error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve active SOS panic list' });
  }
});

// ─── Resolve SOS Panic (Gov & Admin only) ────────────────────────────────────

/**
 * PUT /api/v1/sos/:id/resolve
 * Resolve an active SOS alert.
 */
router.put('/:id/resolve', authenticate, roleGuard('government', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const signal = await prisma.sOSSignal.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedBy: req.user.name || req.user.id,
        resolvedAt: new Date()
      }
    });

    // Notify command center clients
    const io = req.app.get('io');
    if (io) {
      io.emit('sos:resolved', { id });
    }

    res.json({
      success: true,
      data: signal,
      message: 'SOS Panic Signal successfully marked as RESOLVED.'
    });
  } catch (err) {
    logger.error('[SOS] Resolve signal error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to resolve SOS signal' });
  }
});

module.exports = router;
