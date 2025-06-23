require('dotenv').config();
const http = require('http');
const app =require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        prisma.$disconnect();
    });
}); 