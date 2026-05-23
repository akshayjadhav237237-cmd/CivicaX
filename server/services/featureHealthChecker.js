/**
 * featureHealthChecker.js — Internal Feature Health Checker
 * Runs every 10 minutes, calling own backend endpoints.
 * Uses admin service account JWT to authenticate.
 * Stores results in feature_health_reports table.
 * Emits 'admin:feature-health-update' WebSocket event.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 10 * 60 * 1000;
const BASE_URL = 'http://localhost:3001/api/v1';
const TIMEOUT_MS = 5000;

let serviceToken = null;

// Get or create a service account JWT for health checks
async function getServiceToken() {
  if (serviceToken) return serviceToken;
  try {
    const email = process.env.HEALTH_CHECK_ADMIN_EMAIL || 'admin@civicax.demo';
    const password = process.env.HEALTH_CHECK_ADMIN_PASSWORD || 'demo1234';
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    serviceToken = data.data?.accessToken;
    return serviceToken;
  } catch {
    return null;
  }
}

async function testEndpoint(method, path, body) {
  const start = Date.now();
  const token = await getServiceToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const responseMs = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    let status = ok ? 'passing' : 'failing';
    if (ok && responseMs > 3000) status = 'warning';
    return { status, responseMs, errorMessage: ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'failing', responseMs: Date.now() - start, errorMessage: err.message };
  }
}

async function testExternalEndpoint(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'CivicaX/1.0' } });
    const responseMs = Date.now() - start;
    const ok = res.status >= 200 && res.status < 500;
    return { status: ok ? 'passing' : 'failing', responseMs, errorMessage: ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'failing', responseMs: Date.now() - start, errorMessage: err.message };
  }
}

async function testDB() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'passing', responseMs: Date.now() - start, errorMessage: null };
  } catch (err) {
    return { status: 'failing', responseMs: Date.now() - start, errorMessage: err.message };
  }
}

const FEATURES = [
  { page: '/login', feature: 'User Authentication', test: () => testEndpoint('POST', '/auth/login', { email: 'citizen@civicax.demo', password: 'demo1234' }) },
  { page: '/emergency', feature: 'Active Alerts Fetch', test: () => testEndpoint('GET', '/emergency/alerts/active') },
  { page: '/emergency', feature: 'Zone GeoJSON Fetch', test: () => testEndpoint('GET', '/emergency/zones') },
  { page: '/emergency', feature: 'Safe Zones Fetch', test: () => testEndpoint('GET', '/emergency/safe-zones') },
  { page: '/emergency', feature: 'Satellite Status', test: () => testEndpoint('GET', '/emergency/satellite-status?lat=18.75&lng=73.41') },
  { page: '/emergency', feature: 'OSRM Routing (External)', test: () => testExternalEndpoint('https://router.project-osrm.org/route/v1/driving/73.40,18.75;73.41,18.76?overview=false') },
  { page: '/civic', feature: 'Civic Reports Fetch', test: () => testEndpoint('GET', '/civic/reports') },
  { page: '/civic', feature: 'Departments Fetch', test: () => testEndpoint('GET', '/civic/departments') },
  { page: '/safety', feature: 'Safety Reports Fetch', test: () => testEndpoint('GET', '/safety/reports') },
  { page: '/government', feature: 'Satellite Events Fetch', test: () => testEndpoint('GET', '/government/satellite-events') },
  { page: '/government', feature: 'Grievance Queue Fetch', test: () => testEndpoint('GET', '/government/grievances?status=submitted') },
  { page: '/government', feature: 'Resource Calculator', test: () => testEndpoint('POST', '/government/resource-estimate', { population: 1000, disasterType: 'flash_flood', severityLevel: 'moderate' }) },
  { page: 'system', feature: 'Database Connection', test: () => testDB() },
  { page: 'system', feature: 'EONET API (External)', test: () => testExternalEndpoint('https://eonet.gsfc.nasa.gov/api/v3/events?limit=1') },
];

async function runFeatureChecks(io) {
  logger.info('[FeatureHealth] Running full feature health check...');
  // Reset service token to force re-auth
  serviceToken = null;

  const results = [];
  for (const feat of FEATURES) {
    try {
      const result = await feat.test();
      const report = {
        page: feat.page,
        feature: feat.feature,
        ...result,
        checkedAt: new Date(),
      };
      await prisma.featureHealthReport.create({ data: report });
      results.push({ ...feat, ...result });
      const icon = result.status === 'passing' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      logger.info(`[FeatureHealth] ${icon} ${feat.page} / ${feat.feature}: ${result.status} (${result.responseMs}ms)`);
    } catch (err) {
      logger.error(`[FeatureHealth] Error checking ${feat.feature}:`, err.message);
      results.push({ ...feat, status: 'failing', responseMs: null, errorMessage: err.message });
    }
  }

  const passing = results.filter(r => r.status === 'passing').length;
  const failing = results.filter(r => r.status === 'failing').length;
  const warning = results.filter(r => r.status === 'warning').length;

  logger.info(`[FeatureHealth] Summary: ${passing} passing / ${failing} failing / ${warning} warnings`);

  if (io) {
    io.emit('admin:feature-health-update', {
      results,
      summary: { passing, failing, warning, total: results.length },
      checkedAt: new Date().toISOString(),
    });
  }

  return results;
}

function startFeatureHealthChecker(io) {
  logger.info('[FeatureHealth] Starting feature health checker (10-min interval)');
  // Slight delay so server is ready before first check
  setTimeout(() => runFeatureChecks(io), 10000);
  const interval = setInterval(() => runFeatureChecks(io), POLL_INTERVAL_MS);
  return interval;
}

module.exports = { startFeatureHealthChecker, runFeatureChecks };
