const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const OTP = require('../models/OTP');

// GET /api/debug/users
router.get('/users', async (req, res) => {
  const users = await User.find({}).select('-__v');
  res.json({ count: users.length, users });
});

// GET /api/debug/messages
router.get('/messages', async (req, res) => {
  const messages = await Message.find({}).select('-__v').sort({ createdAt: -1 }).limit(50);
  res.json({ count: messages.length, messages });
});

// GET /api/debug/otps  (active / unexpired)
router.get('/otps', async (req, res) => {
  const otps = await OTP.find({}).select('-__v');
  res.json({ count: otps.length, otps });
});

// DELETE /api/debug/users  — wipe all users (for testing)
router.delete('/users', async (req, res) => {
  await User.deleteMany({});
  res.json({ message: 'All users deleted' });
});

module.exports = router;
