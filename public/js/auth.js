// ============================================================
//  PokéVault — Auth State Management
// ============================================================

const Auth = {
  user: null,

  async init() {
    try {
      const data = await API.auth.me();
      this.user = data.user;
      // Check if suspended while logged in
      if (this.user?.isSuspended) {
        this.showSuspendedScreen(this.user);
        return;
      }
    } catch {
      this.user = null;
    }
    this.updateNav();
    this.loadNotifications();
  },

  showSuspendedScreen(user) {
    const until = user.suspendedUntil
      ? `<p style="color:var(--text3);font-size:.85rem;margin-top:.5rem">Suspension lifts: <strong style="color:var(--yellow)">${new Date(user.suspendedUntil).toLocaleString()}</strong></p>`
      : '';
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#0d0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;gap:1.2rem;padding:2rem;text-align:center;overflow-y:auto">
        <div style="font-size:4.5rem">🔒</div>
        <h1 style="font-family:'Orbitron',sans-serif;color:#e53e3e;font-size:1.8rem">Account Suspended</h1>

        <div style="background:rgba(229,62,62,.1);border:1px solid rgba(229,62,62,.35);border-radius:14px;padding:1.2rem 2rem;max-width:440px;width:100%">
          <p style="color:#fc8181;font-size:.85rem;font-weight:700;margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.06em">Reason</p>
          <p style="color:#e8eaf6">${user.suspendReason || 'Policy violation'}</p>
          ${until}
        </div>

        <!-- Appeal Box -->
        <div style="background:var(--surface,#1e2240);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1.5rem;max-width:440px;width:100%">
          <p style="color:#9fa8c9;font-weight:700;margin-bottom:.8rem;font-size:.95rem">📝 Submit an Appeal</p>
          <p style="color:#6b74a3;font-size:.82rem;margin-bottom:.8rem">Explain why your account should be reinstated. The admin will review your message.</p>
          <textarea id="appealText" placeholder="Write your appeal here..."
            style="width:100%;background:#131625;border:1px solid #2e3460;border-radius:8px;padding:.7rem 1rem;color:#e8eaf6;font-family:inherit;font-size:.9rem;resize:vertical;min-height:90px;outline:none"></textarea>
          <button id="appealBtn" onclick="submitAppeal()"
            style="width:100%;margin-top:.7rem;background:linear-gradient(135deg,#f9d338,#fce96a);color:#111;border:none;padding:.7rem;border-radius:8px;font-weight:800;cursor:pointer;font-size:.95rem">
            📤 Send Appeal
          </button>
          <div id="appealMsg" style="margin-top:.5rem;font-size:.82rem"></div>
        </div>

        <button onclick="fetch('/api/auth/logout',{method:'POST',credentials:'include'}).then(()=>location.href='/')"
          style="background:transparent;border:1px solid #2e3460;color:#9fa8c9;padding:.6rem 2rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:.9rem">
          Sign Out
        </button>
      </div>
      <script>
        var _suspendedUserId  = '${user._id || ''}';
        var _suspendedUsername = '${(user.username||'').replace(/'/g,"\\'")}';
        function submitAppeal() {
          var text = document.getElementById('appealText').value.trim();
          var btn  = document.getElementById('appealBtn');
          var msg  = document.getElementById('appealMsg');
          if (!text) { msg.style.color='#fc8181'; msg.textContent='Please write your appeal first.'; return; }
          btn.disabled = true; btn.textContent = 'Sending...';
          fetch('/api/appeals', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ userId: _suspendedUserId, username: _suspendedUsername, message: text })
          })
          .then(r=>r.json())
          .then(d=>{
            if (d.error) { msg.style.color='#fc8181'; msg.textContent=d.error; btn.disabled=false; btn.textContent='📤 Send Appeal'; }
            else {
              document.getElementById('appealText').value='';
              document.getElementById('appealText').style.display='none';
              btn.style.display='none';
              msg.style.color='#9ae6b4'; msg.textContent='✅ Appeal sent! The admin will review it. You can sign out and wait.';
            }
          })
          .catch(()=>{ msg.style.color='#fc8181'; msg.textContent='Failed to send. Try again.'; btn.disabled=false; btn.textContent='📤 Send Appeal'; });
        }
      <\/script>`;
  },

  updateNav() {
    const guestEl = document.getElementById('navGuest');
    const userEl  = document.getElementById('navUser');
    if (!guestEl || !userEl) return;

    if (this.user) {
      guestEl.classList.add('hidden');
      userEl.classList.remove('hidden');

      // Set avatar
      const avatarEl = document.getElementById('navAvatar');
      if (avatarEl) avatarEl.src = this.user.avatar || '/img/default-avatar.svg';

      // Profile link
      const profileLink = document.getElementById('myProfileLink');
      if (profileLink) profileLink.href = `/profile/${this.user._id}`;

      // Admin link
      if (this.user.isAdmin) {
        document.getElementById('adminMenuLink')?.classList.remove('hidden');
      }
    } else {
      guestEl.classList.remove('hidden');
      userEl.classList.add('hidden');
    }
  },

  async loadNotifications() {
    if (!this.user) return;
    try {
      const data   = await API.users.notifications();
      const unread = data.notifications.filter(n => !n.read).length;
      const badge  = document.getElementById('notifBadge');
      if (badge) {
        badge.textContent = unread;
        if (unread > 0) {
          badge.classList.remove('hidden');
          document.querySelector('.notif-bell')?.classList.add('ringing');
          setTimeout(() => document.querySelector('.notif-bell')?.classList.remove('ringing'), 800);
        } else {
          badge.classList.add('hidden');
        }
      }
      // Message unread badge
      const msgUnread = data.notifications.filter(n => !n.read && n.type === 'message').length;
      const msgBadge  = document.getElementById('msgBadge');
      if (msgBadge) {
        msgBadge.textContent = msgUnread;
        msgBadge.classList.toggle('hidden', msgUnread === 0);
      }
      renderNotifications(data.notifications);
    } catch {}
  },

  isLoggedIn() { return !!this.user; },
  isAdmin()    { return this.user?.isAdmin === true; },
};

function renderNotifications(notifs) {
  const list = document.getElementById('notifList');
  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = '<div class="empty-state-mini">No notifications yet 🔔</div>';
    return;
  }
  list.innerHTML = notifs.slice(0, 15).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.link || ''}')">
      <p>${n.message}</p>
      <div class="notif-time">${timeAgo(n.createdAt)}</div>
    </div>
  `).join('');
}

function handleNotifClick(link) {
  closeNotifications();
  if (link) Router.go(link);
}

async function logout() {
  try {
    await API.auth.logout();
  } catch {}
  Auth.user = null;
  Auth.updateNav();
  closeUserMenu();
  Router.go('/');
  showToast('Logged out successfully', 'info');
}

function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  if (dd) dd.classList.toggle('hidden');
}

function closeUserMenu() {
  document.getElementById('userDropdown')?.classList.add('hidden');
}

function toggleNotifications() {
  const panel   = document.getElementById('notifPanel');
  const overlay = document.getElementById('notifOverlay');
  if (!panel) return;
  panel.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    Auth.loadNotifications();
  }
}

function closeNotifications() {
  document.getElementById('notifPanel')?.classList.add('hidden');
  document.getElementById('notifOverlay')?.classList.add('hidden');
}

async function markAllRead() {
  try {
    await API.users.markAllRead();
    document.getElementById('notifBadge')?.classList.add('hidden');
    Auth.loadNotifications();
  } catch {}
}

function toggleMobileMenu() {
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.toggle('open');
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#navAvatarWrap')) closeUserMenu();
});
