const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.emergencyAlert.updateMany({ data: { isActive: true } });
  console.log('Updated all alerts to active');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
