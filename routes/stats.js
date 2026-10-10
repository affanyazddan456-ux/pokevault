// ============================================================
//  PokéVault — Community Statistics Route
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/stats — real community statistics from database
router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString();

    // Auto-close expired auctions before counting
    await db.auctions.update(
      { status: 'active', endTime: { $lt: now } },
      { $set: { status: 'ended' } },
      { multi: true }
    );

    // Auto-lift timed suspensions
    await db.users.update(
      { isSuspended: true, suspendedUntil: { $lt: now, $ne: null } },
      { $set: { isSuspended: false, suspendedUntil: null } },
      { multi: true }
    );

    const [totalMembers, totalCards, cardsForTrade, cardsForSale, activeAuctions, completedTrades, announcements] = await Promise.all([
      db.users.count({}),
      db.cards.count({ isDeleted: { $ne: true }, isSuspended: { $ne: true } }),
      db.cards.count({ tradeAvailable: true, isDeleted: { $ne: true }, isSuspended: { $ne: true } }),
      db.cards.count({ saleAvailable: true,  isDeleted: { $ne: true }, isSuspended: { $ne: true } }),
      db.auctions.count({ status: 'active' }),
      db.trades.count({ status: 'accepted' }),
      db.announcements.find({ active: true }).then(r => r),
    ]);

    res.json({ totalMembers, totalCards, cardsForTrade, cardsForSale, activeAuctions, completedTrades, announcements });
  } catch (err) {
    console.error('[STATS]', err);
    res.status(500).json({ error: 'Could not fetch statistics' });
  }
});

module.exports = router;
