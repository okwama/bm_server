const { PrismaClient } = require('@prisma/client');

// Configure Prisma with connection pool settings
const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool configuration
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Add connection pool event listeners for debugging
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Query: ${e.query}`);
    console.log(`⏱️ Duration: ${e.duration}ms`);
  }
});

prisma.$on('error', (e) => {
  console.error('❌ Prisma Error:', e);
});

module.exports = prisma;
