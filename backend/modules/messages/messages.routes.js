const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');
const auth = require('../../middleware/authMiddleware');

const PAGE_SIZE = 50;

// ─── GET /api/messages/:userId/:chatUserId ──────────────────────────────────
// Paginated conversation fetch. Query param: ?page=1
router.get('/:userId/:chatUserId', auth, async (req, res) => {
  try {
    const { userId, chatUserId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * PAGE_SIZE;

    const filter = {
      $or: [
        { sender: userId, receiver: chatUserId },
        { sender: chatUserId, receiver: userId },
      ],
      deletedFor: { $ne: userId },
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Message.countDocuments(filter),
    ]);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: skip + messages.length < total,
      page,
    });
  } catch (err) {
    console.error('[Messages] GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/messages ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { sender, receiver, text, imageUrl } = req.body;

    if (!sender || !receiver) {
      return res.status(400).json({ error: 'Sender and receiver are required.' });
    }
    if (!text?.trim() && !imageUrl) {
      return res.status(400).json({ error: 'Message must contain text or an image.' });
    }

    const message = await Message.create({
      sender,
      receiver,
      text: text?.trim() || '',
      imageUrl: imageUrl || null,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('[Messages] POST error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/messages/clear ─────────────────────────────────────────────────
// Clear chat for the authenticated user only
router.put('/clear', auth, async (req, res) => {
  try {
    const { chatUserId } = req.body;
    const userId = req.user.userId; // From auth middleware — no tokenUserId needed

    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: chatUserId },
          { sender: chatUserId, receiver: userId },
        ],
      },
      { $addToSet: { deletedFor: userId } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Messages] clear error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
