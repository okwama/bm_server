const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const noticeController = require('../controllers/notice.controller');
const { check } = require('express-validator');

// Get all notices (authenticated)
router.get('/', authenticate, noticeController.getAllNotices);

// Get a single notice (authenticated)
router.get('/:id', authenticate, noticeController.getNotice);

// Create a new notice (admin/supervisor only)
router.post('/', authenticate, authorizeRoles('ADMIN', 'SUPERVISOR'), [
  check('title', 'Title is required').not().isEmpty().trim(),
  check('content', 'Content is required').not().isEmpty().trim(),
  check('title', 'Title must be between 1 and 200 characters').isLength({ min: 1, max: 200 }),
  check('content', 'Content must be between 1 and 5000 characters').isLength({ min: 1, max: 5000 })
], noticeController.createNotice);

// Update a notice (admin/supervisor only)
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'SUPERVISOR'), [
  check('title', 'Title is required').not().isEmpty().trim(),
  check('content', 'Content is required').not().isEmpty().trim(),
  check('title', 'Title must be between 1 and 200 characters').isLength({ min: 1, max: 200 }),
  check('content', 'Content must be between 1 and 5000 characters').isLength({ min: 1, max: 5000 })
], noticeController.updateNotice);

// Delete a notice (admin/supervisor only)
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'SUPERVISOR'), noticeController.deleteNotice);

module.exports = router;
