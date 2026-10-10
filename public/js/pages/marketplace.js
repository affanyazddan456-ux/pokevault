// ============================================================
//  PokéVault — Marketplace Page
// ============================================================

let _marketFilters = { page: 1, limit: 24, sort: 'newest' };

async function renderMarketplace() {
  return `
    <div class="page-header">
      <div class="container">
        <h1>🃏 Marketplace</h1>
        <p>Browse the community's card collection</p>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="filter-group" style="flex:1;min-width:200px">
            <label>Search</label>
            <input type="text" id="mktSearch" class="form-input" placeholder="Card name, set..." 
                   onkeydown="if(event.key==='Enter')applyMarketFilters()"/>
          </div>
          <div class="filter-group">
            <label>Condition</label>
            <select id="mktCondition" class="form-select">
              <option value="">All</option>
              <option>Mint</option>
              <option>Near Mint</option>
              <option>Lightly Played</option>
              <option>Moderately Played</option>
              <option>Heavily Played</option>
              <option>Damaged</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Type</label>
            <select id="mktType" class="form-select">
              <option value="">All</option>
              <option value="sale">For Sale</option>
              <option value="trade">For Trade</option>
              <option value="auction">Auction</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Sort</label>
            <select id="mktSort" class="form-select">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
          <div class="filter-group" style="flex-direction:row;align-items:flex-end;gap:.5rem;min-width:auto">
            <button class="btn btn-primary" onclick="applyMarketFilters()">Search</button>
            <button class="btn btn-secondary" onclick="resetMarketFilters()">Reset</button>
          </div>
        </div>

        <!-- Results info -->
        <div id="mktInfo" style="color:var(--text3);font-size:.85rem;margin-bottom:1rem"></div>

        <!-- Grid -->
        <div class="cards-grid" id="mktGrid">${skeletonCards(12)}</div>

        <!-- Pagination -->
        <div id="mktPagination" class="text-center mt-3"></div>
      </div>
    </div>
  `;
}

async function initMarketplace() {
  _marketFilters = { page: 1, limit: 24, sort: 'newest' };
  await loadMarketCards();
}

async function loadMarketCards() {
  const grid = document.getElementById('mktGrid');
  if (!grid) return;
  grid.innerHTML = skeletonCards(12);

  try {
    const q = { ..._marketFilters };
    const data = await API.cards.list(q);
    const info = document.getElementById('mktInfo');
    if (info) info.textContent = `${data.total} card${data.total !== 1 ? 's' : ''} found`;

    if (!data.cards.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <h3>No cards found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>`;
    } else {
      grid.innerHTML = data.cards.map(c => renderCardItem(c)).join('');
    }

    renderMarketPagination(data.page, data.pages);
  } catch (err) {
    grid.innerHTML = `<div class="error-banner" style="grid-column:1/-1">${err.message}</div>`;
  }
}

function applyMarketFilters() {
  const search    = document.getElementById('mktSearch')?.value.trim();
  const condition = document.getElementById('mktCondition')?.value;
  const type      = document.getElementById('mktType')?.value;
  const sort      = document.getElementById('mktSort')?.value;

  _marketFilters = { page: 1, limit: 24, sort: sort || 'newest' };
  if (search)    _marketFilters.search = search;
  if (condition) _marketFilters.condition = condition;
  if (type === 'sale')    _marketFilters.forSale  = true;
  if (type === 'trade')   _marketFilters.forTrade = true;
  if (type === 'auction') _marketFilters.auction  = true;

  loadMarketCards();
}

function resetMarketFilters() {
  document.getElementById('mktSearch').value    = '';
  document.getElementById('mktCondition').value = '';
  document.getElementById('mktType').value      = '';
  document.getElementById('mktSort').value      = 'newest';
  _marketFilters = { page: 1, limit: 24, sort: 'newest' };
  loadMarketCards();
}

function renderMarketPagination(current, total) {
  const el = document.getElementById('mktPagination');
  if (!el || total <= 1) { if (el) el.innerHTML = ''; return; }

  let html = '<div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">';
  if (current > 1)   html += `<button class="btn btn-secondary btn-sm" onclick="goMarketPage(${current-1})">← Prev</button>`;

  for (let i = Math.max(1, current-2); i <= Math.min(total, current+2); i++) {
    html += `<button class="btn ${i === current ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="goMarketPage(${i})">${i}</button>`;
  }
  if (current < total) html += `<button class="btn btn-secondary btn-sm" onclick="goMarketPage(${current+1})">Next →</button>`;
  html += '</div>';
  el.innerHTML = html;
}

function goMarketPage(page) {
  _marketFilters.page = page;
  loadMarketCards();
  window.scrollTo(0, 200);
}

window.applyMarketFilters = applyMarketFilters;
window.resetMarketFilters = resetMarketFilters;
window.goMarketPage       = goMarketPage;
