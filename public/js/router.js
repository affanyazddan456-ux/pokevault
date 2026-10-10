// ============================================================
//  PokéVault — SPA Router
// ============================================================

const Router = {
  routes: [],

  add(pattern, handler) {
    this.routes.push({ pattern, handler });
  },

  match(path) {
    for (const route of this.routes) {
      const keys   = [];
      const regex  = new RegExp('^' + route.pattern.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '(?:\\?.*)?$');
      const match  = path.match(regex);
      if (match) {
        const params = {};
        keys.forEach((k, i) => params[k] = decodeURIComponent(match[i + 1]));
        return { handler: route.handler, params };
      }
    }
    return null;
  },

  async navigate(path) {
    window.scrollTo(0, 0);
    const app = document.getElementById('app');

    // Mark active nav link
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === path || l.dataset.page === path.slice(1));
    });

    const matched = this.match(path);
    if (matched) {
      try {
        const html = await matched.handler(matched.params);
        app.innerHTML = html || '';
        app.className = 'page-enter';
        // Trigger re-flow for animation
        void app.offsetWidth;
        app.className = '';
      } catch (err) {
        console.error('[ROUTER]', err);
        app.innerHTML = renderError(err.message);
      }
    } else {
      app.innerHTML = render404();
    }
  },

  go(path) {
    history.pushState({}, '', path);
    this.navigate(path);
  },

  init() {
    // Handle back/forward
    window.addEventListener('popstate', () => this.navigate(location.pathname));

    // Intercept all internal links
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return;
      e.preventDefault();
      this.go(href);
    });

    // Navigate to current path
    this.navigate(location.pathname);
  }
};

function renderError(msg) {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>${msg || 'An unexpected error occurred. Please try again.'}</p>
          <a href="/" class="btn btn-primary">Go Home</a>
        </div>
      </div>
    </div>`;
}

function render404() {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">🃏</div>
          <h3>Page Not Found</h3>
          <p>This page doesn't exist in the vault.</p>
          <a href="/" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    </div>`;
}
