/**
 * Notification routes
 * Manages in-app notifications for users
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

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
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, data: { notifications, unreadCount }, message: 'Notifications retrieved' });
  } catch (err) {
    logger.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications', code: 'DB_ERROR' });
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
