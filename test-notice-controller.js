// Test script to check notice controller import
try {
  console.log('Testing notice controller import...');
  const noticeController = require('./controllers/notice.controller');
  console.log('Notice controller imported successfully');
  console.log('Available methods:', Object.keys(noticeController));
  console.log('getAllNotices method:', typeof noticeController.getAllNotices);
} catch (error) {
  console.error('Error importing notice controller:', error);
} 