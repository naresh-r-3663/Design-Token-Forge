/* demo/auth-gate.js — universal PAT gate for the DTF demo + editor.
 *
 * Goal: nothing in /demo/ renders or talks to GitHub until the visitor
 * proves they hold a valid GitHub Personal Access Token. Without a PAT
 * the page shows ONLY the unlock card — the project list, the editor
 * UI, the components catalogue are all blanked out.
 *
 * Why client-side (and what it does NOT do):
 *   - The site is hosted on GitHub Pages, so the HTML/JS source is
 *     publicly readable; we cannot make that private from a static
 *     host. What we can do is refuse to render the UI, refuse to fetch
 *     projects.json, and refuse to expose the editor controls until
 *     /user returns 200 for the supplied PAT.
 *   - The PAT itself is the gate. If the visitor does not own one
 *     against this repo's owner, there is nothing for them to see.
 *
 * Session model:
 *   - localStorage 'dtf-gh-pat'    — the actual token (persistent so
 *     the user is not re-prompted on every navigation).
 *   - sessionStorage 'dtf-auth-ok' — "this tab has verified the PAT
 *     against GitHub in this browser session". Cleared on browser
 *     close, which forces a fresh /user check next visit.
 *
 * Page integration:
 *   - This script MUST be loaded as the first <script> in <head>,
 *     WITHOUT defer/async, so the body-hiding style lands before any
 *     content paints (no flash of project list).
 *   - Pages that need to wait for auth before doing work (eg. the hub
 *     fetching projects.json) should await window.DTF_AUTH_READY.
 */
