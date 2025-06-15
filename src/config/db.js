const { PrismaClient } = require('@prisma/client');

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configure connection management for serverless
  __internal: {
    engine: {
      connectionLimit: 5,
      pool: {
        min: 0,
        max: 5,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
      }
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', `${e.duration}ms`);
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;