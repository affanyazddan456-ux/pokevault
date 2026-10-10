// Reset all data — keep only IS_DOSK account
const db = require('./db');

(async () => {
  const removed = await db.users.remove({ username: { $ne: 'IS_DOSK' } }, { multi: true });
  console.log('Removed other users:', removed);

  const c1 = await db.cards.remove({},         { multi: true });
  const c2 = await db.trades.remove({},        { multi: true });
  const c3 = await db.auctions.remove({},      { multi: true });
  const c4 = await db.bids.remove({},          { multi: true });
  const c5 = await db.favorites.remove({},     { multi: true });
  const c6 = await db.notifications.remove({}, { multi: true });
  const c7 = await db.messages.remove({},      { multi: true });
  const c8 = await db.reports.remove({},       { multi: true });
  const c9 = await db.announcements.remove({}, { multi: true });
  console.log(`Cleared: cards=${c1} trades=${c2} auctions=${c3} bids=${c4} favs=${c5} notifs=${c6} msgs=${c7} reports=${c8} ann=${c9}`);

  await db.users.update({ username: 'IS_DOSK' }, {
    $set: { points: 0, totalCards: 0, totalTrades: 0, totalSales: 0 }
  });
  console.log('IS_DOSK stats reset to 0');

  const users = await db.users.find({});
  console.log('Remaining users:', users.map(u => `${u.username} (admin:${u.isAdmin})`));
  process.exit(0);
})();
