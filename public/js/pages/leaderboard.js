// ============================================================
//  PokéVault — Leaderboard Page
// ============================================================

async function renderLeaderboard() {
  return `
    <div class="page-header">
      <div class="container">
        <h1>🏆 Leaderboard</h1>
        <p>Top collectors in the PokéVault community</p>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container" style="max-width:800px">
        <div id="podiumContainer"></div>
        <div id="leaderboardTable"><div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div></div>

        <!-- Points Guide -->
        <div style="margin-top:3rem">
          <h3 style="margin-bottom:1rem">⭐ How Points Are Earned</h3>
          <div class="points-guide">
            ${[
              ['🃏 Upload a card', '+5 pts'],
              ['✅ Complete a trade', '+15 pts each'],
              ['🔨 Place a bid', '+2 pts'],
              ['💰 Auction your card sold', '+20 pts'],
              ['♥ Card gets favorited', '+1 pt'],
            ].map(([a, b]) => `<div class="points-row"><span>${a}</span><strong>${b}</strong></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initLeaderboard() {
  try {
    const data  = await API.users.leaderboard();
    const users = data.leaderboard;

    // Podium (top 3)
    const podiumEl = document.getElementById('podiumContainer');
    if (podiumEl && users.length >= 3) {
      const [first, second, third] = users;
      podiumEl.innerHTML = `
        <div class="podium-row">
          <!-- 2nd place -->
          <div class="podium-item podium-2 animate">
            <div class="podium-crown">🥈</div>
            <img class="podium-avatar" src="${second.avatar || '/img/default-avatar.svg'}" 
                 alt="${second.username}" onerror="this.src='/img/default-avatar.svg'"/>
            <div class="podium-name">${second.username}</div>
            <div class="podium-pts text-muted">${second.points || 0} pts</div>
            <div class="podium-rank">#2</div>
          </div>
          <!-- 1st place -->
          <div class="podium-item podium-1 animate">
            <div class="podium-crown">👑</div>
            <img class="podium-avatar" src="${first.avatar || '/img/default-avatar.svg'}" 
                 alt="${first.username}" onerror="this.src='/img/default-avatar.svg'"/>
            <div class="podium-name">${first.username}</div>
            <div class="podium-pts text-yellow">${first.points || 0} pts</div>
            <div class="podium-rank">#1</div>
          </div>
          <!-- 3rd place -->
          <div class="podium-item podium-3 animate">
            <div class="podium-crown">🥉</div>
            <img class="podium-avatar" src="${third.avatar || '/img/default-avatar.svg'}" 
                 alt="${third.username}" onerror="this.src='/img/default-avatar.svg'"/>
            <div class="podium-name">${third.username}</div>
            <div class="podium-pts text-muted">${third.points || 0} pts</div>
            <div class="podium-rank">#3</div>
          </div>
        </div>`;
    }

    // Full table
    const tableEl = document.getElementById('leaderboardTable');
    if (tableEl) {
      if (!users.length) {
        tableEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><h3>No members yet</h3><p>Be the first to join and top the leaderboard!</p></div>`;
        return;
      }
      const myId = Auth.user?._id;
      tableEl.innerHTML = `
        <div class="leaderboard-table">
          <div class="lb-row header">
            <div class="lb-rank">Rank</div>
            <div class="lb-user">Player</div>
            <div class="lb-pts">Points</div>
            <div class="lb-num">Cards</div>
            <div class="lb-num">Trades</div>
          </div>
          ${users.map((u, i) => `
            <div class="lb-row ${u._id === myId ? 'my-row' : ''}" onclick="Router.go('/profile/${u._id}')">
              <div class="lb-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
              <div class="lb-user">
                <img class="lb-avatar" src="${u.avatar || '/img/default-avatar.svg'}" 
                     alt="${u.username}" onerror="this.src='/img/default-avatar.svg'"/>
                <span class="lb-username">${u.username}${u._id === myId ? ' (You)' : ''}</span>
              </div>
              <div class="lb-pts">${u.points || 0}</div>
              <div class="lb-num">${u.totalCards || 0}</div>
              <div class="lb-num">${u.totalTrades || 0}</div>
            </div>`).join('')}
        </div>`;
    }
  } catch (err) {
    const el = document.getElementById('leaderboardTable');
    if (el) el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}
