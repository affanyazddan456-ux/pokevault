// ============================================================
//  PokéVault — Appeals Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// POST /api/appeals — submit an appeal (no auth required — user may be suspended)
router.post('/', async (req, res) => {
  try {
    const { userId, username, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
    if (!userId)          return res.status(400).json({ error: 'User ID is required' });

    // Check only 1 pending appeal per user
    const existing = await db.appeals.findOne({ userId, status: 'pending' });
    if (existing) return res.status(400).json({ error: 'You already have a pending appeal. Please wait for a response.' });

    const appeal = {
      _id:       uuidv4(),
      userId,
      username:  username || 'Unknown',
      message:   message.trim(),
      status:    'pending',  // pending | approved | rejected
      adminNote: '',
      createdAt: new Date().toISOString(),
    };

    await db.appeals.insert(appeal);
    res.status(201).json({ message: 'Appeal submitted. The admin will review it soon.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not submit appeal' });
  }
});

// GET /api/appeals — admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const appeals = await db.appeals.find({}).sort({ createdAt: -1 });
    res.json({ appeals });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch appeals' });
  }
});

// PUT /api/appeals/:id/approve — admin approves (unsuspend user)
router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const appeal = await db.appeals.findOne({ _id: req.params.id });
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    // Unsuspend the user
    await db.users.update(
      { _id: appeal.userId },
      { $set: { isSuspended: false, suspendedUntil: null, suspendReason: null } }
    );

    await db.appeals.update({ _id: req.params.id }, {
      $set: { status: 'approved', adminNote: req.body.note || 'Appeal approved', resolvedAt: new Date().toISOString() }
    });

    // Notify user
    await db.notifications.insert({
      userId:    appeal.userId,
      type:      'appeal_approved',
      message:   '✅ Your appeal has been approved. Your account has been reinstated!',
      link:      '/',
      read:      false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Appeal approved — user unsuspended' });
  } catch (err) {
    res.status(500).json({ error: 'Could not approve appeal' });
  }
});

// PUT /api/appeals/:id/reject — admin rejects
router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const appeal = await db.appeals.findOne({ _id: req.params.id });
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    await db.appeals.update({ _id: req.params.id }, {
      $set: { status: 'rejected', adminNote: req.body.note || 'Appeal rejected', resolvedAt: new Date().toISOString() }
    });

    // Notify user
    await db.notifications.insert({
      userId:    appeal.userId,
      type:      'appeal_rejected',
      message:   `❌ Your appeal was reviewed and rejected. ${req.body.note || ''}`,
      link:      '/',
      read:      false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Appeal rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Could not reject appeal' });
  }
});

module.exports = router;
