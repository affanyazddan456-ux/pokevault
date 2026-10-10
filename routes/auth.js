// ============================================================
//  PokéVault — Auth Routes (signup, login, logout, session)
// ============================================================

const express  = require('express');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router   = express.Router();
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, dateOfBirth, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !dateOfBirth || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscores only)' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Age check (must be at least 13)
    const dob = new Date(dateOfBirth);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 13) {
      return res.status(400).json({ error: 'You must be at least 13 years old to register' });
    }

    // Hash password — never store plaintext
    const passwordHash = await bcrypt.hash(password, 12);

    const userId = uuidv4();
    const user = {
      _id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth,
      passwordHash,
      createdAt: new Date().toISOString(),
      avatar: null,
      points: 0,
      isAdmin: false,
      isSuspended: false,
      bio: '',
      totalCards: 0,
      totalTrades: 0,
      totalSales: 0,
    };

    await db.users.insert(user);

    // Set session
    req.session.userId  = userId;
    req.session.username = user.username;
    req.session.isAdmin  = false;

    // Send safe user object (no password hash)
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser });

  } catch (err) {
    if (err.errorType === 'uniqueViolated') {
      // Check which field caused the conflict
      const emailExists = await db.users.findOne({ email: req.body.email?.trim().toLowerCase() });
      if (emailExists) return res.status(409).json({ error: 'Email already registered' });
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('[SIGNUP ERROR]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.users.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'suspended',
        reason: user.suspendReason || 'Policy violation',
        suspendedUntil: user.suspendedUntil || null
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId   = user._id;
    req.session.username = user.username;
    req.session.isAdmin  = user.isAdmin || false;

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });

  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/auth/me — check session
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.session.userId });
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'Session invalid' });
    }
    // Auto-lift timed suspension
    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) < new Date()) {
      await db.users.update({ _id: user._id }, { $set: { isSuspended: false, suspendedUntil: null } });
      user.isSuspended = false;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

module.exports = router;
