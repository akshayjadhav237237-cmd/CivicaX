/**
 * WebSocket event handlers for CivicaX real-time features.
 * Namespace: / (root, using Socket.io rooms)
 *
 * Events emitted by server:
 * - alert:new — new emergency alert created
 * - alert:updated — emergency alert updated
 * - zone:status-change — zone or safe zone status changed
 * - safety:urgent — immediate-urgency safety report submitted
 * - notification:new — new notification for a specific user
 *
 * @param {import('socket.io').Server} io
 */
const logger = require('../config/logger');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Client can join a user-specific room to receive personal notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // Client can join the government room for privileged events
    socket.on('join:government', () => {
      socket.join('government');
      logger.info(`Socket ${socket.id} joined government room`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });

    socket.on('error', (err) => {
      logger.error(`WebSocket error on ${socket.id}:`, err);
    });
  });

  logger.info('WebSocket handlers initialized');
};

/**
 * Emits a notification to a specific user's room.
 * @param {import('socket.io').Server} io
 * @param {string} userId
 * @param {Object} notification
 */
const emitUserNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = { setupSocketHandlers, emitUserNotification };
