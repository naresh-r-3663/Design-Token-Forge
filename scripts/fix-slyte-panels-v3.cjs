#!/usr/bin/env node
/**
 * Definitive fix:
 * - Slyte panel was being placed OUTSIDE <div class="fw-snippet"> on all div-style pages
 * - Fix: inject immediately after the CSS panel's own closing </div>, which keeps
 *   the Slyte panel as a sibling inside fw-snippet (same as react/vue/html/css panels)
 * - Also ensures Slyte is first tab + default active on all pages
 *
 * Pre-style pages (card/divider/kbd/skeleton/spinner) are already correct — skip them.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const DEMO = path.join(__dirname, '../demo');

const SNIPPETS = {
  _TEMPLATE:        `import { DtfComponent } from '@design-token-forge/slyte';\n\n<dtf-component\n  lt-prop-variant="filled"\n  lt-prop-color-role="brand"\n  lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">Content</template>\n</dtf-component>`,
  alert:            `import { DtfAlert } from '@design-token-forge/slyte';\n\n<dtf-alert\n  lt-prop-color-role="success"\n  lt-prop-variant="soft"\n  lt-prop-title="Saved!"\n  lt-prop-dismissible="true"\n  on-dismiss="{{method('onDismiss')}}">\n  <template is="registerYield" yield-name="yield">Your changes have been saved.</template>\n</dtf-alert>`,
  avatar:           `import { DtfAvatar } from '@design-token-forge/slyte';\n\n<!-- Image -->\n<dtf-avatar lt-prop-src="/avatar.jpg" lt-prop-alt="Jane Doe" lt-prop-size="base" lt-prop-status="online"></dtf-avatar>\n\n<!-- Initials fallback -->\n<dtf-avatar lt-prop-initials="JD" lt-prop-size="base"></dtf-avatar>`,
  badge:            `import { DtfBadge } from '@design-token-forge/slyte';\n\n<dtf-badge lt-prop-color-role="brand" lt-prop-variant="filled" lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">New</template>\n</dtf-badge>\n\n<dtf-badge lt-prop-color-role="danger" lt-prop-variant="soft">\n  <template is="registerYield" yield-name="yield">3</template>\n</dtf-badge>`,
  button:           `import { DtfButton } from '@design-token-forge/slyte';\n\n<dtf-button\n  lt-prop-variant="filled"\n  lt-prop-color-role="brand"\n  lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">Submit</template>\n</dtf-button>\n\n<!-- Outlined danger -->\n<dtf-button lt-prop-variant="outlined" lt-prop-color-role="danger" lt-prop-disabled="true">\n  <template is="registerYield" yield-name="yield">Delete</template>\n</dtf-button>`,
  checkbox:         `import { DtfCheckbox } from '@design-token-forge/slyte';\n\n<dtf-checkbox\n  lt-prop-label="Accept terms"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-checked="false"\n  on-change="{{method('onChange')}}">\n</dtf-checkbox>\n\n<!-- Indeterminate -->\n<dtf-checkbox lt-prop-label="Select all" lt-prop-indeterminate="true"></dtf-checkbox>`,
  datepicker:       `import { DtfDatepicker } from '@design-token-forge/slyte';\n\n<dtf-datepicker\n  lt-prop-label="Start date"\n  lt-prop-placeholder="Pick a date"\n  lt-prop-size="base"\n  lt-prop-mode="popup"\n  on-change="{{method('onDate')}}">\n</dtf-datepicker>`,
  'file-upload':    `import { DtfFileUpload } from '@design-token-forge/slyte';\n\n<dtf-file-upload\n  lt-prop-size="base"\n  lt-prop-mode="button"\n  lt-prop-accept="image/*"\n  lt-prop-multiple="true"\n  on-files="{{method('onFiles')}}">\n  <template is="registerYield" yield-name="yield">Upload image</template>\n</dtf-file-upload>`,
  'icon-button':    `import { DtfIconButton } from '@design-token-forge/slyte';\n\n<dtf-icon-button\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-aria-label="Add item">\n  <template is="registerYield" yield-name="yield">\n    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">\n      <path d="M8 3v10M3 8h10"/>\n    </svg>\n  </template>\n</dtf-icon-button>`,
  input:            `import { DtfInput } from '@design-token-forge/slyte';\n\n<dtf-input\n  lt-prop-label="Email"\n  lt-prop-type="email"\n  lt-prop-placeholder="you@example.com"\n  lt-prop-size="base"\n  lt-prop-variant="outlined">\n</dtf-input>\n\n<!-- Error state -->\n<dtf-input lt-prop-label="Username" lt-prop-error="true" lt-prop-placeholder="Enter username"></dtf-input>`,
  'menu-button':    `import { DtfMenuButton } from '@design-token-forge/slyte';\n\n<dtf-menu-button\n  lt-prop-variant="outlined"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-show-chevron="true">\n  <template is="registerYield" yield-name="yield">Actions</template>\n</dtf-menu-button>`,
  'progress-bar':   `import { DtfProgressBar } from '@design-token-forge/slyte';\n\n<!-- Determinate -->\n<dtf-progress-bar lt-prop-value="65" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-bar>\n\n<!-- Indeterminate -->\n<dtf-progress-bar lt-prop-indeterminate="true" lt-prop-color-role="brand"></dtf-progress-bar>`,
  'progress-circle':`import { DtfProgressRing } from '@design-token-forge/slyte';\n\n<dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-ring>`,
  'progress-ring':  `import { DtfProgressRing } from '@design-token-forge/slyte';\n\n<!-- Determinate -->\n<dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-ring>\n\n<!-- Indeterminate -->\n<dtf-progress-ring lt-prop-indeterminate="true" lt-prop-color-role="brand"></dtf-progress-ring>`,
  radio:            `import { DtfRadio } from '@design-token-forge/slyte';\n\n<dtf-radio lt-prop-name="plan" lt-prop-value="free"  lt-prop-label="Free"  lt-prop-checked="true"></dtf-radio>\n<dtf-radio lt-prop-name="plan" lt-prop-value="pro"   lt-prop-label="Pro"></dtf-radio>\n<dtf-radio lt-prop-name="plan" lt-prop-value="team"  lt-prop-label="Team"></dtf-radio>`,
  select:           `import { DtfSelect } from '@design-token-forge/slyte';\n\n<dtf-select lt-prop-label="Country" lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">\n    <option value="">Select&hellip;</option>\n    <option value="us">United States</option>\n    <option value="uk">United Kingdom</option>\n  </template>\n</dtf-select>`,
  slider:           `import { DtfSlider } from '@design-token-forge/slyte';\n\n<dtf-slider\n  lt-prop-label="Volume"\n  lt-prop-color-role="brand"\n  lt-prop-min="0"\n  lt-prop-max="100"\n  lt-prop-value="40"\n  on-change="{{method('onVolume')}}">\n</dtf-slider>`,
  'split-button':   `import { DtfSplitButton } from '@design-token-forge/slyte';\n\n<dtf-split-button\n  lt-prop-variant="filled"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-menu-label="More options"\n  on-action-click="{{method('onSave')}}"\n  on-menu-click="{{method('openMenu')}}">\n  <template is="registerYield" yield-name="label">Save</template>\n</dtf-split-button>`,
  textarea:         `import { DtfTextarea } from '@design-token-forge/slyte';\n\n<dtf-textarea\n  lt-prop-label="Description"\n  lt-prop-placeholder="Enter description..."\n  lt-prop-size="base"\n  lt-prop-variant="outlined">\n</dtf-textarea>`,
  toast:            `import { DtfToast } from '@design-token-forge/slyte';\n\n<dtf-toast\n  lt-prop-color-role="brand"\n  lt-prop-title="Update available"\n  lt-prop-action-label="Reload"\n  on-action="{{method('onReload')}}"\n  on-dismiss="{{method('onDismiss')}}">\n  <template is="registerYield" yield-name="yield">A new version is ready.</template>\n</dtf-toast>`,
  toggle:           `import { DtfToggle } from '@design-token-forge/slyte';\n\n<dtf-toggle\n  lt-prop-label="Dark mode"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-checked="true"\n  on-change="{{method('onToggle')}}">\n</dtf-toggle>`,
  tooltip:          `import { DtfTooltip } from '@design-token-forge/slyte';\n\n<dtf-tooltip lt-prop-content="Save document" lt-prop-placement="top">\n  <template is="registerYield" yield-name="trigger">\n    <button class="btn" data-variant="ghost" data-role="brand">Save</button>\n  </template>\n</dtf-tooltip>`,
};

// Pre-style pages are already correctly placed inside fw-snippet — skip them
const PRE_STYLE = new Set(['card.html','divider.html','kbd.html','skeleton.html','spinner.html']);

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const files = fs.readdirSync(DEMO).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p   = path.join(DEMO, file);
  let   src = fs.readFileSync(p, 'utf8');
  if (!src.includes('fw-snippet-tabs')) continue;

  const key     = file.replace('.html', '');
  const rawSnip = SNIPPETS[key] || SNIPPETS._TEMPLATE;

  // ── Step 1: Remove all existing Slyte panel occurrences ───────────────────
  src = src.replace(/<div class="fw-snippet-code" data-panel="slyte"[^>]*>[\s\S]*?<\/div>/g, '');
  src = src.replace(/<pre class="fw-snippet-code" data-panel="slyte"[^>]*>[\s\S]*?<\/pre>/g, '');

  // ── Step 2: Rebuild tab strip — Slyte first + aria-selected="true" ─────────
  src = src.replace(/\s*<button class="fw-snippet-tab"[^>]*data-tab="slyte"[^>]*>Slyte<\/button>/g, '');

  // Set the current first tab's aria-selected to false
  src = src.replace(
    /(<div class="fw-snippet-tabs"[^>]*>\s*<button class="fw-snippet-tab") aria-selected="true"/,
    '$1 aria-selected="false"'
  );

  // Strip data-active from existing React/Vue/HTML/CSS panels only
  src = src.replace(/(<div class="fw-snippet-code"[^>]*) data-active/g, '$1');
  src = src.replace(/(<pre class="fw-snippet-code"[^>]*) data-active/g, '$1');

  // Insert Slyte as first tab (selected=true)
  src = src.replace(
    /(<div class="fw-snippet-tabs"[^>]*>\s*)/,
    '$1<button class="fw-snippet-tab" aria-selected="true" data-tab="slyte" type="button">Slyte</button>\n          '
  );

  // ── Step 3: Inject Slyte panel INSIDE fw-snippet, after CSS panel ──────────
  if (PRE_STYLE.has(file)) {
    // Pre-style: insert after the last </code></pre> inside sec-framework
    const secStart  = src.indexOf('id="sec-framework"');
    const secEnd    = src.indexOf('</section>', secStart);
    const section   = src.slice(secStart, secEnd);
    const lastClose = section.lastIndexOf('</code></pre>');
    if (lastClose === -1) { console.log(`  skip (no pre close): ${file}`); continue; }
    const absInsert = secStart + lastClose + '</code></pre>'.length;
    const panel     = `\n        <pre class="fw-snippet-code" data-panel="slyte" data-active><code>${esc(rawSnip)}</code></pre>`;
    src = src.slice(0, absInsert) + panel + src.slice(absInsert);
  } else {
    // Div-style: find the CSS panel and insert after its closing </div>.
    // The CSS panel has no nested HTML, so the first </div> after it is its close.
    // Use the sec-framework section to scope the search.
    const secStart = src.indexOf('id="sec-framework"');
    const secEnd   = src.indexOf('</section>', secStart);
    const section  = src.slice(secStart, secEnd);

    // Find "data-panel="css"" inside section, then find first </div> after its content
    const cssPanelStart = section.indexOf('data-panel="css"');
    if (cssPanelStart === -1) { console.log(`  skip (no css panel): ${file}`); continue; }

    // The panel opens at cssPanelStart (inside the <div> tag).
    // Find the start of the opening tag
    const tagStart = section.lastIndexOf('<div', cssPanelStart);
    // Find the end of the opening tag (the ">")
    const tagClose = section.indexOf('>', cssPanelStart);
    // Now find the first </div> after the opening tag closes
    const cssClose = section.indexOf('</div>', tagClose + 1);
    if (cssClose === -1) { console.log(`  skip (no css close): ${file}`); continue; }

    const absInsert = secStart + cssClose + '</div>'.length;
    const panel     = `\n        <div class="fw-snippet-code" data-panel="slyte" data-active>${esc(rawSnip)}</div>`;
    src = src.slice(0, absInsert) + panel + src.slice(absInsert);
  }

  fs.writeFileSync(p, src, 'utf8');
  console.log(`  ✓ ${file}`);
}

console.log('\nAll done.');
