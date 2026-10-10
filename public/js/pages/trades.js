// ============================================================
//  PokéVault — Trades Page
// ============================================================

async function renderTrades() {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1><p>You need to log in to see your trades.</p></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }
  return `
    <div class="page-header">
      <div class="container">
        <h1>🔄 Trades</h1>
        <p>Your trade requests and history</p>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container" style="max-width:700px">
        <div class="tabs">
          <button class="tab-btn active" onclick="loadTradesByFilter('all',this)">All</button>
          <button class="tab-btn" onclick="loadTradesByFilter('pending',this)">Pending</button>
          <button class="tab-btn" onclick="loadTradesByFilter('accepted',this)">Accepted</button>
          <button class="tab-btn" onclick="loadTradesByFilter('declined',this)">Declined</button>
        </div>
        <div id="tradesList"><div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div></div>
      </div>
    </div>
  `;
}

async function initTrades() {
  await loadTradesByFilter('all');
}

async function loadTradesByFilter(filter, tabBtn) {
  if (tabBtn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
  }

  const list = document.getElementById('tradesList');
  if (!list) return;
  list.innerHTML = `<div class="flex-center" style="height:150px"><div class="spinner"></div></div>`;

  try {
    const data   = await API.trades.list();
    let trades = data.trades;
    if (filter !== 'all') trades = trades.filter(t => t.status === filter);

    if (!trades.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔄</div>
          <h3>No trades ${filter !== 'all' ? `(${filter})` : ''} found</h3>
          <p>Browse the marketplace and request trades on cards you like.</p>
          <a href="/marketplace" class="btn btn-primary">Browse Marketplace</a>
        </div>`;
      return;
    }

    list.innerHTML = trades.map(t => {
      const isReceiver = t.receiverId === Auth.user._id;
      const other = isReceiver ? t.senderUsername : t.receiverUsername;
      const dir   = isReceiver ? `from ${other}` : `to ${other}`;

      return `
        <div class="trade-item status-${t.status}" onclick="openTradeDetail('${t._id}')">
          <div class="trade-status-dot"></div>
          <div class="trade-info">
            <h4>Trade ${dir}</h4>
            <p>${timeAgo(t.createdAt)} · ${t.offeredCardIds?.length || 0} offered · ${t.requestedCardIds?.length || 0} requested</p>
          </div>
          <span class="trade-status-badge">${t.status}</span>
        </div>`;
    }).join('');

  } catch (err) {
    list.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function openTradeDetail(tradeId) {
  openModal(`<div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div>`);
  try {
    const data = await API.trades.get(tradeId);
    const t    = data.trade;
    const isReceiver = t.receiverId === Auth.user._id;

    const offeredHtml   = (t.offeredCards   || []).map(c => c ? `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem 0">
      <img src="${c.imageUrl}" style="width:40px;height:53px;object-fit:cover;border-radius:4px" onerror="this.src='/img/card-placeholder.svg'"/>
      <span style="font-size:.88rem">${c.title}</span></div>` : '').join('');
    const requestedHtml = (t.requestedCards || []).map(c => c ? `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem 0">
      <img src="${c.imageUrl}" style="width:40px;height:53px;object-fit:cover;border-radius:4px" onerror="this.src='/img/card-placeholder.svg'"/>
      <span style="font-size:.88rem">${c.title}</span></div>` : '').join('');

    const actionBtns = t.status === 'pending' && isReceiver ? `
      <div style="display:flex;gap:.8rem;margin-top:1rem">
        <button class="btn btn-green btn-full" onclick="respondTrade('${t._id}','accept')">✅ Accept Trade</button>
        <button class="btn btn-danger btn-full" onclick="respondTrade('${t._id}','decline')">❌ Decline</button>
      </div>` :
      t.status === 'pending' && !isReceiver ? `
      <button class="btn btn-secondary btn-full mt-2" onclick="cancelTrade('${t._id}')">Cancel Trade</button>` : '';

    openModal(`
      <button class="modal-close" onclick="forceCloseModal()">✕</button>
      <h2 class="mb-1">🔄 Trade Details</h2>
      <p style="color:var(--text3);font-size:.85rem;margin-bottom:1rem">${timeAgo(t.createdAt)}</p>

      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:start">
        <div>
          <p style="font-size:.75rem;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:.3rem">${t.senderUsername} Offers</p>
          ${offeredHtml || '<p style="color:var(--text3)">—</p>'}
        </div>
        <div style="font-size:1.5rem;align-self:center;color:var(--text3)">⇄</div>
        <div>
          <p style="font-size:.75rem;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:.3rem">${t.receiverUsername} Has</p>
          ${requestedHtml || '<p style="color:var(--text3)">—</p>'}
        </div>
      </div>

      ${t.message ? `<div style="background:var(--bg3);border-radius:var(--radius-sm);padding:.8rem;margin-top:1rem">
        <p style="font-size:.75rem;font-weight:800;color:var(--text3);margin-bottom:.2rem">MESSAGE</p>
        <p style="font-size:.9rem">${t.message}</p>
      </div>` : ''}

      ${actionBtns}
    `);
  } catch (err) {
    openModal(`<button class="modal-close" onclick="forceCloseModal()">✕</button><div class="error-banner">${err.message}</div>`);
  }
}

async function respondTrade(tradeId, action) {
  try {
    await API.trades.respond(tradeId, action);
    forceCloseModal();
    showToast(`Trade ${action}ed!`, action === 'accept' ? 'success' : 'info');
    initTrades();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cancelTrade(tradeId) {
  try {
    await API.trades.cancel(tradeId);
    forceCloseModal();
    showToast('Trade cancelled', 'info');
    initTrades();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.loadTradesByFilter = loadTradesByFilter;
window.openTradeDetail    = openTradeDetail;
window.respondTrade       = respondTrade;
window.cancelTrade        = cancelTrade;
