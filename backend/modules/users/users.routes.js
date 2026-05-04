const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/authMiddleware');

const SAFE_FIELDS = '_id name email phone profilePicture isOnline lastSeen';

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, SAFE_FIELDS).sort({ name: 1 }).lean();
    res.json(users);
  } catch (err) {
    console.error('[Users] GET / error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, SAFE_FIELDS).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] GET /:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/users/:id/name ─────────────────────────────────────────────────
router.put('/:id/name', auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, select: SAFE_FIELDS }
    ).lean();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] PUT name error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/users/:id/avatar ───────────────────────────────────────────────
router.put('/:id/avatar', auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profilePicture: profilePicture || null },
      { new: true, select: SAFE_FIELDS }
    ).lean();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] PUT avatar error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
