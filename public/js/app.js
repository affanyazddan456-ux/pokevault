// ============================================================
//  PokéVault — App Entry Point & Route Definitions
// ============================================================

// ── Announcement banner helpers ────────────────────────────
function adjustLayoutForBanners() {
  const banners = document.getElementById('announcementBanners');
  const navbar  = document.getElementById('navbar');
  const app     = document.getElementById('app');
  if (!banners || !navbar) return;
  const h = banners.offsetHeight;
  navbar.style.top = h + 'px';
  if (app) app.style.paddingTop = (h + 70) + 'px';
}

function removeAnnBanner(id) {
  document.getElementById(id)?.remove();
  adjustLayoutForBanners();
}
window.removeAnnBanner = removeAnnBanner;

// Register all routes
Router.add('/',              async ()  => await renderHome());
Router.add('/marketplace',   async ()  => await renderMarketplace());
Router.add('/card/:id',      async (p) => await renderCardDetail(p));
Router.add('/upload',        async ()  => await renderUpload());
Router.add('/auctions',      async ()  => await renderAuctions());
Router.add('/auction/:id',   async (p) => await renderAuctionDetail(p));
Router.add('/trades',        async ()  => await renderTrades());
Router.add('/dashboard',     async ()  => await renderDashboard());
Router.add('/collection',    async ()  => await renderCollection());
Router.add('/leaderboard',   async ()  => await renderLeaderboard());
Router.add('/profile/:id',   async (p) => await renderProfile(p));
Router.add('/profile',       async ()  => await renderProfile({ id: null }));
Router.add('/login',         ()        => renderLogin() || '');
Router.add('/signup',        ()        => renderSignup() || '');
Router.add('/admin',         async ()  => await renderAdmin());
Router.add('/messages',      async ()  => await renderMessages());
Router.add('/messages/:id',  async (p) => await renderMessages(p));

// Page-specific init functions (called after the page HTML is injected into DOM)
const PAGE_INITS = {
  '/':            initHome,
  '/marketplace': initMarketplace,
  '/auctions':    initAuctions,
  '/trades':      initTrades,
  '/dashboard':   initDashboard,
  '/collection':  initCollection,
  '/leaderboard': initLeaderboard,
  '/login':       () => {},
  '/signup':      initSignup,
  '/admin':       initAdmin,
  '/upload':      initUpload,
  '/messages':    () => initMessages(),
};

// Wrap Router.navigate to call page-specific init AFTER render
const _origNavigate = Router.navigate.bind(Router);
Router.navigate = async function(path) {
  await _origNavigate(path);

  const basePath = path.split('?')[0];

  // Exact match
  if (PAGE_INITS[basePath]) {
    try { await PAGE_INITS[basePath](); } catch(e) { console.error('[PAGE INIT]', basePath, e); }
    return;
  }

  // Param-based pages
  const paramPages = [
    { pattern: /^\/card\/(.+)$/,      init: m => initCardDetail({ id: m[1] }) },
    { pattern: /^\/auction\/(.+)$/,   init: m => initAuctionDetail({ id: m[1] }) },
    { pattern: /^\/profile\/(.+)$/,   init: m => initProfile({ id: m[1] }) },
    { pattern: /^\/messages\/(.+)$/,  init: m => initMessages({ partnerId: m[1] }) },
  ];
  for (const pp of paramPages) {
    const m = basePath.match(pp.pattern);
    if (m) { try { await pp.init(m); } catch(e) { console.error('[PAGE INIT]', e); } return; }
  }
};

// ── Bootstrap ──────────────────────────────────────────────
(async () => {
  try {
    await Auth.init();
  } catch(e) {
    console.warn('[Auth.init failed]', e);
  }

  // Load live announcements banner
  try {
    const data = await API.stats.community();
    if (data.announcements?.length) {
      const icons  = { info:'ℹ️', warning:'⚠️', success:'✅', danger:'🚨' };
      const banner = document.getElementById('announcementBanners');
      if (banner) {
        banner.innerHTML = data.announcements.map(a => `
          <div class="ann-banner ${a.type || 'info'}" id="ann-${a._id}">
            <span>${icons[a.type]||'ℹ️'} <strong>${a.title}</strong> — ${a.message}</span>
            <button class="ann-banner-close" onclick="removeAnnBanner('ann-${a._id}')">✕</button>
          </div>`).join('');
        // Push navbar and app content down by banner height
        adjustLayoutForBanners();
      }
    }
  } catch(e) {}

  try {
    Router.init();
  } catch(e) {
    console.error('[Router.init failed]', e);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div class="section"><div class="container"><div class="empty-state">
      <div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>Try refreshing the page.</p>
    </div></div></div>`;
  }

  hideGlobalLoader();
})();
