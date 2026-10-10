# 🃏 PokéVault

**Collect. Trade. Auction. Sell.**

A Pokémon Card Sharing Patform for Pokémon card collectors — upload your collection, trade with friends, run auctions, list cards for sale, and compete on the leaderboard.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
node server.js
```

### 3. Open in browser
```
http://localhost:3000
```

---

## 🔑 Admin Account

An admin account is created automatically at setup. To create or promote an admin:

```bash
# Create new admin
node create-admin.js <username> <email> <password>

# Example
node create-admin.js admin admin@pokevault.local MyPassword123

# Or promote an existing user
node create-admin.js existingUsername
```

Default admin created during first run:
- **Email:** `admin@pokevault.local`
- **Password:** `PokéAdmin2024`
- ⚠️ Change this password after first login

---

## 🗂️ Project Structure

```
pokevault/
├── server.js          — Express app entry point
├── db.js              — NeDB database initialization
├── create-admin.js    — Admin account setup utility
├── package.json
│
├── middleware/
│   └── auth.js        — requireAuth / requireAdmin middleware
│
├── routes/
│   ├── auth.js        — Signup, login, logout, session
│   ├── cards.js       — Card CRUD, upload, favorites
│   ├── users.js       — Profiles, leaderboard, notifications
│   ├── trades.js      — Trade requests, accept/decline
│   ├── auctions.js    — Auction create, bid, end
│   ├── stats.js       — Community statistics
│   ├── admin.js       — Admin management
│   └── reports.js     — User reports
│
├── data/              — NeDB database files (auto-created)
├── uploads/           — User-uploaded images (auto-created)
│   ├── cards/
│   └── avatars/
│
└── public/            — Frontend SPA
    ├── index.html
    ├── css/
    │   ├── style.css
    │   └── animations.css
    ├── img/           — SVG assets
    └── js/
        ├── api.js     — API client
        ├── auth.js    — Auth state
        ├── router.js  — SPA router
        ├── ui.js      — UI utilities
        ├── app.js     — Route definitions & bootstrap
        └── pages/
            ├── home.js
            ├── marketplace.js
            ├── card-detail.js
            ├── upload.js
            ├── auctions.js
            ├── auction-detail.js
            ├── trades.js
            ├── dashboard.js
            ├── collection.js
            ├── leaderboard.js
            ├── profile.js
            ├── login.js
            ├── signup.js
            └── admin.js
```

---

## ✨ Features

| Feature | Status |
|---|---|
| User signup / login | ✅ |
| Secure password hashing (bcrypt) | ✅ |
| Card upload with image | ✅ |
| Card marketplace with filters | ✅ |
| Trade request system | ✅ |
| Live auction with bidding | ✅ |
| Card favorites | ✅ |
| Community leaderboard (real data) | ✅ |
| User profiles | ✅ |
| Dashboard | ✅ |
| Notification system | ✅ |
| Report system | ✅ |
| Admin panel | ✅ |
| Points system | ✅ |
| Persistent storage (NeDB) | ✅ |
| Mobile responsive | ✅ |
| Holographic card effects | ✅ |
| Animated Pokéball loader | ✅ |
| Real-time auction countdown | ✅ |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds) — never stored in plaintext
- Session-based authentication with `express-session`
- Protected API routes with auth middleware
- Admin-only endpoints with admin middleware
- Rate limiting (500 req / 15 min)
- Server-side validation on all inputs
- File type and size validation for uploads
- No secrets exposed to the frontend

---

## ⭐ Points System

| Action | Points |
|---|---|
| Upload a card | +5 |
| Complete a trade | +15 (both users) |
| Place a bid | +2 |
| Get a card favorited | +1 |

---

## 🗄️ Database

Uses **NeDB** — a pure-JavaScript embedded database that requires no native dependencies or external server. Database files are stored in `data/` as plain `.db` files.

---

## 🌐 Deployment

To deploy publicly, update:
1. Session secret in `server.js` → use `process.env.SESSION_SECRET`
2. Set `cookie.secure = true` (requires HTTPS)
3. Move `data/` and `uploads/` to persistent storage
4. Consider using a process manager like PM2
