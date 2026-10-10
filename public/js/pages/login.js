// ============================================================
//  PokéVault — Login Page
// ============================================================

function renderLogin() {
  if (Auth.isLoggedIn()) {
    setTimeout(() => Router.go('/dashboard'), 0);
    return '<div class="flex-center" style="height:80vh"><div class="spinner spinner-lg"></div></div>';
  }
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <!-- Proper SVG Pokéball with black center circle -->
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
                 style="filter:drop-shadow(0 0 12px rgba(249,211,56,.4));animation:float 3s ease-in-out infinite">
              <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
              <!-- Top red half -->
              <path d="M 2 30 A 28 28 0 0 1 58 30 Z" fill="#e53e3e"/>
              <!-- Bottom white half -->
              <path d="M 2 30 A 28 28 0 0 0 58 30 Z" fill="#efefef"/>
              <!-- Center black band -->
              <rect x="2" y="27" width="56" height="6" fill="#111827"/>
              <!-- Center button outer (black) -->
              <circle cx="30" cy="30" r="9" fill="#111827"/>
              <!-- Center button white ring -->
              <circle cx="30" cy="30" r="7" fill="white"/>
              <!-- Center button BLACK inner dot -->
              <circle cx="30" cy="30" r="3.5" fill="#111827"/>
              <!-- Shine highlight -->
              <circle cx="20" cy="18" r="4" fill="white" opacity="0.15"/>
            </svg>
          </div>
          <h1 style="margin-top:.5rem">Welcome Back</h1>
          <p>Log in to your PokéVault account</p>
        </div>

        <div id="loginError"></div>

        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" placeholder="you@example.com"
                   required autocomplete="email"/>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div style="position:relative">
              <input type="password" name="password" id="loginPwd" class="form-input"
                     placeholder="••••••••" required autocomplete="current-password"
                     style="padding-right:3rem"/>
              <button type="button" onclick="togglePwd('loginPwd',this)"
                      style="position:absolute;right:.8rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text3);cursor:pointer;font-size:1rem">👁</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg mt-2" id="loginBtn">
            🔓 Log In
          </button>
        </form>

        <p style="text-align:center;margin-top:1.5rem;color:var(--text3);font-size:.9rem">
          Don't have an account? <a href="/signup" style="color:var(--yellow);font-weight:700">Sign Up</a>
        </p>
      </div>
    </div>`;
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

async function handleLogin(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.innerHTML = '';

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Logging in...';

  try {
    const data = await API.auth.login({
      email:    form.email.value.trim(),
      password: form.password.value,
    });
    Auth.user = data.user;
    Auth.updateNav();
    showToast(`Welcome back, ${data.user.username}! 🎉`, 'success');
    Router.go('/dashboard');
  } catch (err) {
    // Suspended account — show full lock screen
    if (err.data?.error === 'suspended') {
      Auth.showSuspendedScreen({
        suspendReason:  err.data.reason,
        suspendedUntil: err.data.suspendedUntil
      });
      return;
    }
    if (errEl) errEl.innerHTML = `<div class="error-banner">${err.message}</div>`;
    btn.disabled  = false;
    btn.innerHTML = '🔓 Log In';
  }
}

window.handleLogin = handleLogin;
window.togglePwd   = togglePwd;
