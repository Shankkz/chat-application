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
      $and: [
        {
          $or: [
            { sender: userId, receiver: chatUserId },
            { sender: chatUserId, receiver: userId }
          ]
        },
        { deletedFor: { $ne: userId } }
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
    const { sender, receiver, text, imageUrl } = req.body;

    if (!sender || !receiver) {
      return res.status(400).json({ error: 'Sender and receiver are required' });
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ error: 'Message must contain text or an image' });
    }

    const newMessage = new Message({
      sender,
      receiver,
      text: text || '',
      imageUrl: imageUrl || null
    });

    await newMessage.save();

    res.json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/messages/clear
// Clear chat for a specific user
router.put('/clear', authMiddleware, async (req, res) => {
  try {
    const { userId, chatUserId } = req.body;

    const tokenUserId = String(req.user.userId || req.user.id);
    if (tokenUserId !== String(userId)) {
      console.log(`403 Unauthorized: tokenUserId (${tokenUserId}) !== userId (${userId})`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: chatUserId },
          { sender: chatUserId, receiver: userId }
        ]
      },
      {
        $addToSet: { deletedFor: userId }
      }
    );

    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
