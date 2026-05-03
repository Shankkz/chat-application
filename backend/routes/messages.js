const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/messages/:userId/:chatUserId
// Get conversation between two users
router.get('/:userId/:chatUserId', authMiddleware, async (req, res) => {
  try {
    const { userId, chatUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: chatUserId },
        { sender: chatUserId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages
// Send a new message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({ error: 'Sender, receiver, and text are required' });
    }

    const newMessage = new Message({
      sender,
      receiver,
      text
    });

    await newMessage.save();

    res.json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
