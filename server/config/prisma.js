if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/civicax';
}

const { PrismaClient } = require('@prisma/client');

// Tune database logs: limit to error and warn to prevent log flooding
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

module.exports = prisma;

