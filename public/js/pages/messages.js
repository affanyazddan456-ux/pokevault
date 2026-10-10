// ============================================================
//  PokéVault — Messages / Chat Page
// ============================================================

let _chatPartnerId   = null;
let _chatPollTimer   = null;
let _lastMessageCount = 0;

async function renderMessages({ partnerId } = {}) {
  if (!Auth.isLoggedIn()) {
    return `<div class="auth-page"><div class="auth-card">
      <div class="auth-header"><h1>🔒 Login Required</h1></div>
      <a href="/login" class="btn btn-primary btn-full">Log In</a>
    </div></div>`;
  }
  return `
    <div class="page-header"><div class="container"><h1>💬 Messages</h1><p>Chat with other collectors</p></div></div>
    <div class="section" style="padding-top:1rem">
      <div class="container">
        <div style="display:grid;grid-template-columns:280px 1fr;gap:1.5rem;align-items:start;min-height:600px">
          <!-- Conversations list -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
            <div style="padding:.8rem 1rem;border-bottom:1px solid var(--border);font-weight:800;font-size:.9rem;color:var(--text2)">Conversations</div>
            <div id="convList" style="max-height:600px;overflow-y:auto">
              <div class="flex-center" style="height:100px"><div class="spinner"></div></div>
            </div>
          </div>
          <!-- Chat panel -->
          <div id="chatPanel" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-direction:column;min-height:600px">
            <div class="flex-center" style="flex:1;color:var(--text3)">
              <div style="text-align:center">
                <div style="font-size:3rem;margin-bottom:1rem">💬</div>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

async function initMessages({ partnerId } = {}) {
  if (!Auth.isLoggedIn()) return;
  if (_chatPollTimer) clearInterval(_chatPollTimer);
  await loadConversations();
  if (partnerId) openChat(partnerId);
}

async function loadConversations() {
  const el = document.getElementById('convList');
  if (!el) return;
  try {
    const data = await API.messages.conversations();
    if (!data.conversations.length) {
      el.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text3);font-size:.85rem">No conversations yet</div>`;
      return;
    }
    el.innerHTML = data.conversations.map(c => `
      <div class="conv-item ${c.partnerId === _chatPartnerId ? 'active' : ''}"
           onclick="openChat('${c.partnerId}')"
           style="display:flex;align-items:center;gap:.7rem;padding:.8rem 1rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s;${c.partnerId === _chatPartnerId ? 'background:var(--surface2)' : ''}">
        <img src="${c.partnerAvatar || '/img/default-avatar.svg'}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.src='/img/default-avatar.svg'"/>
        <div style="min-width:0;flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700;font-size:.88rem">${c.partnerUsername}</span>
            ${c.unread > 0 ? `<span style="background:var(--red);color:#fff;border-radius:999px;font-size:.65rem;font-weight:800;padding:.1rem .45rem">${c.unread}</span>` : ''}
          </div>
          <div style="font-size:.75rem;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.lastMessage || '...'}</div>
          ${c.contextTitle ? `<div style="font-size:.7rem;color:var(--yellow)">re: ${c.contextTitle}</div>` : ''}
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="error-banner" style="margin:.5rem">${err.message}</div>`;
  }
}

async function openChat(partnerId) {
  _chatPartnerId = partnerId;
  if (_chatPollTimer) clearInterval(_chatPollTimer);

  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  panel.innerHTML = `<div class="flex-center" style="flex:1"><div class="spinner spinner-lg"></div></div>`;

  try {
    const data   = await API.messages.get(partnerId);
    const partner = data.partner;
    _lastMessageCount = data.messages.length;

    panel.innerHTML = `
      <!-- Chat header -->
      <div style="padding:.8rem 1.2rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.7rem;flex-shrink:0">
        <img src="${partner?.avatar || '/img/default-avatar.svg'}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src='/img/default-avatar.svg'"/>
        <div>
          <div style="font-weight:800">${partner?.username || 'User'}</div>
          <a href="/profile/${partnerId}" style="font-size:.75rem;color:var(--blue)">View Profile →</a>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="openReportModal('user','${partnerId}')">🚩 Report</button>
      </div>
      <!-- Messages -->
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem">
        ${renderMessages_list(data.messages)}
      </div>
      <!-- Input -->
      <div style="padding:.8rem 1rem;border-top:1px solid var(--border);display:flex;gap:.6rem;flex-shrink:0">
        <input type="text" id="chatInput" class="form-input" placeholder="Type a message..."
               style="flex:1" onkeydown="if(event.key==='Enter')sendMessage('${partnerId}')"/>
        <button class="btn btn-primary" onclick="sendMessage('${partnerId}')">Send</button>
      </div>`;

    // Scroll to bottom
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    // Poll for new messages every 4 seconds
    _chatPollTimer = setInterval(() => pollMessages(partnerId), 4000);

    // Refresh conversation list to clear unread badges
    loadConversations();

  } catch (err) {
    panel.innerHTML = `<div class="flex-center" style="flex:1"><div class="error-banner">${err.message}</div></div>`;
  }
}

function renderMessages_list(messages) {
  if (!messages.length) return `<div style="text-align:center;color:var(--text3);font-size:.85rem;padding:2rem">No messages yet. Say hello!</div>`;
  const myId = Auth.user?._id;
  return messages.map(m => {
    const isMe = m.fromId === myId;
    return `
      <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'}">
        ${m.contextTitle ? `<div style="font-size:.72rem;color:var(--yellow);margin-bottom:.2rem;${isMe?'text-align:right':''}">📎 ${m.contextTitle}</div>` : ''}
        <div style="background:${isMe ? 'linear-gradient(135deg,var(--yellow),var(--yellow-lt))' : 'var(--surface2)'};color:${isMe ? '#111' : 'var(--text)'};padding:.5rem .9rem;border-radius:${isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};max-width:70%;font-size:.9rem;word-break:break-word">
          ${m.text}
        </div>
        <div style="font-size:.68rem;color:var(--text3);margin-top:.15rem">${timeAgo(m.createdAt)}</div>
      </div>`;
  }).join('');
}

async function pollMessages(partnerId) {
  if (!document.getElementById('chatMessages')) {
    clearInterval(_chatPollTimer);
    return;
  }
  try {
    const data = await API.messages.get(partnerId);
    if (data.messages.length !== _lastMessageCount) {
      _lastMessageCount = data.messages.length;
      const msgs = document.getElementById('chatMessages');
      if (msgs) {
        msgs.innerHTML = renderMessages_list(data.messages);
        msgs.scrollTop = msgs.scrollHeight;
      }
      loadConversations();
    }
  } catch {}
}

async function sendMessage(partnerId) {
  const input = document.getElementById('chatInput');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  try {
    await API.messages.send(partnerId, { text });
    pollMessages(partnerId);
  } catch (err) {
    showToast(err.message, 'error');
    input.value = text; // restore on fail
  }
}

// Open chat from anywhere (e.g. after winning auction / buy)
function openChatWith(partnerId, contextType, contextId, contextTitle) {
  if (!Auth.isLoggedIn()) { Router.go('/login'); return; }
  // Navigate to messages with this partner
  _pendingChatContext = { contextType, contextId, contextTitle };
  Router.go(`/messages/${partnerId}`);
}

let _pendingChatContext = null;

window.openChat        = openChat;
window.sendMessage     = sendMessage;
window.openChatWith    = openChatWith;
window.loadConversations = loadConversations;
