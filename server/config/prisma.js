/**
 * Prisma Client Configuration
 * Hardened for Zero-Downtime Cloud Deployment (Railway, Supabase, Render, Neon)
 */

function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'postgresql://postgres:postgres@localhost:5432/civicax';
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    if (!isLocal) {
      if (!url.searchParams.has('sslmode') && !url.searchParams.has('ssl')) {
        url.searchParams.set('sslmode', 'require');
      }

      const isPooler = url.port === '6543' || host.includes('pooler.supabase.com');
      if (isPooler && !url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }

      if (url.searchParams.get('pgbouncer') === 'true' && !url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '10');
      }
    }

    return url.toString();
  } catch (_err) {
    return rawUrl;
  }
}

const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/civicax';
const sanitizedUrl = sanitizeDatabaseUrl(rawUrl);
process.env.DATABASE_URL = sanitizedUrl;

const { PrismaClient } = require('@prisma/client');

// Tune database logs: limit to error and warn to prevent log flooding
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: sanitizedUrl,
    },
  },
  log: ['error', 'warn'],
});

// Cache database status for health probes
let cachedDbStatus = 'UNKNOWN';
let lastCheckTimestamp = 0;

/**
 * Non-blocking database connectivity check.
 * Returns 'ONLINE' or 'OFFLINE_DEMO_MODE' within timeoutMs.
 */
async function checkDatabaseConnection(timeoutMs = 2500) {
  const now = Date.now();
  if (cachedDbStatus !== 'UNKNOWN' && (now - lastCheckTimestamp < 5000)) {
    return cachedDbStatus;
  }

  try {
    const checkPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connectivity check timed out')), timeoutMs)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    cachedDbStatus = 'ONLINE';
    lastCheckTimestamp = Date.now();
    return 'ONLINE';
  } catch (_err) {
    cachedDbStatus = 'OFFLINE_DEMO_MODE';
    lastCheckTimestamp = Date.now();
    return 'OFFLINE_DEMO_MODE';
  }
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.sanitizeDatabaseUrl = sanitizeDatabaseUrl;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
