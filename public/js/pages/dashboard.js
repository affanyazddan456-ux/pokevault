// ============================================================
//  PokéVault — Dashboard Page
// ============================================================

async function renderDashboard() {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }

  const u = Auth.user;
  return `
    <div class="page-header"><div class="container"><h1>📊 Dashboard</h1><p>Welcome back, ${u.username}!</p></div></div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container">
        <div class="dashboard-grid">
          <!-- Sidebar -->
          <div class="dashboard-sidebar">
            <div class="profile-summary">
              <img class="profile-avatar-lg" id="dashAvatar"
                   src="${u.avatar || '/img/default-avatar.svg'}"
                   alt="${u.username}" onerror="this.src='/img/default-avatar.svg'"/>
              <h2>${u.username}</h2>
              <p style="color:var(--text3);font-size:.85rem">${u.email}</p>
              <div class="points-badge">⭐ ${u.points || 0} pts</div>
            </div>
            <nav class="dashboard-nav">
              <div class="dash-nav-item active" onclick="showDashTab('overview',this)"><span>📊</span>Overview</div>
              <div class="dash-nav-item" onclick="showDashTab('collection',this)"><span>🃏</span>My Cards</div>
              <div class="dash-nav-item" onclick="showDashTab('listings',this)"><span>🏪</span>Listings</div>
              <div class="dash-nav-item" onclick="showDashTab('trades',this)"><span>🔄</span>Trades</div>
              <div class="dash-nav-item" onclick="showDashTab('auctions',this)"><span>🔨</span>Auctions</div>
              <div class="dash-nav-item" onclick="showDashTab('profile-edit',this)"><span>✏️</span>Edit Profile</div>
            </nav>
          </div>

          <!-- Main content -->
          <div id="dashMain">
            <div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initDashboard() {
  if (!Auth.isLoggedIn()) return;
  await showDashTab('overview');
}

async function showDashTab(tab, btn) {
  if (btn) {
    document.querySelectorAll('.dash-nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
  }

  const main = document.getElementById('dashMain');
  if (!main) return;
  main.innerHTML = `<div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div>`;

  if (tab === 'overview')      await renderDashOverview(main);
  if (tab === 'collection')    await renderDashCollection(main);
  if (tab === 'listings')      await renderDashListings(main);
  if (tab === 'trades')        await renderDashTrades(main);
  if (tab === 'auctions')      await renderDashAuctions(main);
  if (tab === 'profile-edit')  renderDashProfileEdit(main);
}

async function renderDashOverview(el) {
  const u = Auth.user;
  try {
    const [cardsData, tradesData, auctionsData] = await Promise.all([
      API.cards.mine(),
      API.trades.list(),
      API.auctions.list({ status: 'all' }),
    ]);

    const myCards    = cardsData.cards;
    const myTrades   = tradesData.trades;
    const myAuctions = auctionsData.auctions.filter(a => a.sellerId === u._id);
    const pending    = myTrades.filter(t => t.status === 'pending' && t.receiverId === u._id);

    el.innerHTML = `
      <div class="stats-cards">
        ${[
          ['🃏', myCards.length, 'Cards'],
          ['🔄', myTrades.filter(t=>t.status==='accepted').length, 'Trades Done'],
          ['🔨', myAuctions.length, 'Auctions'],
          ['⭐', u.points || 0, 'Points'],
          ['♥', '—', 'Favorites'],
        ].map(([icon, val, name]) => `
          <div class="stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-val">${val}</div>
            <div class="stat-name">${name}</div>
          </div>`).join('')}
      </div>

      ${pending.length > 0 ? `
        <div style="background:rgba(249,211,56,.1);border:1px solid rgba(249,211,56,.3);border-radius:var(--radius);padding:1rem;margin-bottom:1.5rem">
          <h3 style="color:var(--yellow);margin-bottom:.5rem">⚡ ${pending.length} Pending Trade Request${pending.length>1?'s':''}</h3>
          <p style="font-size:.88rem;color:var(--text2)">You have trade requests waiting for your response!</p>
          <a href="/trades" class="btn btn-primary btn-sm mt-1">View Trades</a>
        </div>` : ''}

      <h3 style="margin-bottom:1rem">Recent Cards</h3>
      <div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${myCards.slice(0,6).map(c => renderCardItem(c)).join('') ||
          `<div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon">🃏</div>
            <h3>No cards yet</h3>
            <a href="/upload" class="btn btn-primary">Upload Your First Card</a>
          </div>`}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function renderDashCollection(el) {
  try {
    const data = await API.cards.mine();
    if (!data.cards.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🃏</div><h3>No cards in your collection yet...</h3><a href="/upload" class="btn btn-primary">Upload First Card</a></div>`;
      return;
    }
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h2>${data.cards.length} Card${data.cards.length!==1?'s':''}</h2>
        <a href="/upload" class="btn btn-primary btn-sm">+ Add Card</a>
      </div>
      <div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${data.cards.map(c => renderCardItem(c)).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function renderDashListings(el) {
  try {
    const data   = await API.cards.mine();
    const listed = data.cards.filter(c => c.saleAvailable || c.tradeAvailable || c.auctionAvailable);
    if (!listed.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏪</div><h3>No active listings</h3><p>Mark a card as For Sale, For Trade, or Auction to list it.</p></div>`;
      return;
    }
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">${listed.length} Active Listing${listed.length!==1?'s':''}</h2>
      <div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${listed.map(c => renderCardItem(c)).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function renderDashTrades(el) {
  try {
    const data = await API.trades.list();
    if (!data.trades.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔄</div><h3>No trades yet</h3><a href="/marketplace" class="btn btn-primary">Browse Cards to Trade</a></div>`;
      return;
    }
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">Trade History</h2>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        ${data.trades.map(t => {
          const isReceiver = t.receiverId === Auth.user._id;
          const other = isReceiver ? t.senderUsername : t.receiverUsername;
          return `
            <div class="trade-item status-${t.status}" onclick="openTradeDetail('${t._id}')">
              <div class="trade-status-dot"></div>
              <div class="trade-info">
                <h4>Trade ${isReceiver ? 'from' : 'to'} ${other}</h4>
                <p>${timeAgo(t.createdAt)}</p>
              </div>
              <span class="trade-status-badge">${t.status}</span>
            </div>`;
        }).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function renderDashAuctions(el) {
  try {
    const data = await API.auctions.list({ status: 'all', limit: 20 });
    const mine = data.auctions.filter(a => a.sellerId === Auth.user._id);
    if (!mine.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔨</div><h3>No auctions yet</h3><a href="/auction/create" class="btn btn-primary">Create Auction</a></div>`;
      return;
    }
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <h2>My Auctions</h2>
        <a href="/auction/create" class="btn btn-primary btn-sm">+ New Auction</a>
      </div>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        ${mine.map(a => `
          <div class="auction-card" onclick="Router.go('/auction/${a._id}')" style="display:grid;grid-template-columns:80px 1fr;gap:1rem;align-items:center;padding:.8rem">
            <img src="${a.card?.imageUrl || '/img/card-placeholder.svg'}" style="width:80px;height:106px;object-fit:cover;border-radius:8px" onerror="this.src='/img/card-placeholder.svg'"/>
            <div>
              <h4>${a.card?.title || 'Card'}</h4>
              <p style="color:var(--text3);font-size:.82rem">${a.status} · ${a.bidCount||0} bids</p>
              <p style="font-family:'Orbitron',sans-serif;color:var(--yellow);font-size:.88rem">${formatPrice(a.currentBid)}</p>
            </div>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

function renderDashProfileEdit(el) {
  const u = Auth.user;
  el.innerHTML = `
    <h2 style="margin-bottom:1.5rem">✏️ Edit Profile</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start">
      <!-- Avatar upload -->
      <div>
        <h3 style="margin-bottom:1rem;font-size:1rem">Profile Avatar</h3>
        <div style="text-align:center">
          <img id="editAvatarPreview" src="${u.avatar || '/img/default-avatar.svg'}" 
               style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--yellow);margin:0 auto 1rem"
               onerror="this.src='/img/default-avatar.svg'"/>
          <input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="previewAvatarEdit(event)"/>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('avatarFileInput').click()">Change Photo</button>
          <button class="btn btn-primary btn-sm mt-1" onclick="uploadAvatar()" id="saveAvatarBtn">Save Avatar</button>
        </div>
      </div>
      <!-- Bio -->
      <div>
        <h3 style="margin-bottom:1rem;font-size:1rem">Bio</h3>
        <textarea id="editBio" class="form-textarea" style="min-height:100px" placeholder="Tell the community about yourself...">${u.bio || ''}</textarea>
        <button class="btn btn-primary btn-sm mt-1" onclick="saveBio()">Save Bio</button>
      </div>
    </div>
  `;
}

function previewAvatarEdit(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { document.getElementById('editAvatarPreview').src = reader.result; };
  reader.readAsDataURL(file);
}

async function uploadAvatar() {
  const file = document.getElementById('avatarFileInput')?.files[0];
  if (!file) { showToast('Select a photo first', 'warning'); return; }
  const btn = document.getElementById('saveAvatarBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const fd = new FormData();
    fd.append('avatar', file);
    const data = await API.users.uploadAvatar(fd);
    Auth.user.avatar = data.avatar;
    document.getElementById('navAvatar').src = data.avatar;
    showToast('Avatar updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
  btn.disabled = false;
  btn.innerHTML = 'Save Avatar';
}

async function saveBio() {
  const bio = document.getElementById('editBio')?.value;
  try {
    await API.users.updateProfile({ bio });
    Auth.user.bio = bio;
    showToast('Bio saved!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.showDashTab       = showDashTab;
window.openTradeDetail   = openTradeDetail;
window.previewAvatarEdit = previewAvatarEdit;
window.uploadAvatar      = uploadAvatar;
window.saveBio           = saveBio;
