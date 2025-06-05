const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');

router.get('/assigned-staff', authenticate, teamController.getAssignedStaff);

module.exports = router;
