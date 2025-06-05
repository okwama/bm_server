const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const auth = require('../middleware/auth');

// Get all pending requests
router.get('/pending', auth.authenticate, requestController.getPendingRequests);

// Get all staff requests (supervisor/admin only)
router.get('/all', auth.authenticate, requestController.getAllStaffRequests);

// Get confirmed pickup requests - MOVED THIS ROUTE BEFORE /:id
router.get('/confirmed-pickups', auth.authenticate, requestController.getConfirmedPickup);

// Get request details
router.get('/:id', auth.authenticate, requestController.getRequestDetails);

// Confirm pickup
router.post('/:id/pickup', auth.authenticate, requestController.confirmPickup);

// Confirm delivery
router.post('/:id/delivery', auth.authenticate, requestController.confirmDelivery);

module.exports = router;