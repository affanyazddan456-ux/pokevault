// ============================================================
//  PokéVault — UI Utilities
// ============================================================

// ── Toast notifications ────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal ──────────────────────────────────────────────
function openModal(content) {
  const overlay = document.getElementById('modalOverlay');
  const box     = document.getElementById('modalBox');
  if (!overlay || !box) return;
  box.innerHTML = content;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function forceCloseModal() {
  document.getElementById('modalOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') forceCloseModal(); });

// ── Loading helpers ─────────────────────────────────────
function showGlobalLoader() {
  const ls = document.getElementById('loadingScreen');
  if (ls) { ls.style.opacity = '1'; ls.classList.remove('hidden'); }
}
function hideGlobalLoader() {
  const ls = document.getElementById('loadingScreen');
  if (!ls) return;
  ls.style.transition = 'opacity .4s ease';
  ls.style.opacity = '0';
  setTimeout(() => ls.classList.add('hidden'), 420);
}

// ── Skeleton loaders ────────────────────────────────────
function skeletonCards(count = 8) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div style="padding:.8rem">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    </div>`).join('');
}

// ── Time formatting ──────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(num) {
  if (!num && num !== 0) return '—';
  return '₱' + Number(num).toLocaleString();
}

// ── Countdown timer ──────────────────────────────────────
function formatCountdown(endTimeStr) {
  const diff = new Date(endTimeStr).getTime() - Date.now();
  if (diff <= 0) return { text: 'Ended', urgent: false };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const urgent = diff < 3600000; // less than 1 hour
  if (d > 0) return { text: `${d}d ${h}h ${m}m`, urgent };
  if (h > 0) return { text: `${h}h ${m}m ${s}s`, urgent };
  return { text: `${m}m ${s}s`, urgent: true };
}

// ── Card component ────────────────────────────────────────
function renderCardItem(card, opts = {}) {
  const badges = [];
  if (card.saleAvailable && !opts.hideBadges)    badges.push('<span class="badge badge-sale">💰 For Sale</span>');
  if (card.tradeAvailable && !opts.hideBadges)   badges.push('<span class="badge badge-trade">🔄 For Trade</span>');
  if (card.auctionAvailable && !opts.hideBadges) badges.push('<span class="badge badge-auction">🔨 Auction</span>');

  const priceText = card.saleAvailable && card.price ? formatPrice(card.price) :
                    card.auctionAvailable && card.startingBid ? `Bid: ${formatPrice(card.startingBid)}` : '';

  return `
    <div class="card-item card-reveal holo-card" onclick="Router.go('/card/${card._id}')">
      <div class="card-img-wrap">
        <img src="${card.imageUrl}" alt="${card.title}" loading="lazy"
             onerror="this.src='/img/card-placeholder.svg'"/>
        <div class="card-badges">${badges.join('')}</div>
        <button class="card-fav-btn ${opts.isFav ? 'faved' : ''}"
                onclick="toggleFav(event, '${card._id}', this)"
                title="Favorite">♥</button>
      </div>
      <div class="card-body">
        <div class="card-name">${card.title}</div>
        ${card.ownerUsername ? `<div class="card-owner">by ${card.ownerUsername}</div>` : ''}
        <div class="card-footer">
          <span class="card-condition">${card.condition}</span>
          ${priceText ? `<span class="card-price">${priceText}</span>` : ''}
        </div>
      </div>
    </div>`;
}

async function toggleFav(e, cardId, btn) {
  e.stopPropagation();
  if (!Auth.isLoggedIn()) { Router.go('/login'); return; }
  try {
    const data = await API.cards.favorite(cardId);
    btn.classList.toggle('faved', data.favorited);
    showToast(data.favorited ? 'Added to favorites' : 'Removed from favorites', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Particle system ───────────────────────────────────────
function spawnParticles(container, count = 20) {
  const colors = ['#f9d338','#ff6eb4','#4d96ff','#6bcb77','#c77dff','#ffd93d'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random() * 6;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${80 + Math.random()*20}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      --dur:${3+Math.random()*5}s;
      --delay:${Math.random()*4}s;
      --tx:${(Math.random()-.5)*200}px;
      opacity:.7;
    `;
    container.appendChild(p);
  }
}

// ── Animated counter ──────────────────────────────────────
function animateCount(el, target, duration = 1200) {
  const start = 0;
  const step = (timestamp, startTime) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(ts => step(ts, startTime));
  };
  requestAnimationFrame(ts => step(ts, ts));
}

// ── Condition badge color ──────────────────────────────────
function conditionColor(cond) {
  const map = {
    'Mint': 'var(--yellow)', 'Near Mint': 'var(--green)',
    'Lightly Played': 'var(--blue)', 'Moderately Played': 'var(--orange)',
    'Heavily Played': 'var(--red-lt)', 'Damaged': 'var(--text3)'
  };
  return map[cond] || 'var(--text3)';
}

// ── Report modal ───────────────────────────────────────────
function openReportModal(targetType, targetId) {
  if (!Auth.isLoggedIn()) { Router.go('/login'); return; }
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-2">🚩 Report</h2>
    <div class="form-group">
      <label class="form-label">Reason</label>
      <select class="form-select" id="reportReason">
        <option value="inappropriate">Inappropriate content</option>
        <option value="spam">Spam</option>
        <option value="counterfeit">Counterfeit / fake card</option>
        <option value="scam">Scam attempt</option>
        <option value="harassment">Harassment</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Additional details (optional)</label>
      <textarea class="form-textarea" id="reportDesc" placeholder="Describe the issue..."></textarea>
    </div>
    <button class="btn btn-danger btn-full" onclick="submitReport('${targetType}','${targetId}')">Submit Report</button>
  `);
}

async function submitReport(targetType, targetId) {
  const reason = document.getElementById('reportReason').value;
  const desc   = document.getElementById('reportDesc').value;
  try {
    await API.reports.submit({ targetType, targetId, reason, description: desc });
    forceCloseModal();
    showToast('Report submitted. Thank you.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Expose globals for inline handlers
window.toggleFav       = toggleFav;
window.openReportModal = openReportModal;
window.submitReport    = submitReport;
window.forceCloseModal = forceCloseModal;
window.Router          = Router;
