// ============================================================
//  PokéVault — Card Detail Page
// ============================================================

let _currentCard = null;

async function renderCardDetail({ id }) {
  return `
    <div class="section" style="padding-top:2rem">
      <div class="container">
        <div id="cardDetailContent"><div class="flex-center" style="height:300px"><div class="spinner spinner-lg"></div></div></div>
      </div>
    </div>`;
}

async function initCardDetail({ id }) {
  try {
    const data = await API.cards.get(id);
    _currentCard = data.card;
    const { card, isFavorite } = data;
    const isOwner = Auth.user?._id === card.ownerId;

    const actionBtns = [];
    if (!isOwner && Auth.isLoggedIn()) {
      if (card.tradeAvailable)   actionBtns.push(`<button class="btn btn-blue" onclick="openTradeModal('${card._id}','${card.ownerId}','${card.title.replace(/'/g,"\\'")}')">🔄 Request Trade</button>`);
      if (card.saleAvailable)    actionBtns.push(`<button class="btn btn-green" onclick="openBuyModal('${card._id}','${card.title.replace(/'/g,"\\'")}',${card.price},'${card.ownerId}')">💰 Buy Now — ${formatPrice(card.price)}</button>`);
      if (card.auctionAvailable) actionBtns.push(`<a href="/auction/${card._id}" class="btn btn-secondary">🔨 View Auction</a>`);
      actionBtns.push(`<button class="btn btn-ghost" onclick="openChatWith('${card.ownerId}','sale','${card._id}','${card.title.replace(/'/g,"\\'")}')">💬 Message Owner</button>`);
    }
    if (isOwner) {
      actionBtns.push(`<a href="/upload?edit=${card._id}" class="btn btn-secondary">✏️ Edit Card</a>`);
      actionBtns.push(`<button class="btn btn-danger" onclick="confirmDeleteCard('${card._id}')">🗑️ Remove</button>`);
    }
    if (Auth.isLoggedIn()) {
      actionBtns.push(`<button class="btn btn-ghost" onclick="openReportModal('card','${card._id}')">🚩 Report</button>`);
    }

    const el = document.getElementById('cardDetailContent');
    if (!el) return;
    el.innerHTML = `
      <a href="/marketplace" style="color:var(--text3);font-size:.85rem;display:inline-flex;align-items:center;gap:.3rem;margin-bottom:1.5rem">
        ← Back to Marketplace
      </a>
      <div class="card-detail-grid">
        <div>
          <div class="card-detail-img holo-card">
            <img src="${card.imageUrl}" alt="${card.title}" onerror="this.src='/img/card-placeholder.svg'"/>
            <div class="holo-overlay"></div>
          </div>
          <div style="display:flex;justify-content:center;margin-top:1rem">
            <button class="btn btn-ghost" id="favBtn" onclick="toggleCardFav('${card._id}',this)">
              ${isFavorite ? '♥ Unfavorite' : '♡ Add to Favorites'}
            </button>
          </div>
        </div>

        <div class="card-detail-info">
          <h1>${card.title}</h1>
          ${card.set ? `<p style="color:var(--text3);font-size:.9rem">Set: ${card.set}${card.cardNumber ? ' · #' + card.cardNumber : ''}</p>` : ''}

          <div class="card-meta">
            <span class="meta-chip" style="border-color:${conditionColor(card.condition)};color:${conditionColor(card.condition)}">
              ${card.condition}
            </span>
            ${card.hp        ? `<span class="meta-chip" style="border-color:var(--red-lt);color:var(--red-lt)">❤️ ${card.hp} HP</span>` : ''}
            ${card.rarity    ? `<span class="meta-chip" style="border-color:var(--purple);color:var(--purple)">✨ ${card.rarity}</span>` : ''}
            ${card.energyType? `<span class="meta-chip" style="border-color:var(--blue);color:var(--blue)">${card.energyType}</span>` : ''}
            ${card.saleAvailable ? `<span class="meta-chip highlight">💰 For Sale — ${formatPrice(card.price)}</span>` : ''}
            ${card.tradeAvailable ? `<span class="meta-chip" style="border-color:var(--blue);color:var(--blue)">🔄 For Trade</span>` : ''}
            ${card.auctionAvailable ? `<span class="meta-chip" style="border-color:var(--orange);color:var(--orange)">🔨 Auction</span>` : ''}
          </div>

          ${card.description ? `<p style="color:var(--text2);margin:.5rem 0">${card.description}</p>` : ''}

          <div class="card-actions-row">
            ${actionBtns.join('')}
            ${!Auth.isLoggedIn() ? '<a href="/login" class="btn btn-primary">Log in to interact</a>' : ''}
          </div>

          <div class="info-section">
            <h3>Card Details</h3>
            <div class="info-grid">
              ${card.hp         ? `<div class="info-row"><label>HP</label><span style="color:var(--red-lt);font-weight:800">❤️ ${card.hp}</span></div>` : ''}
              ${card.rarity     ? `<div class="info-row"><label>Rarity</label><span>✨ ${card.rarity}</span></div>` : ''}
              ${card.energyType ? `<div class="info-row"><label>Type</label><span>${card.energyType}</span></div>` : ''}
              ${card.set        ? `<div class="info-row"><label>Set</label><span>${card.set}</span></div>` : ''}
              ${card.cardNumber ? `<div class="info-row"><label>Card #</label><span>${card.cardNumber}</span></div>` : ''}
              ${card.obtainedFrom ? `<div class="info-row"><label>Obtained From</label><span>${card.obtainedFrom}</span></div>` : ''}
              ${card.dateAcquired ? `<div class="info-row"><label>Date Acquired</label><span>${formatDate(card.dateAcquired)}</span></div>` : ''}
              ${card.tradePreferences ? `<div class="info-row" style="grid-column:1/-1"><label>Trade Preferences</label><span>${card.tradePreferences}</span></div>` : ''}
              ${card.notes ? `<div class="info-row" style="grid-column:1/-1"><label>Notes</label><span>${card.notes}</span></div>` : ''}
              <div class="info-row"><label>Uploaded</label><span>${timeAgo(card.createdAt)}</span></div>
              <div class="info-row"><label>Favorites</label><span>♥ ${card.favoriteCount || 0}</span></div>
            </div>
          </div>

          ${card.ownerUsername ? `
            <div class="info-section">
              <h3>Owner</h3>
              <div class="owner-card" onclick="Router.go('/profile/${card.ownerId}')">
                <img class="owner-avatar" src="${card.ownerAvatar || '/img/default-avatar.svg'}" alt="${card.ownerUsername}" onerror="this.src='/img/default-avatar.svg'"/>
                <div class="owner-info">
                  <h4>${card.ownerUsername}</h4>
                  <span>View Profile →</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // 3D hover tilt
    const imgEl = document.querySelector('.card-detail-img');
    if (imgEl) addTiltEffect(imgEl);

  } catch (err) {
    const el = document.getElementById('cardDetailContent');
    if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">🃏</div><h3>Card Not Found</h3><p>${err.message}</p><a href="/marketplace" class="btn btn-primary">Browse Marketplace</a></div>`;
  }
}

async function toggleCardFav(cardId, btn) {
  if (!Auth.isLoggedIn()) { Router.go('/login'); return; }
  try {
    const data = await API.cards.favorite(cardId);
    btn.textContent = data.favorited ? '♥ Unfavorite' : '♡ Add to Favorites';
    showToast(data.favorited ? 'Added to favorites!' : 'Removed from favorites', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function addTiltEffect(el) {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) scale(1.02)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
    el.style.transition = 'transform .5s ease';
    setTimeout(() => { el.style.transition = ''; }, 500);
  });
}

function openBuyModal(cardId, title, price, ownerId) {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">💰 Purchase Card</h2>
    <p style="color:var(--text2);margin-bottom:1.2rem">You're about to express interest in:</p>
    <div class="info-row mb-1"><label>Card</label><span>${title}</span></div>
    <div class="info-row mb-3"><label>Price</label><span style="color:var(--yellow);font-family:'Orbitron',sans-serif">${formatPrice(price)}</span></div>
    <div style="background:rgba(66,153,225,.08);border:1px solid rgba(66,153,225,.2);border-radius:var(--radius-sm);padding:.9rem;margin-bottom:1.2rem;font-size:.85rem;color:var(--text2)">
      💡 This is a private community. Payment is arranged directly between members via the chat system.
    </div>
    <div style="display:flex;flex-direction:column;gap:.7rem">
      <button class="btn btn-green btn-full" onclick="completePurchase('${cardId}','${ownerId}','${title.replace(/'/g,"\\'")}')">✅ Send Purchase Request</button>
      <button class="btn btn-ghost btn-full" onclick="forceCloseModal();openChatWith('${ownerId}','sale','${cardId}','${title.replace(/'/g,"\\'")}')">💬 Message Seller First</button>
    </div>
  `);
}

async function completePurchase(cardId, ownerId, title) {
  forceCloseModal();
  showToast('Purchase request sent! Opening chat with seller...', 'success', 3000);
  setTimeout(() => openChatWith(ownerId, 'sale', cardId, title), 500);
}

async function confirmDeleteCard(cardId) {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">🗑️ Remove Card</h2>
    <p style="color:var(--text2);margin-bottom:1.5rem">Are you sure you want to remove this card from your collection? This cannot be undone.</p>
    <div style="display:flex;gap:1rem">
      <button class="btn btn-secondary btn-full" onclick="forceCloseModal()">Cancel</button>
      <button class="btn btn-danger btn-full" onclick="deleteCard('${cardId}')">Remove Card</button>
    </div>
  `);
}

