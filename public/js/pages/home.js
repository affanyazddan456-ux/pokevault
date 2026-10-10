// ============================================================
//  PokéVault — Home / Landing Page
// ============================================================

async function renderHome() {
  const statsHTML = await loadStats();
  return `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-particles" id="heroParticles"></div>

      <div class="hero-content">
        <h1 class="hero-title font-orbitron">
          Poké<span>Vault</span>
        </h1>
        <p class="hero-sub">Collect · Trade · Auction · Sell</p>
        <div class="hero-actions">
          <a href="/signup" class="btn btn-primary btn-lg">✨ Create Account</a>
          <a href="/marketplace" class="btn btn-secondary btn-lg">🃏 Explore Cards</a>
        </div>
        <div class="stats-bar" id="statsBar">
          ${statsHTML}
        </div>
      </div>

      <!-- Pokéball -->
      <div class="hero-pokeball">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer circle -->
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
          <!-- Top half -->
          <path d="M 4 100 A 96 96 0 0 1 196 100 Z" fill="#e53e3e" opacity="0.9"/>
          <!-- Bottom half -->
          <path d="M 4 100 A 96 96 0 0 0 196 100 Z" fill="#f0f0f0" opacity="0.9"/>
          <!-- Center band -->
          <rect x="4" y="92" width="192" height="16" fill="#1a1d35"/>
          <!-- Center button outer -->
          <circle cx="100" cy="100" r="24" fill="#1a1d35"/>
          <!-- Center button ring -->
          <circle cx="100" cy="100" r="18" fill="none" stroke="rgba(249,211,56,0.6)" stroke-width="3"/>
          <!-- Center button inner -->
          <circle cx="100" cy="100" r="12" fill="white" opacity="0.9"/>
          <!-- Highlight -->
          <circle cx="80" cy="55" r="12" fill="white" opacity="0.12"/>
        </svg>
      </div>
    </section>

    <!-- Featured Cards -->
    <section class="section" style="background:var(--bg2)">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">🃏 Featured</div>
          <h2>Recently Added Cards</h2>
          <p>Discover the latest additions to the vault</p>
        </div>
        <div class="cards-grid" id="featuredGrid">${skeletonCards(6)}</div>
        <div class="text-center mt-3">
          <a href="/marketplace" class="btn btn-secondary">View All Cards →</a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">✨ Features</div>
          <h2>Everything You Need</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.5rem">
          ${[
            ['🃏', 'Upload & Collect', 'Build your personal card collection with beautiful display cards'],
            ['🔄', 'Trade Cards', 'Propose trades with other collectors in the community'],
            ['🔨', 'Auctions', 'Bid on rare cards with live countdown timers'],
            ['💰', 'Marketplace', 'Buy and sell cards with the community'],
            ['🏆', 'Leaderboard', 'Compete and earn points through community activity'],
            ['🔔', 'Notifications', 'Stay updated on trades, bids, and community events'],
          ].map(([icon, title, desc]) => `
            <div class="glass-panel" style="padding:1.8rem;text-align:center;transition:all .3s" 
                 onmouseenter="this.style.transform='translateY(-6px)'" 
                 onmouseleave="this.style.transform='translateY(0)'">
              <div style="font-size:2.5rem;margin-bottom:1rem">${icon}</div>
              <h3 style="margin-bottom:.5rem;font-size:1.1rem">${title}</h3>
              <p style="color:var(--text3);font-size:.88rem">${desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Points Guide -->
    <section class="section" style="background:var(--bg2)">
      <div class="container" style="max-width:600px">
        <div class="section-header">
          <div class="section-tag">⭐ Points</div>
          <h2>How to Earn Points</h2>
          <p>Transparent ranking system — know exactly how to climb</p>
        </div>
        <div class="points-guide">
          ${[
            ['Upload a card', '+5 pts'],
            ['Complete a trade', '+15 pts (both users)'],
            ['Successful auction sale', '+20 pts'],
            ['Place a bid', '+2 pts'],
            ['Get a card favorited', '+1 pt'],
          ].map(([action, pts]) => `
            <div class="points-row">
              <span>${action}</span>
              <strong>${pts}</strong>
            </div>
          `).join('')}
        </div>
        <div class="text-center mt-3">
          <a href="/leaderboard" class="btn btn-secondary">View Leaderboard →</a>
        </div>
      </div>
    </section>
  `;
}

async function loadStats() {
  try {
    const data = await API.stats.community();
    // Show active announcements as banners
    if (data.announcements && data.announcements.length) {
      const colors = { info:'var(--blue)', warning:'var(--orange)', success:'var(--green)', danger:'var(--red)' };
      const icons  = { info:'ℹ️', warning:'⚠️', success:'✅', danger:'🚨' };
      const banners = data.announcements.map(a => `
        <div style="background:rgba(${a.type==='danger'?'229,62,62':a.type==='warning'?'237,137,54':a.type==='success'?'72,187,120':'66,153,225'},.15);border:1px solid ${colors[a.type]||'var(--blue)'};border-radius:var(--radius);padding:.8rem 1.2rem;display:flex;align-items:center;gap:.7rem;text-align:left">
          <span style="font-size:1.2rem">${icons[a.type]||'ℹ️'}</span>
          <div><strong style="color:${colors[a.type]}">${a.title}</strong> — <span style="font-size:.88rem;color:var(--text2)">${a.message}</span></div>
        </div>`).join('');
      // Inject above stats bar
      const statsBarEl = document.getElementById('statsBar');
      if (statsBarEl) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.5rem;max-width:700px;width:100%';
        wrapper.innerHTML = banners;
        statsBarEl.parentNode.insertBefore(wrapper, statsBarEl);
      }
    }
    return `
      <div class="stat-pill"><span class="stat-num" data-target="${data.totalMembers}">${data.totalMembers}</span><span class="stat-label">Members</span></div>
      <div class="stat-pill"><span class="stat-num" data-target="${data.totalCards}">${data.totalCards}</span><span class="stat-label">Cards</span></div>
      <div class="stat-pill"><span class="stat-num" data-target="${data.cardsForTrade}">${data.cardsForTrade}</span><span class="stat-label">For Trade</span></div>
      <div class="stat-pill"><span class="stat-num" data-target="${data.cardsForSale}">${data.cardsForSale}</span><span class="stat-label">For Sale</span></div>
      <div class="stat-pill"><span class="stat-num" data-target="${data.activeAuctions}">${data.activeAuctions}</span><span class="stat-label">Auctions</span></div>
    `;
  } catch {
    return '';
  }
}

// Init after DOM
async function initHome() {
  // Particles
  const container = document.getElementById('heroParticles');
  if (container) spawnParticles(container, 25);

  // Animated stat counters
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    animateCount(el, target, 1500);
  });

  // Load featured cards
  try {
    const data = await API.cards.list({ limit: 6, sort: 'newest' });
    const grid = document.getElementById('featuredGrid');
    if (grid) {
      if (data.cards.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🃏</div>
          <h3>No cards discovered yet...</h3>
          <p>Be the first to upload a card to the vault!</p>
          ${Auth.isLoggedIn() ? '<a href="/upload" class="btn btn-primary">Upload First Card</a>' : '<a href="/signup" class="btn btn-primary">Join Now</a>'}
        </div>`;
      } else {
        grid.innerHTML = data.cards.map(c => renderCardItem(c)).join('');
      }
    }
  } catch (err) {
    const grid = document.getElementById('featuredGrid');
    if (grid) grid.innerHTML = `<div class="error-banner" style="grid-column:1/-1">Failed to load cards.</div>`;
  }
}
