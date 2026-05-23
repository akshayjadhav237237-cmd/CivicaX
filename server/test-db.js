require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
