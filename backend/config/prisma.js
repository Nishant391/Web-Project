const { PrismaClient } = require('@prisma/client');

// Enhanced PrismaClient configuration for Neon serverless PostgreSQL
// Handles cold start reconnection automatically
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaClientOptions);
} else {
  // Prevent multiple Prisma instances in development (hot reload)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient(prismaClientOptions);
  }
  prisma = global.__prisma;
}

module.exports = prisma;
