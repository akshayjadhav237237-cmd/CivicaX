/**
 * CivicaX Backend Health & Resilience Test Suite
 * Uses Node.js native test runner (node:test, node:assert)
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { sanitizeDatabaseUrl, checkDatabaseConnection } = require('../config/prisma');
const { app } = require('../index');

describe('CivicaX Cloud Backend Health & Resilience', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start an ephemeral test server instance
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('1. Database Connection URL Sanitization & SSL Pooling', () => {
    it('applies sslmode=require to remote database hosts', () => {
      const input = 'postgresql://postgres:secret@roundhouse.proxy.rlwy.net:12345/railway';
      const output = sanitizeDatabaseUrl(input);
      assert.ok(output.includes('sslmode=require'), 'Expected sslmode=require in remote URL');
    });

    it('enables pgbouncer and connection_limit on Supabase pooler (port 6543)', () => {
      const input = 'postgresql://postgres.myproject:secret@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
      const output = sanitizeDatabaseUrl(input);
      assert.ok(output.includes('sslmode=require'), 'Expected sslmode=require');
      assert.ok(output.includes('pgbouncer=true'), 'Expected pgbouncer=true for port 6543 pooler');
      assert.ok(output.includes('connection_limit=10'), 'Expected connection_limit for pooler');
    });

    it('leaves localhost/local dev connection strings unchanged', () => {
      const input = 'postgresql://postgres:postgres@localhost:5432/civicax';
      const output = sanitizeDatabaseUrl(input);
      assert.strictEqual(output, input);
    });

    it('gracefully handles empty or missing inputs with local default', () => {
      const output = sanitizeDatabaseUrl(null);
      assert.strictEqual(output, 'postgresql://postgres:postgres@localhost:5432/civicax');
    });
  });

  describe('2. Resilient Database Check & Offline Demo Mode', () => {
    it('returns ONLINE or OFFLINE_DEMO_MODE without throwing unhandled exceptions', async () => {
      const status = await checkDatabaseConnection(1000);
      assert.ok(
        status === 'ONLINE' || status === 'OFFLINE_DEMO_MODE',
        `Expected ONLINE or OFFLINE_DEMO_MODE, got: ${status}`
      );
    });
  });

  describe('3. GET /api/v1/health & GET /health Endpoints', () => {
    it('GET /api/v1/health returns 200 OK with required diagnostics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Server running');
      assert.strictEqual(typeof data.uptime, 'number');
      assert.ok(data.uptime >= 0, 'Uptime must be non-negative');

      // Database status verification
      assert.ok(
        data.database === 'ONLINE' || data.database === 'OFFLINE_DEMO_MODE',
        `Unexpected database status: ${data.database}`
      );

      // Memory metrics verification
      assert.ok(data.memory, 'Memory metrics should be present');
      assert.strictEqual(typeof data.memory.heapUsedMb, 'number');
      assert.strictEqual(typeof data.memory.heapTotalMb, 'number');
      assert.strictEqual(typeof data.memory.rssMb, 'number');

      // Pipeline status verification
      assert.ok(data.pipeline, 'Pipeline status should be present');
      assert.ok(typeof data.pipeline.status === 'string', 'Pipeline should report a status string');
    });

    it('GET /health root alias returns 200 OK for cloud load-balancers', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Server running');
    });
  });

  describe('4. Fallback Demo Mode Verification Under Unprovisioned DB', () => {
    it('POST /api/v1/auth/login works for demo users in offline demo mode', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'citizen@civicax.org',
          password: 'password123',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.accessToken, 'Access token should be issued');
      assert.strictEqual(body.data.user.role, 'citizen');
    });

    it('GET /api/v1/stats/public returns public statistics fallback', async () => {
      const res = await fetch(`${baseUrl}/api/v1/stats/public`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data !== undefined, 'Stats data should exist');
      assert.ok(typeof body.data.activeAlerts === 'number');
    });

    it('GET /api/v1/emergency/zones serves mock zones when DB is offline', async () => {
      const res = await fetch(`${baseUrl}/api/v1/emergency/zones`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.type, 'FeatureCollection');
      assert.ok(Array.isArray(body.data.features), 'GeoJSON features should be returned as an array');
    });
  });
});
