// ============================================================
//  PokéVault — Create Admin Account Script
//  Run: node create-admin.js
// ============================================================

const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Datastore = require('nedb-promises');
const path      = require('path');

const usersDb = Datastore.create({
  filename: path.join(__dirname, 'data', 'users.db'),
  autoload: true
});

(async () => {
  const username = process.argv[2] || 'IS_DOSK';
  const email    = process.argv[3] || 'ismailyazddan@gmail.com';
  const password = process.argv[4] || 'Lahore@123';

  try {
    await usersDb.ensureIndex({ fieldName: 'email',    unique: true });
    await usersDb.ensureIndex({ fieldName: 'username', unique: true });
  } catch {}

  const existing = await usersDb.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    if (existing.username === username) {
      // Promote existing user to admin
      await usersDb.update({ username }, { $set: { isAdmin: true } });
      console.log(`\n✅ User "${username}" promoted to admin.\n`);
    } else {
      console.log(`\n❌ Email already in use.\n`);
    }
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await usersDb.insert({
    _id:          uuidv4(),
    username,
    email,
    dateOfBirth:  '1990-01-01',
    passwordHash,
    createdAt:    new Date().toISOString(),
    avatar:       null,
    points:       0,
    isAdmin:      true,
    isSuspended:  false,
    bio:          'PokéVault Administrator',
    totalCards:   0,
    totalTrades:  0,
    totalSales:   0,
  });

  console.log(`
╔══════════════════════════════════════════╗
║   PokéVault Admin Account Created! 🎉   ║
╠══════════════════════════════════════════╣
║  Username : ${username.padEnd(29)}║
║  Email    : ${email.padEnd(29)}║
║  Password : ${password.padEnd(29)}║
╚══════════════════════════════════════════╝

Change the password after first login!
  `);
  process.exit(0);
})();
