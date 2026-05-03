const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// POST /api/auth/send-otp
// Generate and send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, name } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    // Determine if it's email or phone
    const isEmail = identifier.includes('@');

    // Server-side format validation
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
    } else {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(identifier.trim().replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Please enter a valid phone number (7–15 digits).' });
      }
    }

    const updateQuery = isEmail ? { email: identifier.trim() } : { phone: identifier.trim() };

    // Find or create user
    let user = await User.findOne(updateQuery);
    if (!user) {
      // New user — register them
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'User not found. Provide your full name (min 2 characters) to register.' });
      }
      user = new User({
        ...updateQuery,
        name: name.trim(),
        username: identifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
      });
      try {
        await user.save();
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          const field = isEmail ? 'email address' : 'phone number';
          return res.status(409).json({ error: `This ${field} is already registered. Please log in instead.` });
        }
        throw saveErr;
      }
    } else {
      // Existing user — validate name if provided
      if (name && name.trim().length > 0) {
        const providedName = name.trim().toLowerCase();
        const storedName = user.name.trim().toLowerCase();
        if (providedName !== storedName) {
          const field = isEmail ? 'email address' : 'phone number';
          return res.status(401).json({
            error: `This ${field} is already registered under a different name. Please enter the correct credentials.`
          });
        }
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ identifier }); // clean up old ones
    await OTP.create({ identifier, otp });

    console.log(`\n\n=== OTP for ${identifier} is: ${otp} ===\n\n`);

    res.json({ message: 'OTP sent successfully', otp }); // otp returned for easy local testing
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify-otp
// Verify OTP and issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required' });
    }

    const validOtp = await OTP.findOne({ identifier, otp });
    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const isEmail = identifier.includes('@');
    const userQuery = isEmail ? { email: identifier } : { phone: identifier };
    const user = await User.findOne(userQuery);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Clean up OTP
    await OTP.deleteMany({ identifier });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
