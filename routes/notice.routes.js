const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const noticeController = require('../controllers/notice.controller');

// Get all notices (authenticated)
router.get('/', auth, noticeController.getAllNotices);

// Get a single notice (authenticated)
router.get('/:id', auth, noticeController.getNotice);

// Create a new notice (authenticated)
router.post('/', auth, noticeController.createNotice);

// Update a notice (authenticated)
router.put('/:id', auth, noticeController.updateNotice);

// Delete a notice (authenticated)
router.delete('/:id', auth, noticeController.deleteNotice);

module.exports = router;
