require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler =require('./middleware/error');
const prisma = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/request.routes');
const teamRoutes = require('./routes/team.routes');
const locationRoutes = require('./routes/location.routes');
const uploadRoutes = require('./routes/upload.routes');
const sosRoutes = require('./routes/sos.routes');
const noticeRoutes = require('./routes/notice.routes');
const staffRoutes = require('./routes/staff.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/staff', staffRoutes);

app.get('/', (req, res) => {
  res.send('BM Security API is running');
});

app.use(errorHandler);

// Export the app for Vercel serverless functions or other modules
module.exports = app;

if (require.main === module) {
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

    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            prisma.$disconnect();
        });
    });
} 