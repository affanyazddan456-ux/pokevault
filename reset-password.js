const bcrypt = require('bcryptjs');
const db     = require('./db');

(async () => {
  const hash = await bcrypt.hash('Lahore@123', 12);
  const n    = await db.users.update(
    { username: 'IS_DOSK' },
    { $set: { passwordHash: hash, isAdmin: true } }
  );
  console.log('✅ Password updated for IS_DOSK, docs modified:', n);
  process.exit(0);
})();
