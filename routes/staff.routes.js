const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth');
const { check } = require('express-validator');

router.post(
  '/',
  authenticate,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('emplNo', 'Employee number is required').not().isEmpty(),
    check('idNo', 'ID number must be a valid integer').optional().isInt(),
    check('roleId', 'Role ID must be a valid integer').isInt(),
    check('phone', 'Phone number must be a valid phone number').optional().isMobilePhone(),
  ],
  staffController.createStaff,
);
router.get('/roles', authenticate, staffController.getRoles);

module.exports = router; 