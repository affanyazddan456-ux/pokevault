// ============================================================
//  PokéVault — Admin Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// ── Users ──────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.users.find({}).sort({ createdAt: -1 });
    const safe  = users.map(({ passwordHash, ...u }) => u);
    res.json({ users: safe });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

// PUT /api/admin/users/:id/suspend  — toggle OR timed ban
router.put('/users/:id/suspend', requireAdmin, async (req, res) => {
  try {
    const { hours } = req.body; // optional: ban for X hours
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ error: 'Cannot suspend an admin' });
    if (req.params.id === req.session.userId) return res.status(400).json({ error: 'Cannot suspend your own account' });

    if (user.isSuspended) {
      // Unsuspend
      await db.users.update({ _id: req.params.id }, {
        $set: { isSuspended: false, suspendedUntil: null, suspendReason: null }
      });
      return res.json({ message: 'User unsuspended', isSuspended: false });
    }

    // Suspend — timed or permanent
    const suspendedUntil = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null;
    await db.users.update({ _id: req.params.id }, {
      $set: {
        isSuspended:   true,
        suspendedUntil,
        suspendReason: req.body.reason || 'Suspended by admin'
      }
    });

    // Notify user
    await db.notifications.insert({
      userId:    req.params.id,
      type:      'account_suspended',
      message:   hours
        ? `Your account has been suspended for ${hours} hour(s). Reason: ${req.body.reason || 'Policy violation'}`
        : `Your account has been suspended. Reason: ${req.body.reason || 'Policy violation'}`,
      link:      '/',
      read:      false,
      createdAt: new Date().toISOString()
    });

    res.json({
      message: hours ? `User suspended for ${hours} hours` : 'User suspended permanently',
      isSuspended: true,
      suspendedUntil
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not update user' });
  }
});

// PUT /api/admin/users/:id/makeadmin
router.put('/users/:id/makeadmin', requireAdmin, async (req, res) => {
  try {
    await db.users.update({ _id: req.params.id }, { $set: { isAdmin: true } });
    res.json({ message: 'User promoted to admin' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update user' });
  }
});

// ── Cards ──────────────────────────────────────────────────

// DELETE /api/admin/cards/:id — soft delete
router.delete('/cards/:id', requireAdmin, async (req, res) => {
  try {
    const card = await db.cards.findOne({ _id: req.params.id });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    await db.cards.update({ _id: req.params.id }, { $set: { isDeleted: true } });
    await db.users.update({ _id: card.ownerId }, { $inc: { totalCards: -1 } });
    res.json({ message: 'Card removed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete card' });
  }
});

// PUT /api/admin/cards/:id/suspend — suspend a listing (hide from marketplace)
router.put('/cards/:id/suspend', requireAdmin, async (req, res) => {
  try {
    const card = await db.cards.findOne({ _id: req.params.id });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const newStatus = !card.isSuspended;
    await db.cards.update({ _id: req.params.id }, { $set: { isSuspended: newStatus } });

    if (newStatus) {
      await db.notifications.insert({
        userId:    card.ownerId,
        type:      'card_suspended',
        message:   `Your card "${card.title}" has been suspended by an admin.`,
        link:      `/card/${card._id}`,
        read:      false,
        createdAt: new Date().toISOString()
      });
    }
    res.json({ message: newStatus ? 'Card suspended' : 'Card unsuspended', isSuspended: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Could not suspend card' });
  }
});

// ── Announcements ──────────────────────────────────────────

// GET /api/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await db.announcements.find({ active: true }).sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch announcements' });
  }
});

// POST /api/admin/announcements — create announcement
router.post('/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, message, type = 'info', expiresAt } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

    const ann = {
      _id:       uuidv4(),
      title:     title.trim(),
      message:   message.trim(),
      type,       // info | warning | success | danger
      active:    true,
      expiresAt: expiresAt || null,
      createdBy: req.session.userId,
      createdAt: new Date().toISOString()
    };
    await db.announcements.insert(ann);

    // Push notification to ALL users
    const users = await db.users.find({});
    await Promise.all(users.map(u =>
      db.notifications.insert({
        userId:    u._id,
        type:      'announcement',
        message:   `📢 ${title}: ${message}`,
        link:      '/',
        read:      false,
        createdAt: new Date().toISOString()
      })
    ));

    res.status(201).json({ announcement: ann });
  } catch (err) {
    res.status(500).json({ error: 'Could not create announcement' });
  }
});

// DELETE /api/admin/announcements/:id — deactivate
router.delete('/announcements/:id', requireAdmin, async (req, res) => {
  try {
    await db.announcements.update({ _id: req.params.id }, { $set: { active: false } });
    res.json({ message: 'Announcement removed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove announcement' });
  }
});

// ── Reports ────────────────────────────────────────────────

// GET /api/admin/reports
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const reports = await db.reports.find({}).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch reports' });
  }
});

// PUT /api/admin/reports/:id/resolve
router.put('/reports/:id/resolve', requireAdmin, async (req, res) => {
  try {
    await db.reports.update({ _id: req.params.id }, {
      $set: { status: 'resolved', resolvedAt: new Date().toISOString() }
    });
    res.json({ message: 'Report resolved' });
  } catch (err) {
    res.status(500).json({ error: 'Could not resolve report' });
  }
});

// ── Platform Stats ─────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalCards, totalTrades, totalAuctions, pendingReports, activeAnnouncements] = await Promise.all([
      db.users.count({}),
      db.cards.count({ isDeleted: { $ne: true } }),
      db.trades.count({}),
      db.auctions.count({}),
      db.reports.count({ status: 'pending' }),
      db.announcements.count({ active: true }),
    ]);
    res.json({ totalUsers, totalCards, totalTrades, totalAuctions, pendingReports, activeAnnouncements });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch admin stats' });
  }
});

module.exports = router;
