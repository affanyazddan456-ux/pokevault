// ============================================================
//  PokéVault — User Routes (profiles, leaderboard, notifications)
//  NOTE: All /me/* routes MUST come before /:id to avoid param collision
// ============================================================

const express  = require('express');
const path     = require('path');
const multer   = require('multer');
const router   = express.Router();
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Avatar Upload ──────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = path.join(__dirname, '..', 'uploads', 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.session.userId}-${Date.now()}${ext}`);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── /me routes FIRST (before /:id) ────────────────────────

// GET /api/users/me/notifications
router.get('/me/notifications', requireAuth, async (req, res) => {
  try {
    const notifs = await db.notifications.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(30);
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

// PUT /api/users/me/notifications/read — mark all as read
router.put('/me/notifications/read', requireAuth, async (req, res) => {
  try {
    await db.notifications.update(
      { userId: req.session.userId, read: false },
      { $set: { read: true } },
      { multi: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

// PUT /api/users/me/profile — update own profile
router.put('/me/profile', requireAuth, async (req, res) => {
  try {
    const { bio } = req.body;
    await db.users.update({ _id: req.session.userId }, { $set: { bio: bio || '' } });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// POST /api/users/me/avatar — upload avatar
router.post('/me/avatar', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await db.users.update({ _id: req.session.userId }, { $set: { avatar: avatarUrl } });
    res.json({ avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Avatar upload failed' });
  }
});

// ── Static named routes ────────────────────────────────────

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await db.users.find({}).sort({ points: -1 }).limit(50);
    const safe = users.map(({ passwordHash, email, ...u }) => u);
    res.json({ leaderboard: safe });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

// ── Param routes LAST ──────────────────────────────────────

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, email, ...safeUser } = user;
    // Hide cards if suspended
    const cards = user.isSuspended
      ? []
      : await db.cards.find({ ownerId: user._id, isDeleted: { $ne: true }, isSuspended: { $ne: true } });
    const rank  = await db.users.count({ points: { $gt: user.points } });
    res.json({ user: { ...safeUser, rank: rank + 1 }, cardCount: cards.length });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

module.exports = router;
