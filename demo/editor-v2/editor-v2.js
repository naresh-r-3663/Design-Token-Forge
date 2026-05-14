/* ════════════════════════════════════════════════════════════
   Design Token Forge — Editor v2
   Step 1: shell wiring only.
   - Tier rail switching (visual state + section title)
   - Light/Dark mode toggle (button state only; doesn't edit yet)
   - Show CSS names toggle (placeholder, no targets yet)
   - Component picker (placeholder, no preview wiring yet)
   - Discard / Deploy stay disabled until Step 2 introduces edits.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var TIER_META = {
    t0: {
      title: 'Palette',
      sub: 'Your foundation colors. Editing here cascades to roles, surfaces, and every component.'
    },
    t1: {
      title: 'Roles',
      sub: 'Brand, danger, success, warning, info, neutral — the meaning your colors carry.'
    },
    t2: {
      title: 'Surfaces',
      sub: 'Page and section backgrounds. Each surface defines text, components, and outlines that fit on top of it.'
    },
    t3: {
      title: 'Components',
      sub: 'Per-component sizes, spacing and structural tokens. Density, padding, radii.'
    }
  };

  /* ── Tier rail switching ─────────────────────────────── */
  var rail = document.querySelectorAll('.ev2-tier');
  var listTitle = document.getElementById('listTitle');
  var listSub = document.getElementById('listSub');

  rail.forEach(function (btn) {
    btn.addEventListener('click', function () {
      rail.forEach(function (b) { b.removeAttribute('aria-current'); });
      btn.setAttribute('aria-current', 'true');
      var tier = btn.getAttribute('data-tier');
      var meta = TIER_META[tier];
      if (meta) {
        listTitle.textContent = meta.title;
        listSub.textContent = meta.sub;
      }
      // Step 2 will refresh the token list here.
    });
  });

  /* ── Light/Dark editing-mode toggle ──────────────────── */
  var modeBtns = document.querySelectorAll('.ev2-mode');
  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      modeBtns.forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
      btn.setAttribute('aria-checked', 'true');
      var mode = btn.getAttribute('data-mode');
      // Mirror to the page so the chrome reflects what you're editing
      document.documentElement.setAttribute('data-theme', mode);
      // Step 3 will swap which mode block in semantic.css we're editing.
    });
  });

  /* ── Show CSS names toggle (state only for now) ──────── */
  var cssToggle = document.getElementById('showCssNames');
  cssToggle.addEventListener('change', function () {
    document.body.classList.toggle('ev2-show-css', cssToggle.checked);
    // Step 2 will use .ev2-show-css to swap label vs raw var name.
  });

  /* ── Component picker (placeholder) ──────────────────── */
  var pick = document.getElementById('previewComponent');
  var frame = document.getElementById('previewFrame');
  function loadPreview(name) {
    // Step 4 will mount a trimmed preview. For now, route to the existing
    // component demo so the pane isn't empty during shell review.
    frame.src = '../' + name + '.html';
  }
  pick.addEventListener('change', function () { loadPreview(pick.value); });
  loadPreview(pick.value);

  /* ── Draft status placeholder ────────────────────────── */
  var draftStatus = document.getElementById('draftStatus');
  draftStatus.setAttribute('data-state', 'idle');
  draftStatus.querySelector('.ev2-draft-text').textContent = 'Draft branch not yet wired';

  /* ── Save bar placeholders ───────────────────────────── */
  document.getElementById('changeCount').textContent = '0 changes';
  document.getElementById('autosaveStatus').textContent = 'Autosave wires up in Step 6';

  /* ── Toast helper (used in later steps) ──────────────── */
  var toastEl = document.getElementById('ev2Toast');
  var toastTimer = null;
  window.ev2Toast = function (msg, kind) {
    toastEl.textContent = msg;
    toastEl.setAttribute('data-kind', kind || 'ok');
    toastEl.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.removeAttribute('data-show'); }, 2400);
  };
})();
