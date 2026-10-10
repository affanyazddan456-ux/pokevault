// ============================================================
//  PokéVault — Database Layer (NeDB — embedded, no native deps)
// ============================================================

const Datastore = require('nedb-promises');
const path      = require('path');
const fs        = require('fs');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = {
  users:         Datastore.create({ filename: path.join(DATA_DIR, 'users.db'),          autoload: true }),
  cards:         Datastore.create({ filename: path.join(DATA_DIR, 'cards.db'),          autoload: true }),
  trades:        Datastore.create({ filename: path.join(DATA_DIR, 'trades.db'),         autoload: true }),
  auctions:      Datastore.create({ filename: path.join(DATA_DIR, 'auctions.db'),       autoload: true }),
  bids:          Datastore.create({ filename: path.join(DATA_DIR, 'bids.db'),           autoload: true }),
  favorites:     Datastore.create({ filename: path.join(DATA_DIR, 'favorites.db'),      autoload: true }),
  notifications: Datastore.create({ filename: path.join(DATA_DIR, 'notifications.db'),  autoload: true }),
  reports:       Datastore.create({ filename: path.join(DATA_DIR, 'reports.db'),        autoload: true }),
  announcements: Datastore.create({ filename: path.join(DATA_DIR, 'announcements.db'),  autoload: true }),
  messages:      Datastore.create({ filename: path.join(DATA_DIR, 'messages.db'),       autoload: true }),
  appeals:       Datastore.create({ filename: path.join(DATA_DIR, 'appeals.db'),        autoload: true }),
};

// Create indexes for better query performance
(async () => {
  try {
    await db.users.ensureIndex({ fieldName: 'email',    unique: true });
    await db.users.ensureIndex({ fieldName: 'username', unique: true });
    await db.cards.ensureIndex({ fieldName: 'ownerId' });
    await db.trades.ensureIndex({ fieldName: 'senderId' });
    await db.trades.ensureIndex({ fieldName: 'receiverId' });
    await db.auctions.ensureIndex({ fieldName: 'cardId' });
    await db.bids.ensureIndex({ fieldName: 'auctionId' });
    await db.favorites.ensureIndex({ fieldName: 'userId' });
    await db.notifications.ensureIndex({ fieldName: 'userId' });
  } catch (e) {
    // Index creation errors (duplicates) are safe to ignore on restart
  }
})();

module.exports = db;
