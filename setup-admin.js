const db = require('./db');

(async () => {
  // Make IS_DOSK admin
  const n1 = await db.users.update(
    { username: 'IS_DOSK' },
    { $set: { isAdmin: true } }
  );
  console.log('IS_DOSK promoted to admin:', n1, 'user(s) updated');

  // Remove fake test accounts
  const n2 = await db.users.remove(
    { username: { $in: ['testuser', 'vaulttest', 'vaulttest2', 'admin'] } },
    { multi: true }
  );
  console.log('Fake test accounts removed:', n2);

  // Verify
  const users = await db.users.find({});
  console.log('\nRemaining users:');
  users.forEach(u => console.log(' -', u.username, '|', u.email, '| admin:', u.isAdmin));

  process.exit(0);
})();
