const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversation,
  addMessage,
  insertMessage,
  editMessage,
  deleteMessage,
  bulkUploadMessages,
  clearConversation,
} = require('../controllers/conversationController');
const { analyzeConversation } = require('../controllers/aiController');

// All routes require authentication
router.use(protect);

// Conversation CRUD
router.get('/:clientId', getConversation);
router.post('/:clientId/messages', addMessage);
router.post('/:clientId/messages/insert', insertMessage);
router.put('/:clientId/messages/:messageId', editMessage);
router.delete('/:clientId/messages/:messageId', deleteMessage);

// Bulk upload
router.post('/:clientId/bulk', bulkUploadMessages);

// Clear conversation
router.delete('/:clientId/clear', clearConversation);

// AI Analysis
router.post('/:clientId/analyze', analyzeConversation);

module.exports = router;
