/**
 * Auth routes — register, login, refresh, logout, me
 * All responses follow standard shape: { success, data, message } / { success, error, code }
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { authenticate } = require('../middleware/auth');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  city: z.string().optional(),
  officialId: z.string().min(3).max(50).optional().or(z.literal('')),
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

const createMailTransport = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  logger.info('[Auth] SMTP env credentials missing, using Ethereal email fallback');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * POST /api/v1/auth/forgot-password
 * Input: { email }
 * Output: { success, message, previewUrl? }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required', code: 'EMAIL_REQUIRED' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent email enumeration
      return res.json({ success: true, message: 'If this email exists, a password reset link has been sent.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // Delete existing tokens for this email and create new one
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${clientUrl}/reset-password?token=${token}`;

    const transporter = await createMailTransport();
    const mailOptions = {
      from: '"CivicaX Support" <noreply@civicax.org>',
      to: email,
      subject: 'CivicaX Password Reset Request',
      text: `You requested a password reset. Please click on the link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>CivicaX Password Reset</h2>
          <p>You requested a password reset for your CivicaX account.</p>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    let previewUrl = null;
    if (transporter.options.host === 'smtp.ethereal.email') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[Auth] Ethereal reset email preview: ${previewUrl}`);
    }

    res.json({
      success: true,
      message: 'Password reset link sent successfully',
      previewUrl,
    });
  } catch (err) {
    logger.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process forgot password request', code: 'FORGOT_PASSWORD_ERROR' });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Input: { token, password }
 * Output: { success, message }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and password are required', code: 'BAD_REQUEST' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long', code: 'PASSWORD_TOO_SHORT' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token', code: 'INVALID_TOKEN' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Perform update and token deletion in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    logger.info(`[Auth] Password successfully reset for user: ${resetToken.email}`);
    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    logger.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password', code: 'RESET_PASSWORD_ERROR' });
  }
});

module.exports = router;
