// ============================================================
//  PokéVault — Auction Detail + Create Auction Page
// ============================================================

let _auctionDetailTimer = null;

async function renderAuctionDetail({ id }) {
  if (id === 'create') return renderCreateAuction();
  return `
    <div class="section" style="padding-top:2rem">
      <div class="container" style="max-width:900px">
        <div id="auctionDetailContent"><div class="flex-center" style="height:300px"><div class="spinner spinner-lg"></div></div></div>
      </div>
    </div>`;
}

async function initAuctionDetail({ id }) {
  if (id === 'create') { initCreateAuction(); return; }

  if (_auctionDetailTimer) clearInterval(_auctionDetailTimer);

  try {
    const data    = await API.auctions.get(id);
    const { auction } = data;
    const card    = auction.card;
    const isSeller = Auth.user?._id === auction.sellerId;
    const canBid   = Auth.isLoggedIn() && !isSeller && auction.status === 'active';

    const el = document.getElementById('auctionDetailContent');
    if (!el) return;

    el.innerHTML = `
      <a href="/auctions" style="color:var(--text3);font-size:.85rem;display:inline-flex;gap:.3rem;margin-bottom:1.5rem">← Back to Auctions</a>
      <div class="card-detail-grid">
        <div>
          <div class="card-detail-img">
            <img src="${card?.imageUrl || '/img/card-placeholder.svg'}" alt="${card?.title || 'Card'}"
                 onerror="this.src='/img/card-placeholder.svg'"/>
          </div>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <span class="meta-chip" style="background:rgba(237,137,54,.2);border-color:var(--orange);color:var(--orange)">
              🔨 Auction
            </span>
            <span class="meta-chip ${auction.status === 'active' ? 'highlight' : ''}">
              ${auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
            </span>
          </div>
          <h1 style="margin-bottom:.5rem">${card?.title || 'Card Auction'}</h1>
          <p style="color:var(--text3)">Seller: <a href="/profile/${auction.sellerId}" style="color:var(--blue)">${auction.sellerUsername}</a></p>

          ${auction.description ? `<p style="color:var(--text2);margin:1rem 0">${auction.description}</p>` : ''}

          <!-- Bid info -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem;margin:1.2rem 0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div>
                <div style="font-size:.75rem;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">Current Bid</div>
                <div style="font-family:'Orbitron',sans-serif;font-size:1.6rem;font-weight:700;color:var(--yellow)">${formatPrice(auction.currentBid)}</div>
              </div>
              <div>
                <div style="font-size:.75rem;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">Starting Bid</div>
                <div style="font-size:1rem;color:var(--text2)">${formatPrice(auction.startingBid)}</div>
              </div>
              <div>
                <div style="font-size:.75rem;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">Total Bids</div>
                <div style="font-size:1rem;color:var(--text)">${auction.bids?.length || 0}</div>
              </div>
              <div>
                <div style="font-size:.75rem;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">Time Left</div>
                <div id="auctionCountdown" class="font-orbitron" style="font-size:1rem;font-weight:700;color:var(--orange)">
                  ${auction.status === 'active' ? formatCountdown(auction.endTime).text : auction.status}
                </div>
              </div>
            </div>
          </div>

          <!-- Bid form -->
          ${canBid ? `
            <div style="display:flex;gap:.8rem;margin-bottom:1rem">
              <input type="number" id="bidAmount" class="form-input" 
                     placeholder="Min: ${auction.currentBid + 1}"
                     min="${auction.currentBid + 1}" step="1" style="flex:1"/>
              <button class="btn btn-primary" onclick="placeBid('${auction._id}')">Place Bid</button>
            </div>
          ` : ''}
          ${!Auth.isLoggedIn() ? `<a href="/login" class="btn btn-primary mb-2">Log in to bid</a>` : ''}

          <!-- Auction ended — message buttons -->
          ${auction.status === 'ended' && Auth.isLoggedIn() && !isSeller ? `
            <div style="background:rgba(72,187,120,.1);border:1px solid rgba(72,187,120,.3);border-radius:var(--radius);padding:1rem;margin-bottom:1rem">
              <p style="color:var(--green);font-weight:700;margin-bottom:.4rem">
                ${auction.highestBidder === Auth.user?._id ? '🏆 You won this auction!' : '⏰ Auction ended'}
              </p>
              <p style="font-size:.85rem;color:var(--text2);margin-bottom:.7rem">Contact the seller to arrange card exchange.</p>
              <button class="btn btn-primary" onclick="openChatWith('${auction.sellerId}','auction','${auction._id}','Auction: ${(card?.title||'Card').replace(/'/g,'')}')">
                💬 Message Seller
              </button>
            </div>
          ` : ''}
          ${isSeller && auction.status === 'ended' && auction.highestBidder ? `
            <div style="background:rgba(249,211,56,.08);border:1px solid rgba(249,211,56,.2);border-radius:var(--radius);padding:1rem;margin-bottom:1rem">
              <p style="color:var(--yellow);font-weight:700;margin-bottom:.4rem">🏆 Auction ended!</p>
              <button class="btn btn-secondary btn-sm" onclick="openChatWith('${auction.highestBidder}','auction','${auction._id}','Auction: ${(card?.title||'Card').replace(/'/g,'')}')">
                💬 Message Winner
              </button>
            </div>
          ` : ''}

          ${isSeller && auction.status === 'active' ? `
            <button class="btn btn-danger btn-sm" onclick="cancelAuction('${auction._id}')">Cancel Auction</button>
          ` : ''}

          <!-- Bid history -->
          <div class="info-section">
            <h3>Bid History (${auction.bids?.length || 0})</h3>
            ${auction.bids?.length
              ? `<div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:.5rem">
                  ${auction.bids.map(b => `
                    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);border-radius:var(--radius-sm);padding:.5rem .9rem">
                      <span style="font-size:.85rem">${b.bidderUsername || 'Anonymous'}</span>
                      <div style="display:flex;gap:1rem;align-items:center">
                        <span style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:var(--yellow)">${formatPrice(b.amount)}</span>
                        <span style="font-size:.72rem;color:var(--text3)">${timeAgo(b.createdAt)}</span>
                      </div>
                    </div>`).join('')}
                </div>`
              : `<p style="color:var(--text3);font-size:.9rem">No bids yet. Be the first!</p>`}
          </div>
        </div>
      </div>
    `;

    // Countdown timer
    if (auction.status === 'active') {
      _auctionDetailTimer = setInterval(() => {
        const el = document.getElementById('auctionCountdown');
        if (!el) { clearInterval(_auctionDetailTimer); return; }
        const { text, urgent } = formatCountdown(auction.endTime);
        el.textContent = text;
        el.className = `font-orbitron ${urgent ? 'countdown-urgent' : ''}`;
        el.style.fontSize = '1rem';
        el.style.fontWeight = '700';
        if (text === 'Ended') clearInterval(_auctionDetailTimer);
      }, 1000);
    }

  } catch (err) {
    const el = document.getElementById('auctionDetailContent');
    if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔨</div><h3>Auction Not Found</h3><a href="/auctions" class="btn btn-primary">Back to Auctions</a></div>`;
  }
}

async function placeBid(auctionId) {
  const amount = parseFloat(document.getElementById('bidAmount')?.value);
  if (!amount) { showToast('Enter a bid amount', 'warning'); return; }
  try {
    await API.auctions.bid(auctionId, amount);
    showToast(`Bid of ${formatPrice(amount)} placed!`, 'success');
    initAuctionDetail({ id: auctionId });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cancelAuction(id) {
  if (!confirm('Cancel this auction? This cannot be undone.')) return;
  try {
    await API.auctions.cancel(id);
    showToast('Auction cancelled', 'success');
    Router.go('/auctions');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Create Auction ───────────────────────────────────────

function renderCreateAuction() {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }
  return `
    <div class="page-header"><div class="container"><h1>🔨 Create Auction</h1></div></div>
    <div class="section" style="padding-top:2rem"><div class="container" style="max-width:560px">
      <div id="auctionCreateError"></div>
      <form id="createAuctionForm" onsubmit="handleCreateAuction(event)">
        <div class="form-group">
          <label class="form-label">Select Card *</label>
          <select name="cardId" id="auctionCardSelect" class="form-select" required>
            <option value="">Loading your cards...</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Starting Bid *</label>
            <input type="number" name="startingBid" class="form-input" placeholder="0.00" min="0.01" step="0.01" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Reserve Price (optional)</label>
            <input type="number" name="reservePrice" class="form-input" placeholder="0.00" min="0" step="0.01"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Duration *</label>
          <select name="durationHours" class="form-select" required>
            <option value="0.0167">1 Minute</option>
            <option value="0.0833">5 Minutes</option>
            <option value="0.1667">10 Minutes</option>
            <option value="0.25">15 Minutes</option>
            <option value="0.5">30 Minutes</option>
            <option value="1">1 Hour</option>
            <option value="6">6 Hours</option>
            <option value="12">12 Hours</option>
            <option value="24" selected>1 Day</option>
            <option value="48">2 Days</option>
            <option value="72">3 Days</option>
            <option value="168">7 Days</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="form-textarea" placeholder="Additional details about this auction..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="createAuctionBtn">🔨 Start Auction</button>
      </form>
    </div></div>`;
}

async function initCreateAuction() {
  if (!Auth.isLoggedIn()) return;
  try {
    const data = await API.cards.mine();
    const sel  = document.getElementById('auctionCardSelect');
    if (!sel) return;
    if (!data.cards.length) {
      sel.innerHTML = '<option value="">No cards in your collection yet</option>';
      return;
    }
    sel.innerHTML = '<option value="">Select a card</option>' +
      data.cards.map(c => `<option value="${c._id}">${c.title} (${c.condition})</option>`).join('');
  } catch {}
}

async function handleCreateAuction(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = document.getElementById('createAuctionBtn');
  const errEl = document.getElementById('auctionCreateError');
  if (errEl) errEl.innerHTML = '';

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating...';

  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());

  try {
    const data = await API.auctions.create(body);
    showToast('Auction created!', 'success');
    Router.go(`/auction/${data.auction._id}`);
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="error-banner">${err.message}</div>`;
    btn.disabled = false;
    btn.innerHTML = '🔨 Start Auction';
  }
}

window.placeBid            = placeBid;
window.cancelAuction       = cancelAuction;
window.handleCreateAuction = handleCreateAuction;
