// ============================================================
//  PokéVault — Main Server Entry Point
//  Node.js + Express + NeDB (pure-JS embedded database)
// ============================================================

const express      = require('express');
const session      = require('express-session');
const cors         = require('cors');
const path         = require('path');
const rateLimit    = require('express-rate-limit');

const db           = require('./db');
const authRoutes   = require('./routes/auth');
const cardRoutes   = require('./routes/cards');
const userRoutes   = require('./routes/users');
const tradeRoutes  = require('./routes/trades');
const auctionRoutes = require('./routes/auctions');
const statsRoutes  = require('./routes/stats');
const adminRoutes  = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const messageRoutes = require('./routes/messages');
const appealRoutes  = require('./routes/appeals');

const app = express();
const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

// Trust Railway's reverse proxy
app.set('trust proxy', 1);

// ── Prevent crashes from unhandled errors ──────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
});

// ── Rate limiting ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Core middleware ────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session (disk on local, memory on Railway/cloud) ──────
const isCloud = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'pokevault-secret-2024',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
};
if (!isCloud) {
  // Local: persist sessions to disk
  const NedbStore = require('connect-nedb-session')(session);
  sessionConfig.store = new NedbStore({
    filename: path.join(__dirname, 'data', 'sessions.db')
  });
}
app.use(session(sessionConfig));

// ── Static files ───────────────────────────────────────────
const fs = require('fs');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MP3 — inline playback, no download prompt
app.get('/audio/:file', (req, res) => {
  const audioFile = path.join(PUBLIC_DIR, 'audio', req.params.file);
  if (!fs.existsSync(audioFile)) return res.status(404).end();
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(audioFile).pipe(res);
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/cards',    cardRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/trades',   tradeRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/stats',    statsRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appeals',  appealRoutes);

// ── SPA fallback ───────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Auto-promote IS_DOSK to admin on first boot ────────────
app.listen(PORT, async () => {
  console.log(`\n🃏 PokéVault running at http://localhost:${PORT}\n`);
  try {
    const u = await db.users.findOne({ username: 'IS_DOSK' });
    if (u && !u.isAdmin) {
      await db.users.update({ username: 'IS_DOSK' }, { $set: { isAdmin: true } });
      console.log('✅ IS_DOSK promoted to admin');
    }
  } catch(e) {}
});
