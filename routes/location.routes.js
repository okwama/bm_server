const express = require('express');
const router = express.Router();
const { createLocation, getLocationsByRequest } = require('../controllers/crewlocation.controller');
const { authenticate } = require('../middleware/auth');

// POST location
router.post('/', authenticate, createLocation);

// GET locations by request ID
router.get('/:requestId', authenticate, getLocationsByRequest);

module.exports = router;
