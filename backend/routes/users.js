const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/users
// Get all users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-__v').sort({ username: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
// Get single user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/name
// Update user's name
router.put('/:id/name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Ensure the user is updating their own name
    const tokenUserId = String(req.user.userId || req.user.id);
    if (tokenUserId !== String(req.params.id)) {
      console.log(`403 Unauthorized: tokenUserId (${tokenUserId}) !== req.params.id (${req.params.id})`);
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, select: '-__v' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/avatar
// Update user's profile picture
router.put('/:id/avatar', authMiddleware, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    const tokenUserId = String(req.user.userId || req.user.id);
    if (tokenUserId !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profilePicture },
      { new: true, select: '-__v' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