async function deleteCard(cardId) {
  try {
    await API.cards.delete(cardId);
    forceCloseModal();
    showToast('Card removed from your collection', 'success');
    Router.go('/collection');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openTradeModal(cardId, ownerId, cardTitle) {
  let myCards = [];
  try {
    const data = await API.cards.mine();
    myCards = data.cards.filter(c => c.tradeAvailable && c._id !== cardId);
  } catch {}

  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">🔄 Request Trade</h2>
    <p style="color:var(--text2);margin-bottom:1rem">You want: <strong>${cardTitle}</strong></p>
    <div class="form-group">
      <label class="form-label">Select your card(s) to offer *</label>
      ${myCards.length === 0
        ? `<div style="background:var(--bg3);border-radius:var(--radius-sm);padding:1rem;color:var(--text3);font-size:.88rem">
            You have no cards marked as available for trade.<br/>
            <a href="/upload" style="color:var(--blue)">Upload a card</a> and tick "For Trade" first.
           </div>`
        : `<div style="display:flex;flex-direction:column;gap:.4rem;max-height:220px;overflow-y:auto;padding:.3rem 0" id="offerList">
            ${myCards.map(c => `
              <label class="toggle-item" onclick="this.classList.toggle('checked',!this.querySelector('input').checked)">
                <input type="checkbox" name="offerCard" value="${c._id}" style="display:none"/>
                <img src="${c.imageUrl}" style="width:32px;height:42px;object-fit:cover;border-radius:4px" onerror="this.src='/img/card-placeholder.svg'"/>
                <span>🃏 ${c.title} <span style="color:var(--text3);font-size:.8rem">(${c.condition})</span></span>
              </label>`).join('')}
          </div>`}
    </div>
    <div class="form-group">
      <label class="form-label">Message to owner (optional)</label>
      <textarea id="tradeMsg" class="form-textarea" placeholder="e.g. I'll trade my Pikachu for your Charizard!"></textarea>
    </div>
    ${myCards.length > 0
      ? `<button class="btn btn-blue btn-full" onclick="submitTradeRequest('${cardId}','${ownerId}')">📤 Send Trade Request</button>`
      : `<a href="/upload" class="btn btn-primary btn-full">+ Upload a card to trade</a>`}
  `);
}

async function submitTradeRequest(requestedCardId, receiverId) {
  const checked = [...document.querySelectorAll('input[name=offerCard]:checked')].map(c => c.value);
  const message = document.getElementById('tradeMsg')?.value;

  if (!checked.length) { showToast('Select at least one card to offer', 'warning'); return; }

  try {
    await API.trades.create({
      receiverId,
      offeredCardIds: checked,
      requestedCardIds: [requestedCardId],
      message
    });
    forceCloseModal();
    showToast('Trade request sent!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.toggleCardFav        = toggleCardFav;
window.openBuyModal         = openBuyModal;
window.completePurchase     = completePurchase;
window.confirmDeleteCard    = confirmDeleteCard;
window.deleteCard           = deleteCard;
window.openTradeModal       = openTradeModal;
window.submitTradeRequest   = submitTradeRequest;
