/**
 * Notification routes
 * Manages in-app notifications for users
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();

const DEMO_NOTIFICATIONS = [
  { id: 'notif-1', title: '🚨 Red Alert: Chorabari Outflow Surge', body: 'Immediate mandatory evacuation advisory issued for Kedarnath Temple basin.', isRead: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'notif-2', title: '🛣️ Pothole Work Dispatched (CIV-2026-081)', body: 'Roads & Infrastructure team assigned for rapid asphalt cold-mix compaction.', isRead: false, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'notif-3', title: '⚠️ Landslide Advisory: Rambara Sector', body: 'Soil saturation reached 82.5%. Trekking route diverted via high ridge path.', isRead: true, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
];

/**
 * GET /api/v1/notifications
 * Returns notifications for the authenticated user, sorted newest first
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (notifications && notifications.length > 0) {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      return res.json({ success: true, data: { notifications, unreadCount }, message: 'Notifications retrieved' });
    }
    const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.isRead).length;
    res.json({ success: true, data: { notifications: DEMO_NOTIFICATIONS, unreadCount }, message: 'Notifications retrieved (demo mode)' });
  } catch (err) {
    const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.isRead).length;
    res.json({ success: true, data: { notifications: DEMO_NOTIFICATIONS, unreadCount }, message: 'Notifications retrieved (demo mode)' });
  }
});

/**
 * PUT /api/v1/notifications/:id/read
 * Marks a single notification as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification, message: 'Notification marked as read' });
  } catch (err) {
    logger.error('Error marking notification read:', err);
    res.status(500).json({ success: false, error: 'Failed to update notification', code: 'DB_ERROR' });
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * Marks all notifications as read for the current user
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, data: { updated: result.count }, message: 'All notifications marked as read' });
  } catch (err) {
    logger.error('Error marking all notifications read:', err);
    res.status(500).json({ success: false, error: 'Failed to update notifications', code: 'DB_ERROR' });
  }
});

module.exports = router;
