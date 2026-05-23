require('dotenv').config();

// ─── Global crash guards — MUST be first, before any other code ───────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception — server staying alive:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection — server staying alive:', reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./config/logger');
const { setupSocketHandlers } = require('./socket/emergencySocket');

// Import routes
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const civicRoutes = require('./routes/civic');
const safetyRoutes = require('./routes/safety');
const governmentRoutes = require('./routes/government');
const governmentExtraRoutes = require('./routes/government-extra');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Background services — each loaded in isolation so a bad import never kills startup
let startWeatherPoller, startEONETPoller, startFIRMSPoller, startAPIHealthMonitor, startFeatureHealthChecker;
try { ({ startWeatherPoller }      = require('./services/weatherPoller'));      } catch(e) { console.warn('[SERVICE] weatherPoller load failed:', e.message); }
try { ({ startEONETPoller }        = require('./services/eonetService'));        } catch(e) { console.warn('[SERVICE] eonetService load failed:', e.message); }
try { ({ startFIRMSPoller }        = require('./services/firmsService'));        } catch(e) { console.warn('[SERVICE] firmsService load failed:', e.message); }
try { ({ startAPIHealthMonitor }   = require('./services/apiHealthMonitor'));    } catch(e) { console.warn('[SERVICE] apiHealthMonitor load failed:', e.message); }
try { ({ startFeatureHealthChecker } = require('./services/featureHealthChecker')); } catch(e) { console.warn('[SERVICE] featureHealthChecker load failed:', e.message); }

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Static uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/emergency',    emergencyRoutes);
app.use('/api/v1/civic',        civicRoutes);
app.use('/api/v1/safety',       safetyRoutes);
app.use('/api/v1/government',   governmentRoutes);
app.use('/api/v1/government',   governmentExtraRoutes);
app.use('/api/v1/admin',        adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Server running' });
});

// WebSocket handlers
try { setupSocketHandlers(io); } catch(e) { console.warn('[WS] Socket handler setup failed:', e.message); }

// Start background services — each call isolated so one failure never stops others
if (startWeatherPoller)        try { startWeatherPoller(io);        } catch(e) { console.warn('[SERVICE] weatherPoller start failed:', e.message); }
if (startEONETPoller)          try { startEONETPoller(io);          } catch(e) { console.warn('[SERVICE] eonetService start failed:', e.message); }
if (startFIRMSPoller)          try { startFIRMSPoller(io);          } catch(e) { console.warn('[SERVICE] firmsService start failed:', e.message); }
if (startAPIHealthMonitor)     try { startAPIHealthMonitor(io);     } catch(e) { console.warn('[SERVICE] apiHealthMonitor start failed:', e.message); }
if (startFeatureHealthChecker) try { startFeatureHealthChecker(io); } catch(e) { console.warn('[SERVICE] featureHealthChecker start failed:', e.message); }

// Global Express error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  logger.info(`🚀 CivicaX server running on port ${PORT}`);
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const [civicCount, safetyCount, alertCount, zoneCount, safeZoneCount] = await Promise.all([
      prisma.civicReport.count(),
      prisma.safetyReport.count(),
      prisma.emergencyAlert.count(),
      prisma.emergencyZone.count(),
      prisma.safeZone.count(),
    ]);
    logger.info(`📊 DB Health: civicReports=${civicCount}  safetyReports=${safetyCount}  emergencyAlerts=${alertCount}  zones=${zoneCount}  safeZones=${safeZoneCount}`);
    await prisma.$disconnect();
  } catch (e) {
    logger.error('DB health check failed:', e.message);
  }
});

module.exports = { app, io };
