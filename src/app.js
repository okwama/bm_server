const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/request.routes');
const teamRoutes = require('./routes/team.routes');
const locationRoutes = require('./routes/location.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api', teamRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/locations', locationRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use(errorHandler);

module.exports = app;