#!/usr/bin/env node
/**
 * Full correct pass:
 * 1. Remove any existing Slyte panels (wrongly nested or otherwise)
 * 2. Inject Slyte panel AFTER the last fw-snippet-code panel (not inside it)
 * 3. Make Slyte the DEFAULT active tab + panel (first + selected)
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
  card:             `import { DtfCard } from '@design-token-forge/slyte';\n\n<dtf-card lt-prop-variant="elevated" lt-prop-size="base" lt-prop-rounded="true">\n  <template is="registerYield" yield-name="yield">\n    <h3>Card title</h3>\n    <p>Card body content goes here.</p>\n  </template>\n</dtf-card>`,
  checkbox:         `import { DtfCheckbox } from '@design-token-forge/slyte';\n\n<dtf-checkbox\n  lt-prop-label="Accept terms"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-checked="false"\n  on-change="{{method('onChange')}}">\n</dtf-checkbox>\n\n<!-- Indeterminate -->\n<dtf-checkbox lt-prop-label="Select all" lt-prop-indeterminate="true"></dtf-checkbox>`,
  datepicker:       `import { DtfDatepicker } from '@design-token-forge/slyte';\n\n<dtf-datepicker\n  lt-prop-label="Start date"\n  lt-prop-placeholder="Pick a date"\n  lt-prop-size="base"\n  lt-prop-mode="popup"\n  on-change="{{method('onDate')}}">\n</dtf-datepicker>`,
  divider:          `import { DtfDivider } from '@design-token-forge/slyte';\n\n<!-- Simple horizontal -->\n<dtf-divider></dtf-divider>\n\n<!-- Labeled -->\n<dtf-divider lt-prop-variant="dashed">\n  <template is="registerYield" yield-name="yield">or</template>\n</dtf-divider>\n\n<!-- Vertical -->\n<dtf-divider lt-prop-orientation="vertical"></dtf-divider>`,
  'file-upload':    `import { DtfFileUpload } from '@design-token-forge/slyte';\n\n<dtf-file-upload\n  lt-prop-size="base"\n  lt-prop-mode="button"\n  lt-prop-accept="image/*"\n  lt-prop-multiple="true"\n  on-files="{{method('onFiles')}}">\n  <template is="registerYield" yield-name="yield">Upload image</template>\n</dtf-file-upload>`,
  'icon-button':    `import { DtfIconButton } from '@design-token-forge/slyte';\n\n<dtf-icon-button\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-aria-label="Add item">\n  <template is="registerYield" yield-name="yield">\n    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">\n      <path d="M8 3v10M3 8h10"/>\n    </svg>\n  </template>\n</dtf-icon-button>`,
  input:            `import { DtfInput } from '@design-token-forge/slyte';\n\n<dtf-input\n  lt-prop-label="Email"\n  lt-prop-type="email"\n  lt-prop-placeholder="you@example.com"\n  lt-prop-size="base"\n  lt-prop-variant="outlined">\n</dtf-input>\n\n<!-- Error state -->\n<dtf-input lt-prop-label="Username" lt-prop-error="true" lt-prop-placeholder="Enter username"></dtf-input>`,
  kbd:              `import { DtfKbd } from '@design-token-forge/slyte';\n\nPress <dtf-kbd lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">⌘</template>\n</dtf-kbd>\n+\n<dtf-kbd>\n  <template is="registerYield" yield-name="yield">K</template>\n</dtf-kbd>\nto open the command palette.`,
  'menu-button':    `import { DtfMenuButton } from '@design-token-forge/slyte';\n\n<dtf-menu-button\n  lt-prop-variant="outlined"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-show-chevron="true">\n  <template is="registerYield" yield-name="yield">Actions</template>\n</dtf-menu-button>`,
  'progress-bar':   `import { DtfProgressBar } from '@design-token-forge/slyte';\n\n<!-- Determinate -->\n<dtf-progress-bar lt-prop-value="65" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-bar>\n\n<!-- Indeterminate -->\n<dtf-progress-bar lt-prop-indeterminate="true" lt-prop-color-role="brand"></dtf-progress-bar>`,
  'progress-circle':`import { DtfProgressRing } from '@design-token-forge/slyte';\n\n<dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-ring>`,
  'progress-ring':  `import { DtfProgressRing } from '@design-token-forge/slyte';\n\n<!-- Determinate -->\n<dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"></dtf-progress-ring>\n\n<!-- Indeterminate -->\n<dtf-progress-ring lt-prop-indeterminate="true" lt-prop-color-role="brand"></dtf-progress-ring>`,
  radio:            `import { DtfRadio } from '@design-token-forge/slyte';\n\n<dtf-radio lt-prop-name="plan" lt-prop-value="free"  lt-prop-label="Free"  lt-prop-checked="true"></dtf-radio>\n<dtf-radio lt-prop-name="plan" lt-prop-value="pro"   lt-prop-label="Pro"></dtf-radio>\n<dtf-radio lt-prop-name="plan" lt-prop-value="team"  lt-prop-label="Team"></dtf-radio>`,
  select:           `import { DtfSelect } from '@design-token-forge/slyte';\n\n<dtf-select lt-prop-label="Country" lt-prop-size="base">\n  <template is="registerYield" yield-name="yield">\n    <option value="">Select&hellip;</option>\n    <option value="us">United States</option>\n    <option value="uk">United Kingdom</option>\n  </template>\n</dtf-select>`,
  skeleton:         `import { DtfSkeleton } from '@design-token-forge/slyte';\n\n<!-- Text line -->\n<dtf-skeleton lt-prop-variant="text" lt-prop-width="200px" lt-prop-height="16px"></dtf-skeleton>\n\n<!-- Avatar circle -->\n<dtf-skeleton lt-prop-variant="circle" lt-prop-width="40px" lt-prop-height="40px"></dtf-skeleton>`,
  slider:           `import { DtfSlider } from '@design-token-forge/slyte';\n\n<dtf-slider\n  lt-prop-label="Volume"\n  lt-prop-color-role="brand"\n  lt-prop-min="0"\n  lt-prop-max="100"\n  lt-prop-value="40"\n  on-change="{{method('onVolume')}}">\n</dtf-slider>`,
  spinner:          `import { DtfSpinner } from '@design-token-forge/slyte';\n\n<dtf-spinner lt-prop-color-role="brand" lt-prop-size="base" lt-prop-label="Saving..."></dtf-spinner>`,
  'split-button':   `import { DtfSplitButton } from '@design-token-forge/slyte';\n\n<dtf-split-button\n  lt-prop-variant="filled"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-menu-label="More options"\n  on-action-click="{{method('onSave')}}"\n  on-menu-click="{{method('openMenu')}}">\n  <template is="registerYield" yield-name="label">Save</template>\n</dtf-split-button>`,
  textarea:         `import { DtfTextarea } from '@design-token-forge/slyte';\n\n<dtf-textarea\n  lt-prop-label="Description"\n  lt-prop-placeholder="Enter description..."\n  lt-prop-size="base"\n  lt-prop-variant="outlined">\n</dtf-textarea>`,
  toast:            `import { DtfToast } from '@design-token-forge/slyte';\n\n<dtf-toast\n  lt-prop-color-role="brand"\n  lt-prop-title="Update available"\n  lt-prop-action-label="Reload"\n  on-action="{{method('onReload')}}"\n  on-dismiss="{{method('onDismiss')}}">\n  <template is="registerYield" yield-name="yield">A new version is ready.</template>\n</dtf-toast>`,
  toggle:           `import { DtfToggle } from '@design-token-forge/slyte';\n\n<dtf-toggle\n  lt-prop-label="Dark mode"\n  lt-prop-color-role="brand"\n  lt-prop-size="base"\n  lt-prop-checked="true"\n  on-change="{{method('onToggle')}}">\n</dtf-toggle>`,
  tooltip:          `import { DtfTooltip } from '@design-token-forge/slyte';\n\n<dtf-tooltip lt-prop-content="Save document" lt-prop-placement="top">\n  <template is="registerYield" yield-name="trigger">\n    <button class="btn" data-variant="ghost" data-role="brand">Save</button>\n  </template>\n</dtf-tooltip>`,
};

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const files = fs.readdirSync(DEMO).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p   = path.join(DEMO, file);
  let   src = fs.readFileSync(p, 'utf8');
  if (!src.includes('fw-snippet-tabs')) continue;

  const key     = file.replace('.html', '');
  const rawSnip = SNIPPETS[key] || SNIPPETS._TEMPLATE;

  // ── Step 1: Nuke ALL existing Slyte panel occurrences ─────────────────────
  // Greedy removal of div-style (catches nested case too)
  src = src.replace(/<div class="fw-snippet-code" data-panel="slyte">[\s\S]*?<\/div>/g, '');
  // Pre-style
  src = src.replace(/<pre class="fw-snippet-code" data-panel="slyte"[^>]*>[\s\S]*?<\/pre>/g, '');

  // ── Step 2: Remove any Slyte tab button (will re-add as first) ────────────
  src = src.replace(/\s*<button class="fw-snippet-tab"[^>]*data-tab="slyte"[^>]*>Slyte<\/button>/g, '');

  // ── Step 3: Make existing first tab NOT selected (Slyte will be default) ──
  // The current first tab has aria-selected="true" — set to false
  src = src.replace(
    /(<div class="fw-snippet-tabs"[^>]*>\s*<button class="fw-snippet-tab") aria-selected="true"/,
    '$1 aria-selected="false"'
  );
  // Remove data-active from the React (or whatever was first) panel
  src = src.replace(/ data-active(?=[^=])/g, '');

  // ── Step 4: Insert Slyte tab as FIRST with aria-selected="true" ───────────
  src = src.replace(
    /(<div class="fw-snippet-tabs"[^>]*>\s*)/,
    '$1<button class="fw-snippet-tab" aria-selected="true" data-tab="slyte" type="button">Slyte</button>\n          '
  );

  // ── Step 5: Inject Slyte panel with data-active, AFTER the last code panel ─
  const secStart = src.indexOf('id="sec-framework"');
  if (secStart === -1) continue;
  const secEnd = src.indexOf('</section>', secStart);
  if (secEnd === -1) continue;

  const section    = src.slice(secStart, secEnd + '</section>'.length);
  const usesPre    = section.includes('<pre class="fw-snippet-code"');
  const CLOSE_TAG  = usesPre ? '</code></pre>' : '</div>';

  // Find the last fw-snippet-code panel closing tag within the section
  const lastClose  = section.lastIndexOf(CLOSE_TAG);
  if (lastClose === -1) { console.log(`  skip (no panel close): ${file}`); continue; }

  const absInsert  = secStart + lastClose + CLOSE_TAG.length;

  let newPanel;
  if (usesPre) {
    newPanel = `\n        <pre class="fw-snippet-code" data-panel="slyte" data-active><code>${esc(rawSnip)}</code></pre>`;
  } else {
    newPanel = `\n        <div class="fw-snippet-code" data-panel="slyte" data-active>${esc(rawSnip)}</div>`;
  }

  src = src.slice(0, absInsert) + newPanel + src.slice(absInsert);

  fs.writeFileSync(p, src, 'utf8');
  console.log(`  ✓ ${file}`);
}

console.log('\nAll done.');
