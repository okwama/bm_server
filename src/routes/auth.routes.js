const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const auth = require('../middleware/auth');

router.post(
  '/login',
  [
    check('emplNo', 'Employee number is required').notEmpty(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('phone', 'Phone number is required').notEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('roleId', 'Role ID is required').isInt(),
    check('role', 'Role is required').notEmpty(),
    check('emplNo', 'Employee number is required').notEmpty(),
    check('idNo', 'ID number is required').isInt()
  ],
  authController.register
);

router.get('/profile', auth.authenticate, authController.getProfile);

router.put(
  '/profile',
  auth.authenticate,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty()
  ],
  authController.updateProfile
);

module.exports = router;