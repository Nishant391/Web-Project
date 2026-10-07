const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, clerkUserId: true }
  });
  console.log('=== Users in DB ===');
  console.log(JSON.stringify(users, null, 2));

  const trainers = await prisma.trainer.findMany({
    select: { id: true, email: true, name: true, userId: true, clerkUserId: true }
  });
  console.log('\n=== Trainers in DB ===');
  console.log(JSON.stringify(trainers, null, 2));
}

main().finally(() => prisma.$disconnect());
