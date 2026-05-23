require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo accounts...');

  const passwordHash = await bcrypt.hash('demo1234', 12);

  const users = [
    { name: 'Citizen Demo',    email: 'citizen@civicax.demo', passwordHash, role: 'citizen' },
    { name: 'Dept Demo',       email: 'dept@civicax.demo',    passwordHash, role: 'department_op' },
    { name: 'Gov Demo',        email: 'gov@civicax.demo',     passwordHash, role: 'government' },
    { name: 'Admin Demo',      email: 'admin@civicax.demo',   passwordHash, role: 'admin' },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Update the password hash in case it changed
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash: u.passwordHash },
      });
      console.log(`  ↻ Updated password for ${u.email}`);
    } else {
      await prisma.user.create({ data: u });
      console.log(`  ✓ Created ${u.email} (${u.role})`);
    }
  }

  console.log('✅ Seed complete. Demo password: demo1234');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
