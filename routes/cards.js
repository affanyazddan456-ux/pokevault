// ============================================================
//  PokéVault — Card Routes (upload, browse, details, favorites)
// ============================================================

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const router   = express.Router();
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Image Upload ───────────────────────────────────────────
const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = path.join(__dirname, '..', 'uploads', 'cards');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `card-${uuidv4()}${ext}`);
  }
});
const cardUpload = multer({
  storage: cardStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WebP files are allowed'));
  }
});

// Helper: notify user
async function notify(userId, type, message, link) {
  await db.notifications.insert({
    userId, type, message, link,
    read: false,
    createdAt: new Date().toISOString()
  });
}

// GET /api/cards — browse with filters
router.get('/', async (req, res) => {
  try {
    const { search, set, condition, forSale, forTrade, auction, minPrice, maxPrice, sort, page = 1, limit = 24 } = req.query;
    let query = { isDeleted: { $ne: true }, isSuspended: { $ne: true } };

    if (search)    query.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { set: new RegExp(search, 'i') }
    ];
    if (set)       query.set = new RegExp(set, 'i');
    if (condition) query.condition = condition;
    if (forSale === 'true')  query.saleAvailable = true;
    if (forTrade === 'true') query.tradeAvailable = true;
    if (auction === 'true')  query.auctionAvailable = true;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOpt = { createdAt: -1 };
    if (sort === 'oldest')       sortOpt = { createdAt: 1 };
    if (sort === 'price_asc')    sortOpt = { price: 1 };
    if (sort === 'price_desc')   sortOpt = { price: -1 };
    if (sort === 'popular')      sortOpt = { favoriteCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await db.cards.count(query);
    let cards = await db.cards.find(query).sort(sortOpt).skip(skip).limit(parseInt(limit));

    // Filter out cards from suspended/deleted users
    const enriched = (await Promise.all(cards.map(async c => {
      const owner = await db.users.findOne({ _id: c.ownerId });
      if (!owner || owner.isSuspended) return null; // hide if owner suspended/deleted
      return { ...c, ownerUsername: owner.username || 'Unknown', ownerAvatar: owner.avatar || null };
    }))).filter(Boolean);

    res.json({ cards: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('[CARDS GET]', err);
    res.status(500).json({ error: 'Could not fetch cards' });
  }
});

// POST /api/cards — upload new card
router.post('/', requireAuth, cardUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Card image is required' });

    const {
      title, description, set, cardNumber, condition, obtainedFrom,
      tradeAvailable, saleAvailable, auctionAvailable,
      price, startingBid, tradePreferences, dateAcquired, notes,
      hp, rarity, energyType
    } = req.body;

    if (!title || !condition) {
      return res.status(400).json({ error: 'Title and condition are required' });
    }

    const CONDITIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];
    if (!CONDITIONS.includes(condition)) {
      return res.status(400).json({ error: 'Invalid condition value' });
    }

    const card = {
      _id: uuidv4(),
      ownerId: req.session.userId,
      title: title.trim(),
      description: description?.trim() || '',
      set: set?.trim() || '',
      cardNumber: cardNumber?.trim() || '',
      condition,
      hp: hp ? parseInt(hp) : null,
      rarity: rarity?.trim() || '',
      energyType: energyType?.trim() || '',
      obtainedFrom: obtainedFrom?.trim() || '',
      imageUrl: `/uploads/cards/${req.file.filename}`,
      tradeAvailable: tradeAvailable === 'true',
      saleAvailable:  saleAvailable  === 'true',
      auctionAvailable: auctionAvailable === 'true',
      price:        saleAvailable  === 'true' ? parseFloat(price) || 0 : null,
      startingBid:  auctionAvailable === 'true' ? parseFloat(startingBid) || 0 : null,
      tradePreferences: tradePreferences?.trim() || '',
      dateAcquired: dateAcquired || null,
      notes: notes?.trim() || '',
      favoriteCount: 0,
      isDeleted:   false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };

    await db.cards.insert(card);

    // Award points for uploading
    await db.users.update({ _id: req.session.userId }, { $inc: { points: 5, totalCards: 1 } });

    res.status(201).json({ card });
  } catch (err) {
    console.error('[CARD UPLOAD]', err);
    res.status(500).json({ error: 'Card upload failed. Please try again.' });
  }
});

// GET /api/cards/my — get current user's cards
router.get('/my', requireAuth, async (req, res) => {
  try {
    const cards = await db.cards.find({ ownerId: req.session.userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch your cards' });
  }
});

// GET /api/cards/:id — card detail
router.get('/:id', async (req, res) => {
  try {
    const card = await db.cards.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const owner = await db.users.findOne({ _id: card.ownerId });
    const isFav = req.session.userId
      ? !!(await db.favorites.findOne({ userId: req.session.userId, cardId: card._id }))
      : false;
    res.json({ card: { ...card, ownerUsername: owner?.username, ownerAvatar: owner?.avatar }, isFavorite: isFav });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch card' });
  }
});

// PUT /api/cards/:id — update card
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const card = await db.cards.findOne({ _id: req.params.id });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.ownerId !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this card' });
    }
    const allowed = ['title','description','set','cardNumber','condition','obtainedFrom',
                     'tradeAvailable','saleAvailable','auctionAvailable','price',
                     'startingBid','tradePreferences','notes'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    await db.cards.update({ _id: req.params.id }, { $set: updates });
    res.json({ message: 'Card updated' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update card' });
  }
});

// DELETE /api/cards/:id — soft-delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const card = await db.cards.findOne({ _id: req.params.id });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.ownerId !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await db.cards.update({ _id: req.params.id }, { $set: { isDeleted: true } });
    await db.users.update({ _id: card.ownerId }, { $inc: { totalCards: -1 } });
    res.json({ message: 'Card removed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete card' });
  }
});

// POST /api/cards/:id/favorite — toggle favorite
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const existing = await db.favorites.findOne({ userId: req.session.userId, cardId: req.params.id });
    if (existing) {
      await db.favorites.remove({ userId: req.session.userId, cardId: req.params.id });
      await db.cards.update({ _id: req.params.id }, { $inc: { favoriteCount: -1 } });
      return res.json({ favorited: false });
    }
    await db.favorites.insert({ userId: req.session.userId, cardId: req.params.id, createdAt: new Date().toISOString() });
    await db.cards.update({ _id: req.params.id }, { $inc: { favoriteCount: 1 } });
    res.json({ favorited: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not toggle favorite' });
  }
});

// GET /api/cards/user/:userId — all cards by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const owner = await db.users.findOne({ _id: req.params.userId });
    if (!owner || owner.isSuspended) return res.json({ cards: [] });
    const cards = await db.cards.find({
      ownerId: req.params.userId,
      isDeleted:   { $ne: true },
      isSuspended: { $ne: true }
    }).sort({ createdAt: -1 });
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user cards' });
  }
});

module.exports = router;
