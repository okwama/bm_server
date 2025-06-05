const express = require('express');
const router = express.Router();
const crewLocationController = require('../controllers/crewlocation.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, crewLocationController.createLocation);
router.get('/:requestId', authenticate, crewLocationController.getLocationsByRequest);

module.exports = router;
