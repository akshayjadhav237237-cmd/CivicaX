/**
 * admin.js — Admin-only routes
 * Whitelist management, API health, feature health monitoring.
 * Role guard: admin only
 */
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { runHealthChecks } = require('../services/apiHealthMonitor');
const { runFeatureChecks } = require('../services/featureHealthChecker');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();
const adminGuard = [authenticate, roleGuard('admin')];

// ─── Official ID Whitelist ──────────────────────────────────────────────────

/**
 * GET /api/v1/admin/whitelist
 */
router.get('/whitelist', adminGuard, async (req, res) => {
  try {
    const { q } = req.query;
    const officials = await prisma.whitelistedOfficial.findMany({
      where: q ? {
        OR: [
          { officialId: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { jurisdiction: { contains: q, mode: 'insensitive' } },
        ]
      } : undefined,
      include: { addedBy: { select: { name: true } } },
      orderBy: { addedAt: 'desc' },
    });
    res.json({ success: true, data: officials });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch whitelist' });
  }
});

const whitelist_schema = z.object({
  officialId: z.string().min(3).max(50),
  name: z.string().min(2).max(100),
  jurisdiction: z.string().min(2).max(100),
});

/**
 * POST /api/v1/admin/whitelist
 */
router.post('/whitelist', adminGuard, async (req, res) => {
  try {
    const parsed = whitelist_schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    }
    const existing = await prisma.whitelistedOfficial.findUnique({ where: { officialId: parsed.data.officialId } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Official ID already exists in whitelist' });
    }
    const official = await prisma.whitelistedOfficial.create({
      data: { ...parsed.data, addedById: req.user.id }
    });
    res.status(201).json({ success: true, data: official, message: `Official ${parsed.data.officialId} whitelisted` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add to whitelist' });
  }
});

/**
 * PUT /api/v1/admin/whitelist/:id — toggle active status
 */
router.put('/whitelist/:id', adminGuard, async (req, res) => {
  try {
    const { isActive } = req.body;
    const official = await prisma.whitelistedOfficial.update({
      where: { id: req.params.id },
      data: { isActive: Boolean(isActive) }
    });
    res.json({ success: true, data: official });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update whitelist entry' });
  }
});

/**
 * DELETE /api/v1/admin/whitelist/:id — soft delete
 */
router.delete('/whitelist/:id', adminGuard, async (req, res) => {
  try {
    await prisma.whitelistedOfficial.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Official deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate' });
  }
});

// ─── API Health Monitor ─────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/api-health
 * Returns the most recent log entry per API name
 */
router.get('/api-health', adminGuard, async (req, res) => {
  try {
    // Get most recent entry per API name using Prisma raw or groupBy workaround
    const allLogs = await prisma.apiHealthLog.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 200
    });
    // Deduplicate — keep most recent per apiName
    const seen = new Set();
    const latest = allLogs.filter(l => { if (seen.has(l.apiName)) return false; seen.add(l.apiName); return true; });
    res.json({ success: true, data: latest, checkedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch API health' });
  }
});

/**
 * GET /api/v1/admin/api-health/history
 * Returns last 24h of health logs
 */
router.get('/api-health/history', adminGuard, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await prisma.apiHealthLog.findMany({
      where: { checkedAt: { gte: since } },
      orderBy: { checkedAt: 'asc' },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * POST /api/v1/admin/api-health/refresh
 * Trigger immediate health check
 */
router.post('/api-health/refresh', adminGuard, async (req, res) => {
  try {
    const io = req.app.get('io');
    const results = await runHealthChecks(io);
    res.json({ success: true, data: results, message: 'Health check complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

// ─── Feature Health Checker ─────────────────────────────────────────────────

/**
 * GET /api/v1/admin/feature-health
 * Returns the most recent result per feature
 */
router.get('/feature-health', adminGuard, async (req, res) => {
  try {
    const allReports = await prisma.featureHealthReport.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 500
    });
    // Deduplicate — latest per page+feature
    const seen = new Set();
    const latest = allReports.filter(r => {
      const key = `${r.page}:${r.feature}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch feature health' });
  }
});

/**
 * POST /api/v1/admin/feature-health/run
 */
router.post('/feature-health/run', adminGuard, async (req, res) => {
  try {
    const io = req.app.get('io');
    const results = await runFeatureChecks(io);
    res.json({ success: true, data: results, message: 'Feature check complete' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Feature check failed' });
  }
});

/**
 * GET /api/v1/admin/feature-health/history
 */
router.get('/feature-health/history', adminGuard, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reports = await prisma.featureHealthReport.findMany({
      where: { checkedAt: { gte: since } },
      orderBy: { checkedAt: 'asc' },
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch feature health history' });
  }
});

module.exports = router;