(function () {
  'use strict';

  /* If the gate already ran on this page (eg. accidentally included
     twice), do nothing. */
  if (window.__dtfAuthGateLoaded) return;
  window.__dtfAuthGateLoaded = true;

  var PAT_KEY      = 'dtf-gh-pat';
  var USER_KEY     = 'dtf-gh-user';
  var OWNER_KEY    = 'dtf-gh-owner';
  var SESSION_KEY  = 'dtf-auth-ok';
  var EPOCH_KEY    = 'dtf-session-epoch';
  var SESSION_EPOCH = '2';            /* bump to force-sign-out every visitor */
  var REPO_OWNER   = 'sridhar-ravi-2917';   /* canonical repo owner */
  var REPO_NAME    = 'Design-Token-Forge';

  /* ── One-time wipe of stale per-user state on epoch bump. ──────
     When SESSION_EPOCH increments we forcibly clear every visitor's
     PAT, owner, active-project, and per-project token caches so they
     re-authenticate fresh and land in THEIR OWN fork — not whatever
     owner was previously cached (the canonical fix for the bug where
     returning visitors accidentally saw the original maintainer's
     project list). */
  try {
    if (localStorage.getItem(EPOCH_KEY) !== SESSION_EPOCH) {
      var wipeExact = [PAT_KEY, USER_KEY, OWNER_KEY, 'dtf-active-project',
        'dtf-known-projects', 'dtf-mig-unscoped-tokens-purged',
        'dtf-saved-tokens'];
      wipeExact.forEach(function (k) { try { localStorage.removeItem(k); } catch (_e) {} });
      /* All per-project token caches use the dtf-saved-tokens-<id> shape. */
      try {
        var toDrop = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('dtf-saved-tokens-') === 0) toDrop.push(k);
        }
        toDrop.forEach(function (k) { localStorage.removeItem(k); });
      } catch (_e) {}
      try { sessionStorage.removeItem(SESSION_KEY); } catch (_e) {}
      localStorage.setItem(EPOCH_KEY, SESSION_EPOCH);
    }
  } catch (_e) {}

  /* ── Hide everything until the gate decides. ───────────────────
     We can't toggle <body> yet (parser hasn't reached it), so we
     inject a style rule into <head>. Once we know the verdict we
     either swap the rule for a no-op (verified) or leave it in
     place and mount the overlay (locked). */
  var styleEl = document.createElement('style');
  styleEl.id = 'dtf-auth-gate-style';
  styleEl.textContent =
    /* Hide body content entirely so a casual screenshot reveals
       nothing. Overlay is rendered above this and uses its own
       visibility:visible on the form. */
    'body > *:not(.dtf-auth-overlay){visibility:hidden!important}' +
    'html.dtf-auth-locked,body.dtf-auth-locked{overflow:hidden!important}' +
    '.dtf-auth-overlay{position:fixed;inset:0;z-index:2147483647;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:rgba(15,17,21,.85);backdrop-filter:blur(12px);' +
      '-webkit-backdrop-filter:blur(12px);' +
      'font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#fff}' +
    '.dtf-auth-card{background:#1a1d23;border:1px solid #2b2f37;' +
      'border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.45);' +
      'padding:32px 36px;width:380px;max-width:92vw;text-align:center;' +
      'animation:dtfAuthIn .35s ease}' +
    '@keyframes dtfAuthIn{from{opacity:0;transform:translateY(16px) scale(.96)}' +
      'to{opacity:1;transform:none}}' +
    '.dtf-auth-card .dtf-auth-icon{font-size:40px;margin-bottom:8px;line-height:1}' +
    '.dtf-auth-card h2{font-size:18px;font-weight:700;margin:0 0 4px;color:#fff}' +
    '.dtf-auth-sub{font-size:13px;color:#9aa0a6;margin:0 0 20px}' +
    '.dtf-auth-input-wrap{position:relative;margin-bottom:14px}' +
    '.dtf-auth-input{width:100%;padding:10px 42px 10px 14px;border:2px solid #2b2f37;' +
      'border-radius:6px;font-size:14px;font-family:ui-monospace,SFMono-Regular,monospace;' +
      'background:#0f1115;color:#fff;letter-spacing:.04em;box-sizing:border-box;' +
      'transition:border-color .15s}' +
    '.dtf-auth-input:focus{outline:none;border-color:#286CE5}' +
    '.dtf-auth-input.dtf-err{border-color:#DC2626;animation:dtfAuthShake .4s ease}' +
    '@keyframes dtfAuthShake{0%,100%{transform:translateX(0)}' +
      '20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
    '.dtf-auth-vis{position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
      'background:none;border:none;cursor:pointer;font-size:16px;color:#9aa0a6;' +
      'padding:4px;line-height:1}' +
    '.dtf-auth-submit{width:100%;padding:10px;border:none;border-radius:6px;' +
      'background:#286CE5;color:#fff;font-size:14px;font-weight:700;cursor:pointer;' +
      'font-family:inherit;transition:filter .15s}' +
    '.dtf-auth-submit:hover{filter:brightness(1.1)}' +
    '.dtf-auth-submit:disabled{opacity:.6;cursor:wait}' +
    '.dtf-auth-msg{font-size:12px;color:#DC2626;margin-top:8px;min-height:16px}' +
    '.dtf-auth-msg.ok{color:#86efac}' +
    '.dtf-auth-hint{font-size:11px;color:#6b7280;margin-top:16px;line-height:1.5}' +
    '.dtf-auth-hint a{color:#9CB7FF}' +
    '.dtf-auth-hint code{background:rgba(255,255,255,.08);padding:1px 5px;' +
      'border-radius:3px;font-size:11px}';
  (document.head || document.documentElement).appendChild(styleEl);
  document.documentElement.classList.add('dtf-auth-locked');

  /* ── Promise other modules can await. ────────────────────── */
  var resolveReady;
  window.DTF_AUTH_READY = new Promise(function (r) { resolveReady = r; });

  function release(user) {
    /* Verified — drop the hiding rule and remove the locked class so
       the page paints normally. */
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    document.documentElement.classList.remove('dtf-auth-locked');
    if (document.body) document.body.classList.remove('dtf-auth-locked');
    var overlay = document.querySelector('.dtf-auth-overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    /* Expose what we learned. */
    window.DTF_AUTH = { ok: true, user: user || null };
    resolveReady({ ok: true, user: user || null });
    try {
      document.dispatchEvent(new CustomEvent('dtf-auth-ready', { detail: { user: user } }));
    } catch (_e) {}
  }

  /* Fast path: this tab already verified the PAT during this session.
     Trust that — the user just navigated between demo pages. */
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1' && localStorage.getItem(PAT_KEY)) {
      release(localStorage.getItem(USER_KEY) || null);
      return;
    }
  } catch (_e) {}

  /* Mount the overlay early. We use document.documentElement so it
     exists even before <body> is parsed. */
  function mountOverlay() {
    if (document.querySelector('.dtf-auth-overlay')) return;
    var host = document.body || document.documentElement;
    var wrap = document.createElement('div');
    wrap.className = 'dtf-auth-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'dtf-auth-title');
    wrap.innerHTML =
      '<div class="dtf-auth-card">' +
        '<div class="dtf-auth-icon" aria-hidden="true">\uD83D\uDD12</div>' +
        '<h2 id="dtf-auth-title">Sign in to Design Token Forge</h2>' +
        '<p class="dtf-auth-sub">A GitHub Personal Access Token is required to view projects and use the editor.</p>' +
        '<form id="dtfAuthForm" autocomplete="off" novalidate>' +
          '<div class="dtf-auth-input-wrap">' +
            '<input type="password" class="dtf-auth-input" id="dtfAuthInput" ' +
              'placeholder="ghp_\u2026 or github_pat_\u2026" autofocus spellcheck="false" ' +
              'autocomplete="off" autocapitalize="off">' +
            '<button type="button" class="dtf-auth-vis" id="dtfAuthVis" ' +
              'title="Show / hide" aria-label="Toggle visibility">\uD83D\uDC41</button>' +
          '</div>' +
          '<button type="submit" class="dtf-auth-submit" id="dtfAuthSubmit">Unlock</button>' +
          '<div class="dtf-auth-msg" id="dtfAuthMsg" role="status" aria-live="polite"></div>' +
        '</form>' +
        '<p class="dtf-auth-hint">Need a token? ' +
          '<a href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=DTF+Editor" ' +
            'target="_blank" rel="noopener">Create one with <code>repo</code> + <code>workflow</code> scope \u2192</a>' +
        '</p>' +
      '</div>';
    host.appendChild(wrap);
    wireForm(wrap);
  }

  function wireForm(root) {
    var form  = root.querySelector('#dtfAuthForm');
    var input = root.querySelector('#dtfAuthInput');
    var vis   = root.querySelector('#dtfAuthVis');
    var msg   = root.querySelector('#dtfAuthMsg');
    var btn   = root.querySelector('#dtfAuthSubmit');

    /* Auto-fill from a previously stored PAT — saves the user the
       re-paste when the session expired but they're still on the
       same device. We still re-verify against GitHub before unlocking. */
    var stored = '';
    try { stored = localStorage.getItem(PAT_KEY) || ''; } catch (_e) {}
    if (stored) {
      input.value = stored;
      verify(stored, true);
    }

    vis.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      vis.textContent = show ? '\uD83D\uDE48' : '\uD83D\uDC41';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phrase = (input.value || '').trim();
      if (!phrase) { showErr('Please enter your GitHub PAT'); return; }
      if (!(phrase.indexOf('ghp_') === 0 || phrase.indexOf('github_pat_') === 0)) {
        showErr('Token must start with ghp_ or github_pat_');
        return;
      }
      verify(phrase, false);
    });

    function showErr(text) {
      msg.textContent = text;
      msg.classList.remove('ok');
      input.classList.add('dtf-err');
      setTimeout(function () { input.classList.remove('dtf-err'); }, 500);
    }

    function showOk(text) {
      msg.textContent = text;
      msg.classList.add('ok');
    }

    function verify(token, silent) {
      btn.disabled = true;
      btn.textContent = silent ? 'Re-checking\u2026' : 'Verifying\u2026';
      if (!silent) msg.textContent = '';
      fetch('https://api.github.com/user', {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json'
        }
      }).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }).then(function (user) {
        try {
          localStorage.setItem(PAT_KEY, token);
          localStorage.setItem(USER_KEY, user.login || '');
          /* Owner = the signed-in user's OWN GitHub login. This is what
             makes the project dropdown read from their fork instead of
             the canonical maintainer's repo. We always overwrite with
             the verified user.login so a stale owner can never leak. */
          if (user.login) {
            localStorage.setItem(OWNER_KEY, user.login);
          }
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch (_e) {}
        showOk('Welcome, ' + (user.login || 'user') + ' \u2014 unlocking\u2026');
        setTimeout(function () { release(user); }, 200);
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Unlock';
        /* If silent re-check failed, clear the stale stored token so
           the next submit starts clean. */
        if (silent) {
          try { sessionStorage.removeItem(SESSION_KEY); } catch (_e) {}
          msg.textContent = '';
          return;
        }
        showErr('Invalid PAT \u2014 check the token has repo scope and is not expired');
      });
    }
  }

  /* The overlay needs <body> to attach. If we're early enough that
     body doesn't exist yet, wait for it. */
  if (document.body) {
    mountOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', mountOverlay, { once: true });
  }

  /* Expose a logout helper so the topbar / settings UI can wire a
     "sign out" affordance without re-implementing the storage layout. */
  window.DtfAuthLogout = function () {
    try {
      localStorage.removeItem(PAT_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(OWNER_KEY);
      localStorage.removeItem('dtf-active-project');
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_e) {}
    location.reload();
  };
})();
