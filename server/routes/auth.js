/**
 * Auth routes — register, login, refresh, logout, me
 * All responses follow standard shape: { success, data, message } / { success, error, code }
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  city: z.string().optional(),
  officialId: z.string().min(3).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

/**
 * POST /api/v1/auth/register
 * Input: { name, email, password, city?, officialId? }
 * Output: { user, accessToken }
 * If officialId is whitelisted and active: user is created with role 'government'
 * Otherwise: role defaults to 'citizen'
 */
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const { name, email, password, city, officialId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered', code: 'EMAIL_TAKEN' });
    }

    // Check Official ID whitelist — server-side, not trusted from client
    let assignedRole = 'citizen';
    try {
      if (officialId && officialId.trim()) {
        const whitelisted = await prisma.whitelistedOfficial.findFirst({
          where: { officialId: officialId.trim(), isActive: true }
        });
        if (whitelisted) {
          assignedRole = 'government';
          logger.info(`Whitelist match for officialId: ${officialId} — assigning government role to ${email}`);
        } else {
          logger.info(`Official ID ${officialId} not found or inactive — defaulting to citizen`);
        }
      }
    } catch (whitelistErr) {
      logger.warn('Whitelist check failed, defaulting to citizen role:', whitelistErr.message);
      assignedRole = 'citizen';
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: assignedRole, city },
      select: { id: true, name: true, email: true, role: true, city: true, createdAt: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    logger.info(`New user registered: ${email} (${assignedRole}${officialId ? ` via officialId=${officialId}` : ''})`);
    res.status(201).json({ success: true, data: { user, accessToken }, message: 'Registration successful' });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed', code: 'REGISTER_ERROR' });
  }
});

/**
 * POST /api/v1/auth/login
 * Input: { email, password }
 * Output: { user, accessToken }
 * Role required: none
 */
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { passwordHash: _ph, ...safeUser } = user;
    logger.info(`User logged in: ${email}`);
    res.json({ success: true, data: { user: safeUser, accessToken }, message: 'Login successful' });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed', code: 'LOGIN_ERROR' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Input: refreshToken cookie
 * Output: { accessToken }
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Refresh token missing', code: 'NO_REFRESH_TOKEN' });
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: { accessToken }, message: 'Token refreshed' });
  } catch (err) {
    logger.warn('Token refresh failed:', err.message);
    res.status(401).json({ success: false, error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Clears the httpOnly refresh token cookie
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, data: null, message: 'Logged out successfully' });
});

/**
 * GET /api/v1/auth/me
 * Returns the current authenticated user
 * Role required: any authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  const { passwordHash: _ph, ...safeUser } = req.user;
  res.json({ success: true, data: { user: safeUser }, message: 'User profile retrieved' });
});

/**
 * PUT /api/v1/auth/me
 * Update user profile (phone, city, smsAlertsEnabled)
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().optional(),
      city: z.string().optional(),
      smsAlertsEnabled: z.boolean().optional(),
      name: z.string().min(2).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, city: true, phone: true, smsAlertsEnabled: true },
    });
    res.json({ success: true, data: { user: updated }, message: 'Profile updated' });
  } catch (err) {
    logger.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Update failed', code: 'UPDATE_ERROR' });
  }
});

module.exports = router;
