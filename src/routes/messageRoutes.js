const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All routes are protected
router.post('/conversations', auth, messageController.createConversation);
router.get('/conversations', auth, messageController.getConversations);
router.get('/conversations/:id', auth, messageController.getConversation);

router.post('/messages', auth, messageController.sendMessage);
router.get('/messages/:conversationId', auth, messageController.getMessages);
router.get('/unread-count', auth, messageController.getUnreadCount);

module.exports = router;
