const app = require('./src/app');
const http = require('http');
const prisma = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
});