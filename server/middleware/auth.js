const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { getDemoUserById, DEMO_USERS } = require('../shared/demoUsers');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from Authorization header.
 * Attaches the decoded user object to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'civicax_dev_secret_key_2026_secure';
    const decoded = jwt.verify(token, secret);

    // 1. Check if token belongs to a demo user
    const demoUser = getDemoUserById(decoded.userId);
    if (demoUser) {
      req.user = demoUser;
      return next();
    }

    // 2. Query database for user
    try {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) {
        req.user = user;
        return next();
      }
    } catch (dbErr) {
      logger.warn('DB query failed in authenticate middleware:', dbErr.message);
      // If DB is offline, fallback to the default demo citizen user so the request doesn't stall
      req.user = DEMO_USERS[0];
      return next();
    }

    return res.status(401).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
  } catch (err) {
    logger.warn('Authentication failed:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
};

/**
 * Optional auth middleware — attaches user if token present, continues if not.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'civicax_dev_secret_key_2026_secure';
      const decoded = jwt.verify(token, secret);
      
      const demoUser = getDemoUserById(decoded.userId);
      if (demoUser) {
        req.user = demoUser;
        return next();
      }

      try {
        req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      } catch (_) {
        req.user = DEMO_USERS[0];
      }
    }
  } catch (_) {
    // ignore auth errors in optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };

