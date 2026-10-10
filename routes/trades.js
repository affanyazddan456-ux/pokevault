// ============================================================
//  PokéVault — Trade Routes
// ============================================================

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const router   = express.Router();
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

async function notify(userId, type, message, link) {
  await db.notifications.insert({ userId, type, message, link, read: false, createdAt: new Date().toISOString() });
}

// GET /api/trades — get trades for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const trades = await db.trades.find({
      $or: [{ senderId: req.session.userId }, { receiverId: req.session.userId }]
    }).sort({ createdAt: -1 });

    const enriched = await Promise.all(trades.map(async t => {
      const sender   = await db.users.findOne({ _id: t.senderId });
      const receiver = await db.users.findOne({ _id: t.receiverId });
      return { ...t, senderUsername: sender?.username, receiverUsername: receiver?.username };
    }));

    res.json({ trades: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch trades' });
  }
});

// POST /api/trades — create trade request
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiverId, offeredCardIds, requestedCardIds, message } = req.body;

    if (!receiverId || !offeredCardIds?.length || !requestedCardIds?.length) {
      return res.status(400).json({ error: 'Receiver, offered cards, and requested cards are required' });
    }
    if (receiverId === req.session.userId) {
      return res.status(400).json({ error: 'Cannot trade with yourself' });
    }

    // Verify offered cards belong to sender
    for (const cardId of offeredCardIds) {
      const card = await db.cards.findOne({ _id: cardId, ownerId: req.session.userId });
      if (!card) return res.status(400).json({ error: `You do not own card ${cardId}` });
    }
    // Verify requested cards belong to receiver
    for (const cardId of requestedCardIds) {
      const card = await db.cards.findOne({ _id: cardId, ownerId: receiverId });
      if (!card) return res.status(400).json({ error: `Target user does not own card ${cardId}` });
    }

    const trade = {
      _id: uuidv4(),
      senderId:       req.session.userId,
      receiverId,
      offeredCardIds,
      requestedCardIds,
      message:        message?.trim() || '',
      status:         'pending',
      createdAt:      new Date().toISOString(),
    };

    await db.trades.insert(trade);

    const sender = await db.users.findOne({ _id: req.session.userId });
    await notify(receiverId, 'trade_request', `${sender.username} wants to trade cards with you!`, `/trade/${trade._id}`);

    res.status(201).json({ trade });
  } catch (err) {
    console.error('[TRADE CREATE]', err);
    res.status(500).json({ error: 'Could not create trade request' });
  }
});

// GET /api/trades/:id — get single trade
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const trade = await db.trades.findOne({ _id: req.params.id });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.senderId !== req.session.userId && trade.receiverId !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const sender   = await db.users.findOne({ _id: trade.senderId });
    const receiver = await db.users.findOne({ _id: trade.receiverId });

    const offeredCards   = await Promise.all(trade.offeredCardIds.map(id => db.cards.findOne({ _id: id })));
    const requestedCards = await Promise.all(trade.requestedCardIds.map(id => db.cards.findOne({ _id: id })));

    res.json({ trade: { ...trade, senderUsername: sender?.username, receiverUsername: receiver?.username, offeredCards, requestedCards } });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch trade' });
  }
});

// PUT /api/trades/:id/respond — accept or decline
router.put('/:id/respond', requireAuth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or decline' });
    }

    const trade = await db.trades.findOne({ _id: req.params.id });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.receiverId !== req.session.userId) return res.status(403).json({ error: 'Not authorized' });
    if (trade.status !== 'pending') return res.status(400).json({ error: 'Trade is no longer pending' });

    if (action === 'accept') {
      await db.trades.update({ _id: req.params.id }, { $set: { status: 'accepted', respondedAt: new Date().toISOString() } });

      // Transfer card ownership
      for (const cardId of trade.offeredCardIds) {
        await db.cards.update({ _id: cardId }, { $set: { ownerId: trade.receiverId } });
      }
      for (const cardId of trade.requestedCardIds) {
        await db.cards.update({ _id: cardId }, { $set: { ownerId: trade.senderId } });
      }

      // Award points
      await db.users.update({ _id: trade.senderId },   { $inc: { points: 15, totalTrades: 1 } });
      await db.users.update({ _id: trade.receiverId }, { $inc: { points: 15, totalTrades: 1 } });

      const receiver = await db.users.findOne({ _id: req.session.userId });
      await notify(trade.senderId, 'trade_accepted', `${receiver.username} accepted your trade!`, `/trade/${trade._id}`);
    } else {
      await db.trades.update({ _id: req.params.id }, { $set: { status: 'declined', respondedAt: new Date().toISOString() } });
      const receiver = await db.users.findOne({ _id: req.session.userId });
      await notify(trade.senderId, 'trade_declined', `${receiver.username} declined your trade request.`, `/trade/${trade._id}`);
    }

    res.json({ message: `Trade ${action}ed` });
  } catch (err) {
    console.error('[TRADE RESPOND]', err);
    res.status(500).json({ error: 'Could not respond to trade' });
  }
});

// PUT /api/trades/:id/cancel — cancel own pending trade
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const trade = await db.trades.findOne({ _id: req.params.id });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.senderId !== req.session.userId) return res.status(403).json({ error: 'Not authorized' });
    if (trade.status !== 'pending') return res.status(400).json({ error: 'Can only cancel pending trades' });

    await db.trades.update({ _id: req.params.id }, { $set: { status: 'cancelled' } });
    res.json({ message: 'Trade cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel trade' });
  }
});

module.exports = router;
