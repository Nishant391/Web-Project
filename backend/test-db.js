require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn', 'info'],
});

async function main() {
  try {
    console.log('Attempting connection to:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);
    await prisma.$connect();
    console.log('SUCCESS: Database connected!');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL version:', result[0].version);
  } catch (error) {
    console.error('FAILED:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
