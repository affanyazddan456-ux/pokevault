// ============================================================
//  PokéVault — My Collection Page
// ============================================================

async function renderCollection() {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }
  return `
    <div class="page-header">
      <div class="container" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
        <div><h1>🃏 My Collection</h1><p>Your personal card vault</p></div>
        <a href="/upload" class="btn btn-primary">+ Add Card</a>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container">
        <div class="cards-grid" id="collectionGrid">${skeletonCards(8)}</div>
      </div>
    </div>
  `;
}

async function initCollection() {
  try {
    const data = await API.cards.mine();
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    if (!data.cards.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🃏</div>
        <h3>Your vault is empty...</h3>
        <p>Upload your first Pokémon card to start your collection.</p>
        <a href="/upload" class="btn btn-primary">Upload First Card</a>
      </div>`;
    } else {
      grid.innerHTML = data.cards.map(c => renderCardItem(c)).join('');
    }
  } catch (err) {
    const grid = document.getElementById('collectionGrid');
    if (grid) grid.innerHTML = `<div class="error-banner" style="grid-column:1/-1">${err.message}</div>`;
  }
}
