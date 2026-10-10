// ============================================================
//  PokéVault — Public Profile Page
// ============================================================

async function renderProfile({ id }) {
  return `
    <div id="profileContent">
      <div class="flex-center" style="height:300px"><div class="spinner spinner-lg"></div></div>
    </div>`;
}

async function initProfile({ id }) {
  const userId = id || Auth.user?._id;
  if (!userId) { Router.go('/login'); return; }

  try {
    const [profileData, cardsData] = await Promise.all([
      API.users.get(userId),
      API.cards.byUser(userId)
    ]);

    const { user, cardCount } = profileData;
    const cards      = cardsData.cards;
    const isOwn      = Auth.user?._id === user._id;

    // Calculate total HP across all cards
    const totalHP    = cards.reduce((sum, c) => sum + (c.hp || 0), 0);
    const avgHP      = cards.length ? Math.round(totalHP / cards.length) : 0;

    const el = document.getElementById('profileContent');
    if (!el) return;

    el.innerHTML = `
      <!-- Hero -->
      <div class="profile-hero">
        <img class="profile-avatar-xl"
             src="${user.avatar || '/img/default-avatar.svg'}"
             alt="${user.username}"
             onerror="this.src='/img/default-avatar.svg'"/>
        <h1>${user.username}</h1>
        <p class="join-date">Joined ${formatDate(user.createdAt)}</p>
        ${user.bio ? `<p style="color:var(--text2);max-width:440px;margin:.6rem auto;font-size:.95rem">${user.bio}</p>` : ''}

        <div class="profile-stats-row">
          <div class="profile-stat">
            <div class="val">${cardCount || 0}</div>
            <div class="lbl">Cards</div>
          </div>
          <div class="profile-stat">
            <div class="val">${totalHP.toLocaleString()}</div>
            <div class="lbl">Total HP</div>
          </div>
          <div class="profile-stat">
            <div class="val">${avgHP}</div>
            <div class="lbl">Avg HP</div>
          </div>
          <div class="profile-stat">
            <div class="val">${user.totalTrades || 0}</div>
            <div class="lbl">Trades</div>
          </div>
          <div class="profile-stat">
            <div class="val">${user.points || 0}</div>
            <div class="lbl">Points</div>
          </div>
          <div class="profile-stat">
            <div class="val">#${user.rank || '?'}</div>
            <div class="lbl">Rank</div>
          </div>
        </div>

        <div style="display:flex;gap:.8rem;justify-content:center;margin-top:1.2rem;flex-wrap:wrap">
          ${isOwn
            ? `<a href="/dashboard" class="btn btn-primary">📊 Dashboard</a>
               <a href="/upload" class="btn btn-secondary">+ Upload Card</a>`
            : Auth.isLoggedIn()
              ? `<button class="btn btn-ghost" onclick="openReportModal('user','${user._id}')">🚩 Report</button>`
              : ''}
        </div>
      </div>

      <!-- Rarity breakdown -->
      ${cards.length ? `
      <div style="background:var(--bg2);padding:2rem">
        <div class="container">
          <h3 style="margin-bottom:1rem;font-size:1rem;color:var(--text2)">🎴 Collection Breakdown</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem">
            ${getRarityBreakdown(cards)}
          </div>
        </div>
      </div>` : ''}

      <!-- Cards grid -->
      <div class="section" style="padding-top:2rem">
        <div class="container">
          <h2 style="margin-bottom:1.5rem">🃏 ${user.username}'s Collection (${cards.length})</h2>
          <div class="cards-grid">
            ${cards.length
              ? cards.map(c => renderCardItem(c)).join('')
              : `<div class="empty-state" style="grid-column:1/-1">
                  <div class="empty-icon">🃏</div>
                  <h3>No cards uploaded yet</h3>
                  ${isOwn ? '<a href="/upload" class="btn btn-primary">Upload First Card</a>' : ''}
                </div>`}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    const el = document.getElementById('profileContent');
    if (el) el.innerHTML = `
      <div class="section"><div class="container">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>Profile Not Found</h3>
          <p>${err.message}</p>
          <a href="/" class="btn btn-primary">Go Home</a>
        </div>
      </div></div>`;
  }
}

function getRarityBreakdown(cards) {
  const counts = {};
  cards.forEach(c => {
    const r = c.rarity || 'Unknown';
    counts[r] = (counts[r] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([rarity, count]) => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:.25rem .9rem;font-size:.78rem;font-weight:700;color:var(--text2)">
        ${rarity} <span style="color:var(--yellow)">(${count})</span>
      </div>`).join('');
}
