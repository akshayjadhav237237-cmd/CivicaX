/**
 * Zero-Downtime Prisma Migration Runner
 *
 * Runs `prisma migrate deploy` safely before server boot.
 * If DATABASE_URL is unconfigured, unreachable, or provisioning:
 * - Logs clear diagnostics
 * - Does NOT crash or throw exit code 1
 * - Exits cleanly (code 0) so the application server starts smoothly in Offline Demo Mode.
 */

const { execSync } = require('child_process');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

console.log('[MIGRATE] Checking database configuration...');

if (!databaseUrl) {
  console.warn('[MIGRATE] ⚠️ No DATABASE_URL provided. Skipping migrations; server will run in fallback demo mode.');
  process.exit(0);
}

try {
  console.log('[MIGRATE] Applying Prisma database migrations (npx prisma migrate deploy)...');
  const output = execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'pipe',
    timeout: 45000,
  });
  console.log(output.toString());
  console.log('[MIGRATE] ✅ Database migrations applied successfully.');
  process.exit(0);
} catch (error) {
  const errMsg = error.stderr ? error.stderr.toString() : error.message;
  console.warn('[MIGRATE] ⚠️ Database migration could not complete:');
  console.warn(errMsg);
  console.warn('[MIGRATE] ⚠️ Continuing server boot in Offline Demo Mode to maintain zero-downtime availability.');
  process.exit(0);
}
