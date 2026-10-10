// ============================================================
//  PokéVault — Admin Panel
// ============================================================

async function renderAdmin() {
  if (!Auth.isAdmin()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🚫 Access Denied</h1><p>Admin access required.</p></div>
      <a href="/" class="btn btn-primary btn-full">Go Home</a>
    </div></div>`;
  }
  return `
    <div class="page-header">
      <div class="container">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage PokéVault community</p>
      </div>
    </div>
    <div class="section" style="padding-top:1.5rem">
      <div class="container">
        <div class="admin-layout">
          <div class="admin-sidebar">
            <div class="admin-nav-item active" onclick="loadAdminTab('stats',this)">📊 Statistics</div>
            <div class="admin-nav-item" onclick="loadAdminTab('announce',this)">📢 Announcements</div>
            <div class="admin-nav-item" onclick="loadAdminTab('users',this)">👥 Users</div>
            <div class="admin-nav-item" onclick="loadAdminTab('cards',this)">🃏 Cards</div>
            <div class="admin-nav-item" onclick="loadAdminTab('appeals',this)">⚖️ Appeals</div>
            <div class="admin-nav-item" onclick="loadAdminTab('reports',this)">🚩 Reports</div>
          </div>
          <div id="adminContent">
            <div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div>
          </div>
        </div>
      </div>
    </div>`;
}

async function initAdmin() {
  if (!Auth.isAdmin()) return;
  await loadAdminTab('stats');
}

async function loadAdminTab(tab, btn) {
  if (btn) {
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
  }
  const el = document.getElementById('adminContent');
  if (!el) return;
  el.innerHTML = `<div class="flex-center" style="height:200px"><div class="spinner spinner-lg"></div></div>`;

  if (tab === 'stats')    await renderAdminStats(el);
  if (tab === 'announce') await renderAdminAnnouncements(el);
  if (tab === 'users')    await renderAdminUsers(el);
  if (tab === 'cards')    await renderAdminCards(el);
  if (tab === 'appeals')  await renderAdminAppeals(el);
  if (tab === 'reports')  await renderAdminReports(el);
}

// ── Stats ──────────────────────────────────────────────────
async function renderAdminStats(el) {
  try {
    const d = await API.admin.stats();
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">📊 Platform Statistics</h2>
      <div class="stats-cards">
        ${[
          ['👥', d.totalUsers,           'Total Users'],
          ['🃏', d.totalCards,           'Total Cards'],
          ['🔄', d.totalTrades,          'Total Trades'],
          ['🔨', d.totalAuctions,        'Total Auctions'],
          ['🚩', d.pendingReports,       'Pending Reports'],
          ['📢', d.activeAnnouncements,  'Live Announcements'],
        ].map(([icon,val,name]) => `
          <div class="stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-val">${val}</div>
            <div class="stat-name">${name}</div>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

// ── Announcements ──────────────────────────────────────────
async function renderAdminAnnouncements(el) {
  try {
    const data = await API.admin.announcements();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <h2>📢 Announcements</h2>
        <button class="btn btn-primary btn-sm" onclick="openCreateAnnModal()">+ New Announcement</button>
      </div>
      <div style="background:var(--bg3);border:1px solid rgba(249,211,56,.2);border-radius:var(--radius);padding:1rem;margin-bottom:1.5rem;font-size:.85rem;color:var(--text2)">
        💡 Announcements are sent live to <strong>all users</strong> as notifications and shown as a banner on the home page.
      </div>
      <div style="display:flex;flex-direction:column;gap:.8rem" id="annList">
        ${data.announcements.length ? data.announcements.map(a => renderAnnCard(a)).join('') :
          '<div class="empty-state"><div class="empty-icon">📢</div><h3>No active announcements</h3></div>'}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

function renderAnnCard(a) {
  const colors = { info:'var(--blue)', warning:'var(--orange)', success:'var(--green)', danger:'var(--red)' };
  const icons  = { info:'ℹ️', warning:'⚠️', success:'✅', danger:'🚨' };
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-left:4px solid ${colors[a.type]||'var(--blue)'};border-radius:var(--radius);padding:1.2rem;display:flex;justify-content:space-between;align-items:start;gap:1rem">
      <div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
          <span>${icons[a.type]||'ℹ️'}</span>
          <strong style="font-size:1rem">${a.title}</strong>
          <span style="font-size:.72rem;color:var(--text3)">${timeAgo(a.createdAt)}</span>
          ${a.expiresAt ? `<span style="font-size:.72rem;color:var(--orange)">Expires ${formatDate(a.expiresAt)}</span>` : ''}
        </div>
        <p style="font-size:.88rem;color:var(--text2)">${a.message}</p>
      </div>
      <button class="btn btn-danger btn-sm" style="flex-shrink:0" onclick="deleteAnnouncement('${a._id}')">Remove</button>
    </div>`;
}

function openCreateAnnModal() {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-2">📢 New Announcement</h2>
    <p style="color:var(--text3);font-size:.85rem;margin-bottom:1.2rem">This will be sent to ALL users as a notification immediately.</p>
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input type="text" id="annTitle" class="form-input" placeholder="e.g. Server Maintenance Tonight"/>
    </div>
    <div class="form-group">
      <label class="form-label">Message *</label>
      <textarea id="annMessage" class="form-textarea" placeholder="Write your announcement..." style="min-height:100px"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select id="annType" class="form-select">
          <option value="info">ℹ️ Info</option>
          <option value="warning">⚠️ Warning</option>
          <option value="success">✅ Success</option>
          <option value="danger">🚨 Alert</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Expires (optional)</label>
        <input type="datetime-local" id="annExpires" class="form-input"/>
      </div>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitAnnouncement()">📢 Send to All Users</button>
  `);
}

async function submitAnnouncement() {
  const title     = document.getElementById('annTitle')?.value.trim();
  const message   = document.getElementById('annMessage')?.value.trim();
  const type      = document.getElementById('annType')?.value;
  const expiresAt = document.getElementById('annExpires')?.value;

  if (!title || !message) { showToast('Title and message are required', 'warning'); return; }

  try {
    await API.admin.createAnn({ title, message, type, expiresAt: expiresAt || null });
    forceCloseModal();
    showToast(`Announcement sent to all users!`, 'success');
    loadAdminTab('announce');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Remove this announcement?')) return;
  try {
    await API.admin.deleteAnn(id);
    showToast('Announcement removed', 'success');
    loadAdminTab('announce');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Users ──────────────────────────────────────────────────
async function renderAdminUsers(el) {
  try {
    const data = await API.admin.users();
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">👥 Users (${data.users.length})</h2>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr>
            <th>User</th><th>Email</th><th>Joined</th><th>Points</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:.6rem">
                    <img src="${u.avatar||'/img/default-avatar.svg'}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.src='/img/default-avatar.svg'"/>
                    <div>
                      <div style="font-weight:700">${u.username}</div>
                      ${u.isAdmin ? '<span style="font-size:.7rem;color:var(--orange)">⚙️ Admin</span>' : ''}
                    </div>
                  </div>
                </td>
                <td style="font-size:.82rem">${u.email||'—'}</td>
                <td style="font-size:.82rem">${formatDate(u.createdAt)}</td>
                <td style="color:var(--yellow);font-family:'Orbitron',sans-serif;font-size:.82rem">${u.points||0}</td>
                <td>
                  <span style="font-size:.75rem;font-weight:700;color:${u.isSuspended?'var(--red-lt)':'var(--green)'}">
                    ${u.isSuspended ? `🔴 Suspended${u.suspendedUntil ? ' until '+formatDate(u.suspendedUntil) : ''}` : '🟢 Active'}
                  </span>
                </td>
                <td>
                  <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                    ${u.isSuspended
                      ? `<button class="btn btn-sm btn-green" onclick="adminUnsuspend('${u._id}')">Unsuspend</button>`
                      : `<button class="btn btn-sm btn-danger" onclick="openSuspendModal('${u._id}','${u.username}')">Suspend</button>`}
                    ${!u.isAdmin ? `<button class="btn btn-sm btn-secondary" onclick="adminMakeAdmin('${u._id}','${u.username}')">Make Admin</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

function openSuspendModal(userId, username) {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">🔴 Suspend User</h2>
    <p style="color:var(--text2);margin-bottom:1.2rem">Suspending: <strong>${username}</strong></p>
    <div class="form-group">
      <label class="form-label">Duration</label>
      <select id="suspendDuration" class="form-select">
        <option value="">Permanent</option>
        <option value="1">1 Hour</option>
        <option value="6">6 Hours</option>
        <option value="24">1 Day</option>
        <option value="72">3 Days</option>
        <option value="168">1 Week</option>
        <option value="720">30 Days</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Reason</label>
      <input type="text" id="suspendReason" class="form-input" placeholder="e.g. Spamming, inappropriate content..."/>
    </div>
    <button class="btn btn-danger btn-full" onclick="adminSuspend('${userId}')">🔴 Confirm Suspend</button>
  `);
}

async function adminSuspend(userId) {
  const hours  = document.getElementById('suspendDuration')?.value;
  const reason = document.getElementById('suspendReason')?.value;
  try {
    const data = await API.admin.suspendTimed(userId, hours ? parseInt(hours) : null, reason);
    forceCloseModal();
    showToast(data.message, 'success');
    loadAdminTab('users');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminUnsuspend(userId) {
  try {
    const data = await API.admin.suspend(userId);
    showToast(data.message, 'success');
    loadAdminTab('users');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminMakeAdmin(userId, username) {
  if (!confirm(`Promote ${username} to admin? This cannot be undone.`)) return;
  try {
    await API.admin.makeAdmin(userId);
    showToast(`${username} is now an admin`, 'success');
    loadAdminTab('users');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Cards ──────────────────────────────────────────────────
async function renderAdminCards(el) {
  try {
    const data = await API.cards.list({ limit: 50 });
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">🃏 All Cards (${data.total})</h2>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>Card</th><th>Owner</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.cards.map(c => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:.6rem">
                    <img src="${c.imageUrl}" style="width:36px;height:48px;object-fit:cover;border-radius:4px" onerror="this.src='/img/card-placeholder.svg'"/>
                    <span style="font-weight:700;font-size:.85rem">${c.title}</span>
                  </div>
                </td>
                <td style="font-size:.82rem">${c.ownerUsername||'?'}</td>
                <td style="font-size:.82rem">${c.condition}</td>
                <td>
                  <span style="font-size:.75rem;font-weight:700;color:${c.isSuspended?'var(--orange)':'var(--green)'}">
                    ${c.isSuspended ? '🟠 Suspended' : '🟢 Active'}
                  </span>
                </td>
                <td>
                  <div style="display:flex;gap:.4rem">
                    <button class="btn btn-sm ${c.isSuspended?'btn-green':'btn-secondary'}" onclick="adminSuspendCard('${c._id}')">
                      ${c.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDeleteCard('${c._id}','${c.title}')">Delete</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function adminSuspendCard(cardId) {
  try {
    const data = await API.admin.suspendCard(cardId);
    showToast(data.message, 'success');
    loadAdminTab('cards');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminDeleteCard(cardId, title) {
  if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
  try {
    await API.admin.deleteCard(cardId);
    showToast('Card deleted', 'success');
    loadAdminTab('cards');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Reports ────────────────────────────────────────────────
async function renderAdminReports(el) {
  try {
    const data = await API.admin.reports();
    if (!data.reports.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🚩</div><h3>No reports</h3><p>The community is well-behaved!</p></div>`;
      return;
    }
    el.innerHTML = `
      <h2 style="margin-bottom:1.5rem">🚩 Reports (${data.reports.length})</h2>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        ${data.reports.map(r => `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem;display:flex;justify-content:space-between;align-items:start;gap:1rem">
            <div>
              <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.3rem;flex-wrap:wrap">
                <strong>${r.reason}</strong>
                <span style="font-size:.75rem;color:var(--text3)">${r.targetType} · ${timeAgo(r.createdAt)}</span>
                <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;background:${r.status==='pending'?'rgba(249,211,56,.2)':'rgba(72,187,120,.2)'};color:${r.status==='pending'?'var(--yellow)':'var(--green)'}">
                  ${r.status}
                </span>
              </div>
              ${r.description ? `<p style="font-size:.85rem;color:var(--text2)">${r.description}</p>` : ''}
              <p style="font-size:.75rem;color:var(--text3)">Target ID: ${r.targetId}</p>
            </div>
            ${r.status==='pending' ? `<button class="btn btn-sm btn-green" onclick="resolveReport('${r._id}')">✅ Resolve</button>` : ''}
          </div>`).join('')}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

async function resolveReport(reportId) {
  try {
    await API.admin.resolve(reportId);
    showToast('Report resolved', 'success');
    loadAdminTab('reports');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Appeals ────────────────────────────────────────────────
async function renderAdminAppeals(el) {
  try {
    const data = await API.appeals.list();
    const pending  = data.appeals.filter(a => a.status === 'pending');
    const resolved = data.appeals.filter(a => a.status !== 'pending');

    el.innerHTML = `
      <h2 style="margin-bottom:.5rem">⚖️ Suspension Appeals</h2>
      <p style="color:var(--text3);font-size:.85rem;margin-bottom:1.5rem">${pending.length} pending · ${resolved.length} resolved</p>

      ${pending.length === 0 && resolved.length === 0
        ? `<div class="empty-state"><div class="empty-icon">⚖️</div><h3>No appeals yet</h3><p>Suspended users can submit appeals from the lock screen.</p></div>`
        : ''}

      ${pending.length > 0 ? `
        <h3 style="margin-bottom:1rem;color:var(--yellow);font-size:1rem">🟡 Pending (${pending.length})</h3>
        <div style="display:flex;flex-direction:column;gap:.8rem;margin-bottom:2rem">
          ${pending.map(a => renderAppealCard(a)).join('')}
        </div>` : ''}

      ${resolved.length > 0 ? `
        <h3 style="margin-bottom:1rem;color:var(--text3);font-size:1rem">Resolved (${resolved.length})</h3>
        <div style="display:flex;flex-direction:column;gap:.8rem">
          ${resolved.map(a => renderAppealCard(a)).join('')}
        </div>` : ''}`;
  } catch (err) {
    el.innerHTML = `<div class="error-banner">${err.message}</div>`;
  }
}

function renderAppealCard(a) {
  const statusColor = { pending:'var(--yellow)', approved:'var(--green)', rejected:'var(--red-lt)' };
  const statusIcon  = { pending:'🟡', approved:'✅', rejected:'❌' };
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-left:3px solid ${statusColor[a.status]||'var(--border)'};border-radius:var(--radius);padding:1.2rem">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:1rem;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.4rem;flex-wrap:wrap">
            <span style="font-weight:800">${a.username}</span>
            <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;background:${statusColor[a.status]}22;color:${statusColor[a.status]}">${statusIcon[a.status]} ${a.status}</span>
            <span style="font-size:.72rem;color:var(--text3)">${timeAgo(a.createdAt)}</span>
          </div>
          <p style="font-size:.9rem;color:var(--text2);background:var(--bg3);border-radius:var(--radius-sm);padding:.7rem .9rem;font-style:italic">"${a.message}"</p>
          ${a.adminNote ? `<p style="font-size:.78rem;color:var(--text3);margin-top:.4rem">Admin note: ${a.adminNote}</p>` : ''}
        </div>
        ${a.status === 'pending' ? `
          <div style="display:flex;flex-direction:column;gap:.5rem;flex-shrink:0">
            <button class="btn btn-green btn-sm" onclick="openApproveModal('${a._id}','${a.username}')">✅ Approve</button>
            <button class="btn btn-danger btn-sm" onclick="openRejectModal('${a._id}','${a.username}')">❌ Reject</button>
          </div>` : ''}
      </div>
    </div>`;
}

function openApproveModal(id, username) {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">✅ Approve Appeal</h2>
    <p style="color:var(--text2);margin-bottom:1rem">Approving will <strong>unsuspend ${username}</strong> immediately.</p>
    <div class="form-group">
      <label class="form-label">Note to user (optional)</label>
      <input type="text" id="appealNote" class="form-input" placeholder="e.g. We've reviewed your case and reinstated your account."/>
    </div>
    <button class="btn btn-green btn-full" onclick="resolveAppeal('${id}','approve')">✅ Confirm Approve</button>
  `);
}

function openRejectModal(id, username) {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="mb-1">❌ Reject Appeal</h2>
    <p style="color:var(--text2);margin-bottom:1rem">The suspension for <strong>${username}</strong> will remain.</p>
    <div class="form-group">
      <label class="form-label">Reason for rejection *</label>
      <input type="text" id="appealNote" class="form-input" placeholder="e.g. Repeated violations of community rules."/>
    </div>
    <button class="btn btn-danger btn-full" onclick="resolveAppeal('${id}','reject')">❌ Confirm Reject</button>
  `);
}

async function resolveAppeal(id, action) {
  const note = document.getElementById('appealNote')?.value.trim();
  try {
    if (action === 'approve') await API.appeals.approve(id, note);
    else                      await API.appeals.reject(id, note);
    forceCloseModal();
    showToast(`Appeal ${action === 'approve' ? 'approved — user unsuspended' : 'rejected'}`, action === 'approve' ? 'success' : 'info');
    loadAdminTab('appeals');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Expose globals
window.loadAdminTab        = loadAdminTab;
window.openCreateAnnModal  = openCreateAnnModal;
window.submitAnnouncement  = submitAnnouncement;
window.deleteAnnouncement  = deleteAnnouncement;
window.openSuspendModal    = openSuspendModal;
window.adminSuspend        = adminSuspend;
window.adminUnsuspend      = adminUnsuspend;
window.adminMakeAdmin      = adminMakeAdmin;
window.adminSuspendCard    = adminSuspendCard;
window.adminDeleteCard     = adminDeleteCard;
window.resolveReport       = resolveReport;
window.openApproveModal    = openApproveModal;
window.openRejectModal     = openRejectModal;
window.resolveAppeal       = resolveAppeal;
