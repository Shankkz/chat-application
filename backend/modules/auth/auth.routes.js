const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const OTP = require('../../models/OTP');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-(]{7,20}$/;

// ─── POST /api/auth/send-otp ────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, name } = req.body;

    if (!identifier?.trim()) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    const raw = identifier.trim();
    const isEmail = EMAIL_RE.test(raw);
    const isPhone = !isEmail && PHONE_RE.test(raw.replace(/\s/g, ''));

    if (!isEmail && !isPhone) {
      return res.status(400).json({ error: 'Please enter a valid email address or phone number.' });
    }

    // Build query using separate columns — no generic identifier field
    const query = isEmail ? { email: raw.toLowerCase() } : { phone: raw };

    let user = await User.findOne(query);

    if (!user) {
      // New user — name is required for registration
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          error: 'New account: please provide your name (min 2 characters).',
        });
      }
      user = await User.create({ ...query, name: name.trim() });
    }
    // Returning users: skip name validation entirely

    // Generate + hash OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Delete any existing OTPs for this user, then save new one
    await OTP.deleteMany(query);
    await OTP.create({ ...query, otpHash });

    console.log(`\n=== OTP for ${raw}: ${otp} ===\n`);

    // Return OTP in dev for easy testing — remove in production
    res.json({ message: 'OTP sent successfully', otp });
  } catch (err) {
    console.error('[Auth] send-otp error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/verify-otp ──────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier?.trim() || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required.' });
    }

    const raw = identifier.trim();
    const isEmail = EMAIL_RE.test(raw);
    const query = isEmail ? { email: raw.toLowerCase() } : { phone: raw };

    const otpRecord = await OTP.findOne(query);
    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or not found.' });
    }

    const isValid = await bcrypt.compare(otp.toString(), otpRecord.otpHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    // Consume OTP
    await OTP.deleteMany(query);

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return only necessary fields
    const { _id, name, email, phone, profilePicture, isOnline } = user;
    res.json({ token, user: { _id, name, email, phone, profilePicture, isOnline } });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
