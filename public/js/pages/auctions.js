// ============================================================
//  PokéVault — Auctions List Page
// ============================================================

let _auctionTimers = [];

async function renderAuctions() {
  return `
    <div class="page-header">
      <div class="container">
        <h1>🔨 Auctions</h1>
        <p>Live auctions — bid on rare cards</p>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container">
        <div style="display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
          <div class="tabs" style="margin:0;border:none;gap:.4rem">
            <button class="tab-btn active" onclick="loadAuctionsByStatus('active',this)">🟢 Active</button>
            <button class="tab-btn" onclick="loadAuctionsByStatus('ended',this)">🔴 Ended</button>
            <button class="tab-btn" onclick="loadAuctionsByStatus('all',this)">📋 All</button>
          </div>
          ${Auth.isLoggedIn() ? `<a href="/auction/create" class="btn btn-primary btn-sm" style="margin-left:auto">+ Create Auction</a>` : ''}
        </div>
        <div id="auctionGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem">
          ${skeletonCards(8)}
        </div>
      </div>
    </div>
  `;
}

async function initAuctions() {
  _auctionTimers.forEach(clearInterval);
  _auctionTimers = [];
  await loadAuctionsByStatus('active');
}

async function loadAuctionsByStatus(status, tabBtn) {
  // Update tab active state
  if (tabBtn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
  }

  const grid = document.getElementById('auctionGrid');
  if (!grid) return;
  grid.innerHTML = skeletonCards(8);

  _auctionTimers.forEach(clearInterval);
  _auctionTimers = [];

  try {
    const data = await API.auctions.list({ status, limit: 20 });
    if (!data.auctions.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔨</div>
          <h3>No ${status === 'active' ? 'active' : ''} auctions</h3>
          <p>${status === 'active' ? 'No auctions are running right now.' : 'No auctions found.'}</p>
          ${Auth.isLoggedIn() ? '<a href="/auction/create" class="btn btn-primary">Create Auction</a>' : ''}
        </div>`;
      return;
    }

    grid.innerHTML = data.auctions.map(a => renderAuctionCard(a)).join('');

    // Start timers
    data.auctions.forEach(a => {
      if (a.status !== 'active') return;
      const timer = setInterval(() => {
        const el = document.getElementById(`timer-${a._id}`);
        if (!el) { clearInterval(timer); return; }
        const { text, urgent } = formatCountdown(a.endTime);
        el.textContent = text;
        el.className = `auction-timer ${urgent ? 'countdown-urgent' : ''}`;
        if (text === 'Ended') clearInterval(timer);
      }, 1000);
      _auctionTimers.push(timer);
    });

  } catch (err) {
    grid.innerHTML = `<div class="error-banner" style="grid-column:1/-1">${err.message}</div>`;
  }
}

function renderAuctionCard(a) {
  const { text, urgent } = a.status === 'active' ? formatCountdown(a.endTime) : { text: a.status, urgent: false };
  const img = a.card?.imageUrl || '/img/card-placeholder.svg';

  return `
    <div class="auction-card" onclick="Router.go('/auction/${a._id}')">
      <div class="auction-card-img">
        <img src="${img}" alt="${a.card?.title || 'Auction'}" onerror="this.src='/img/card-placeholder.svg'" loading="lazy"/>
        <div class="auction-timer ${urgent ? 'countdown-urgent' : ''}" id="timer-${a._id}">
          ${a.status === 'active' ? '⏰ ' + text : text.charAt(0).toUpperCase() + text.slice(1)}
        </div>
      </div>
      <div class="auction-card-body">
        <div class="auction-title">${a.card?.title || 'Card Auction'}</div>
        <div class="auction-bids">👤 ${a.sellerUsername || 'Unknown'} · ${a.bidCount || 0} bid${(a.bidCount || 0) !== 1 ? 's' : ''}</div>
        <div class="auction-current-bid">
          <span>Current Bid</span>
          <strong>${formatPrice(a.currentBid)}</strong>
        </div>
      </div>
    </div>`;
}

window.loadAuctionsByStatus = loadAuctionsByStatus;
