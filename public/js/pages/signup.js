// ============================================================
//  PokéVault — Sign Up Page
// ============================================================

function renderSignup() {
  if (Auth.isLoggedIn()) {
    setTimeout(() => Router.go('/dashboard'), 0);
    return '<div class="flex-center" style="height:80vh"><div class="spinner spinner-lg"></div></div>';
  }
  return `
    <div class="auth-page">
      <div class="auth-card" style="max-width:520px">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
                 style="filter:drop-shadow(0 0 12px rgba(249,211,56,.4));animation:float 3s ease-in-out infinite">
              <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
              <path d="M 2 30 A 28 28 0 0 1 58 30 Z" fill="#e53e3e"/>
              <path d="M 2 30 A 28 28 0 0 0 58 30 Z" fill="#efefef"/>
              <rect x="2" y="27" width="56" height="6" fill="#111827"/>
              <circle cx="30" cy="30" r="9" fill="#111827"/>
              <circle cx="30" cy="30" r="7" fill="white"/>
              <circle cx="30" cy="30" r="3.5" fill="#111827"/>
              <circle cx="20" cy="18" r="4" fill="white" opacity="0.15"/>
            </svg>
          </div>
          <h1>Join PokéVault</h1>
          <p>Create your free collector account</p>
        </div>

        <div id="signupError"></div>

        <form id="signupForm" onsubmit="handleSignup(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input type="text" name="username" class="form-input" placeholder="CoolCollector99"
                     required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+"
                     autocomplete="username"/>
              <div class="form-hint">3–20 chars, letters/numbers/underscores</div>
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth *</label>
              <input type="date" name="dateOfBirth" class="form-input" required/>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" name="email" class="form-input" placeholder="you@example.com"
                   required autocomplete="email"/>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" name="password" id="signupPassword" class="form-input"
                     placeholder="Min. 8 characters" required minlength="8" autocomplete="new-password"/>
              <div class="form-hint" id="pwdStrength"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password *</label>
              <input type="password" name="confirmPassword" id="confirmPassword" class="form-input"
                     placeholder="Repeat password" required autocomplete="new-password"/>
              <div class="form-hint" id="pwdMatch"></div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg mt-2" id="signupBtn">
            ✨ Create Account
          </button>
        </form>

        <p style="text-align:center;margin-top:1.5rem;color:var(--text3);font-size:.9rem">
          Already have an account? <a href="/login" style="color:var(--yellow);font-weight:700">Log In</a>
        </p>
      </div>
    </div>`;
}

function initSignup() {
  const pwd  = document.getElementById('signupPassword');
  const conf = document.getElementById('confirmPassword');

  pwd?.addEventListener('input', () => {
    const el = document.getElementById('pwdStrength');
    if (!el) return;
    const v = pwd.value;
    if (!v) { el.textContent = ''; return; }
    if (v.length < 8) { el.textContent = '⚠️ Too short'; el.style.color = 'var(--red-lt)'; return; }
    const strength = (v.match(/[A-Z]/) ? 1 : 0) + (v.match(/[0-9]/) ? 1 : 0) + (v.match(/[^a-zA-Z0-9]/) ? 1 : 0);
    const labels = ['🔴 Weak', '🟡 Fair', '🟢 Good', '💪 Strong'];
    const colors = ['var(--red-lt)', 'var(--orange)', 'var(--yellow)', 'var(--green)'];
    el.textContent = labels[strength];
    el.style.color = colors[strength];
  });

  conf?.addEventListener('input', () => {
    const el = document.getElementById('pwdMatch');
    if (!el) return;
    if (!conf.value) { el.textContent = ''; return; }
    const match = pwd.value === conf.value;
    el.textContent = match ? '✅ Passwords match' : '❌ Passwords do not match';
    el.style.color = match ? 'var(--green)' : 'var(--red-lt)';
  });
}

async function handleSignup(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = document.getElementById('signupBtn');
  const errEl = document.getElementById('signupError');
  if (errEl) errEl.innerHTML = '';

  if (form.password.value !== form.confirmPassword.value) {
    if (errEl) errEl.innerHTML = '<div class="error-banner">Passwords do not match.</div>';
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account...';

  try {
    const data = await API.auth.signup({
      username:        form.username.value.trim(),
      email:           form.email.value.trim(),
      dateOfBirth:     form.dateOfBirth.value,
      password:        form.password.value,
      confirmPassword: form.confirmPassword.value,
    });
    Auth.user = data.user;
    Auth.updateNav();
    showToast(`Welcome to PokéVault, ${data.user.username}!`, 'success');
    Router.go('/dashboard');
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="error-banner">${err.message}</div>`;
    btn.disabled  = false;
    btn.innerHTML = '✨ Create Account';
  }
}

window.handleSignup = handleSignup;
