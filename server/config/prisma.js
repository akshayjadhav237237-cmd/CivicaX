const { PrismaClient } = require('@prisma/client');

// Tune database logs: limit to error and warn to prevent log flooding
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

module.exports = prisma;
