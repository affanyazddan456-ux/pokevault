// ============================================================
//  PokéVault — Messages / Chat Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/messages/conversations — all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    // Find all unique conversations
    const msgs = await db.messages.find({
      $or: [{ fromId: userId }, { toId: userId }]
    }).sort({ createdAt: -1 });

    // Group by conversation partner
    const convMap = {};
    for (const m of msgs) {
      const partnerId = m.fromId === userId ? m.toId : m.fromId;
      const key = [userId, partnerId].sort().join('_');
      if (!convMap[key]) {
        const partner = await db.users.findOne({ _id: partnerId });
        convMap[key] = {
          partnerId,
          partnerUsername: partner?.username || 'Unknown',
          partnerAvatar:   partner?.avatar   || null,
          lastMessage:     m.text,
          lastAt:          m.createdAt,
          unread:          0,
          contextType:     m.contextType || null,
          contextId:       m.contextId   || null,
          contextTitle:    m.contextTitle || null,
        };
      }
      if (!m.read && m.toId === userId) convMap[key].unread++;
    }

    res.json({ conversations: Object.values(convMap).sort((a,b) => new Date(b.lastAt) - new Date(a.lastAt)) });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch conversations' });
  }
});

// GET /api/messages/:partnerId — get messages with a user
router.get('/:partnerId', requireAuth, async (req, res) => {
  try {
    const userId    = req.session.userId;
    const partnerId = req.params.partnerId;

    const msgs = await db.messages.find({
      $or: [
        { fromId: userId, toId: partnerId },
        { fromId: partnerId, toId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark all incoming as read
    await db.messages.update(
      { fromId: partnerId, toId: userId, read: false },
      { $set: { read: true } },
      { multi: true }
    );

    const partner = await db.users.findOne({ _id: partnerId });
    res.json({
      messages: msgs,
      partner: partner ? { _id: partner._id, username: partner.username, avatar: partner.avatar } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

// POST /api/messages/:partnerId — send a message
router.post('/:partnerId', requireAuth, async (req, res) => {
  try {
    const { text, contextType, contextId, contextTitle } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const partnerId = req.params.partnerId;
    const partner   = await db.users.findOne({ _id: partnerId });
    if (!partner) return res.status(404).json({ error: 'User not found' });

    const msg = {
      _id:          uuidv4(),
      fromId:       req.session.userId,
      toId:         partnerId,
      text:         text.trim(),
      read:         false,
      contextType:  contextType  || null,  // 'auction' | 'sale' | 'trade'
      contextId:    contextId    || null,
      contextTitle: contextTitle || null,
      createdAt:    new Date().toISOString(),
    };

    await db.messages.insert(msg);

    // Notify recipient
    const sender = await db.users.findOne({ _id: req.session.userId });
    await db.notifications.insert({
      userId:    partnerId,
      type:      'message',
      message:   `💬 ${sender.username}: ${text.trim().slice(0, 60)}${text.length > 60 ? '...' : ''}`,
      link:      `/messages/${req.session.userId}`,
      read:      false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Could not send message' });
  }
});

module.exports = router;
