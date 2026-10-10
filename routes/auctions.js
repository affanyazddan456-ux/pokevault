// ============================================================
//  PokéVault — Auction Routes
// ============================================================

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const router   = express.Router();
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

async function notify(userId, type, message, link) {
  await db.notifications.insert({ userId, type, message, link, read: false, createdAt: new Date().toISOString() });
}

// GET /api/auctions — list active/all auctions
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 12 } = req.query;
    const now = new Date().toISOString();

    // Auto-close expired auctions
    await db.auctions.update(
      { status: 'active', endTime: { $lt: now } },
      { $set: { status: 'ended' } },
      { multi: true }
    );

    let query = {};
    if (status !== 'all') query.status = status;

    const total = await db.auctions.count(query);
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const auctions = await db.auctions.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const enriched = await Promise.all(auctions.map(async a => {
      const card   = await db.cards.findOne({ _id: a.cardId });
      const seller = await db.users.findOne({ _id: a.sellerId });
      const bidCount = await db.bids.count({ auctionId: a._id });
      return { ...a, card, sellerUsername: seller?.username, bidCount };
    }));

    res.json({ auctions: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('[AUCTION LIST]', err);
    res.status(500).json({ error: 'Could not fetch auctions' });
  }
});

// POST /api/auctions — create auction
router.post('/', requireAuth, async (req, res) => {
  try {
    const { cardId, startingBid, reservePrice, durationHours, description } = req.body;

    if (!cardId || !startingBid || !durationHours) {
      return res.status(400).json({ error: 'Card, starting bid, and duration are required' });
    }

    const card = await db.cards.findOne({ _id: cardId, ownerId: req.session.userId });
    if (!card) return res.status(404).json({ error: 'Card not found or you do not own it' });

    // Check no active auction for this card
    const existing = await db.auctions.findOne({ cardId, status: 'active' });
    if (existing) return res.status(400).json({ error: 'This card already has an active auction' });

    const startTime = new Date().toISOString();
    const endTime   = new Date(Date.now() + parseFloat(durationHours) * 3600 * 1000).toISOString();

    const auction = {
      _id:          uuidv4(),
      cardId,
      sellerId:     req.session.userId,
      startingBid:  parseFloat(startingBid),
      reservePrice: reservePrice ? parseFloat(reservePrice) : null,
      currentBid:   parseFloat(startingBid),
      highestBidder: null,
      description:  description?.trim() || '',
      startTime,
      endTime,
      status:       'active',
      createdAt:    startTime,
    };

    await db.auctions.insert(auction);
    await db.cards.update({ _id: cardId }, { $set: { auctionAvailable: true } });

    res.status(201).json({ auction });
  } catch (err) {
    console.error('[AUCTION CREATE]', err);
    res.status(500).json({ error: 'Could not create auction' });
  }
});

// GET /api/auctions/:id
router.get('/:id', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const auction = await db.auctions.findOne({ _id: req.params.id });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    // Auto-close if expired
    if (auction.status === 'active' && auction.endTime < now) {
      await db.auctions.update({ _id: auction._id }, { $set: { status: 'ended' } });
      auction.status = 'ended';
    }

    const card    = await db.cards.findOne({ _id: auction.cardId });
    const seller  = await db.users.findOne({ _id: auction.sellerId });
    const bids    = await db.bids.find({ auctionId: auction._id }).sort({ createdAt: -1 }).limit(20);
    const enrichedBids = await Promise.all(bids.map(async b => {
      const bidder = await db.users.findOne({ _id: b.bidderId });
      return { ...b, bidderUsername: bidder?.username };
    }));

    res.json({ auction: { ...auction, card, sellerUsername: seller?.username, bids: enrichedBids } });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch auction' });
  }
});

// POST /api/auctions/:id/bid — place a bid
router.post('/:id/bid', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Valid bid amount required' });

    const now = new Date().toISOString();
    const auction = await db.auctions.findOne({ _id: req.params.id });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
    if (auction.endTime < now) return res.status(400).json({ error: 'Auction has ended' });
    if (auction.sellerId === req.session.userId) return res.status(400).json({ error: 'Cannot bid on your own auction' });

    const bid = parseFloat(amount);
    if (bid <= auction.currentBid) {
      return res.status(400).json({ error: `Bid must be higher than current bid of ${auction.currentBid}` });
    }

    const prevBidder = auction.highestBidder;

    const newBid = {
      _id:       uuidv4(),
      auctionId: auction._id,
      bidderId:  req.session.userId,
      amount:    bid,
      createdAt: now,
    };

    await db.bids.insert(newBid);
    await db.auctions.update({ _id: auction._id }, { $set: { currentBid: bid, highestBidder: req.session.userId } });

    // Award bidder points
    await db.users.update({ _id: req.session.userId }, { $inc: { points: 2 } });

    const bidder = await db.users.findOne({ _id: req.session.userId });

    // Notify seller
    await notify(auction.sellerId, 'new_bid', `New bid of ${bid} placed on your auction!`, `/auction/${auction._id}`);

    // Notify outbid user
    if (prevBidder && prevBidder !== req.session.userId) {
      await notify(prevBidder, 'outbid', `You've been outbid on an auction! New bid: ${bid}`, `/auction/${auction._id}`);
    }

    res.json({ bid: newBid, currentBid: bid });
  } catch (err) {
    console.error('[BID ERROR]', err);
    res.status(500).json({ error: 'Could not place bid' });
  }
});

// DELETE /api/auctions/:id — cancel auction (seller only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const auction = await db.auctions.findOne({ _id: req.params.id });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.sellerId !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (auction.status !== 'active') return res.status(400).json({ error: 'Can only cancel active auctions' });

    await db.auctions.update({ _id: req.params.id }, { $set: { status: 'cancelled' } });
    await db.cards.update({ _id: auction.cardId }, { $set: { auctionAvailable: false } });

    res.json({ message: 'Auction cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Could not cancel auction' });
  }
});

module.exports = router;
