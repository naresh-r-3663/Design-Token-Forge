#!/usr/bin/env node
/**
 * Patches every demo/*.html fw-snippet block to add a Slyte tab + code panel.
 * Safe to re-run — skips files that already have data-tab="slyte".
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DEMO = path.join(__dirname, '../demo');

// Per-page Slyte snippet. Key = filename (without .html) or 'DEFAULT'.
const SNIPPETS = {
  button: `&lt;!-- Register once in your Lyte ComponentRegistry --&gt;
import { DtfButton } from '@design-token-forge/slyte';

&lt;!-- In any Slyte template --&gt;
&lt;dtf-button
  lt-prop-variant="filled"
  lt-prop-color-role="brand"
  lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Submit&lt;/template&gt;
&lt;/dtf-button&gt;

&lt;!-- Outlined danger with disabled --&gt;
&lt;dtf-button lt-prop-variant="outlined" lt-prop-color-role="danger" lt-prop-disabled="true"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Delete&lt;/template&gt;
&lt;/dtf-button&gt;`,

  'icon-button': `import { DtfIconButton } from '@design-token-forge/slyte';

&lt;dtf-icon-button
  lt-prop-color-role="brand"
  lt-prop-size="base"
  lt-prop-aria-label="Add item"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;
    &lt;!-- SVG icon --&gt;
    &lt;svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"&gt;
      &lt;path d="M8 3v10M3 8h10"/&gt;
    &lt;/svg&gt;
  &lt;/template&gt;
&lt;/dtf-icon-button&gt;`,

  'split-button': `import { DtfSplitButton } from '@design-token-forge/slyte';

&lt;dtf-split-button
  lt-prop-variant="filled"
  lt-prop-color-role="brand"
  lt-prop-size="base"
  on-action-click="{{method('onSave')}}"
  on-menu-click="{{method('openMenu')}}"&gt;
  &lt;template is="registerYield" yield-name="label"&gt;Save&lt;/template&gt;
&lt;/dtf-split-button&gt;`,

  'menu-button': `import { DtfMenuButton } from '@design-token-forge/slyte';

&lt;dtf-menu-button
  lt-prop-variant="outlined"
  lt-prop-color-role="brand"
  lt-prop-size="base"
  lt-prop-show-chevron="true"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Actions&lt;/template&gt;
&lt;/dtf-menu-button&gt;`,

  input: `import { DtfInput } from '@design-token-forge/slyte';

&lt;dtf-input
  lt-prop-label="Email"
  lt-prop-type="email"
  lt-prop-placeholder="you@example.com"
  lt-prop-size="base"
  lt-prop-variant="outlined"&gt;
&lt;/dtf-input&gt;

&lt;!-- Error state --&gt;
&lt;dtf-input
  lt-prop-label="Username"
  lt-prop-error="true"
  lt-prop-placeholder="Enter username"&gt;
&lt;/dtf-input&gt;`,

  textarea: `import { DtfTextarea } from '@design-token-forge/slyte';

&lt;dtf-textarea
  lt-prop-label="Description"
  lt-prop-placeholder="Enter description..."
  lt-prop-size="base"
  lt-prop-variant="outlined"&gt;
&lt;/dtf-textarea&gt;`,

  select: `import { DtfSelect } from '@design-token-forge/slyte';

&lt;dtf-select lt-prop-label="Country" lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;
    &lt;option value=""&gt;Select&hellip;&lt;/option&gt;
    &lt;option value="us"&gt;United States&lt;/option&gt;
    &lt;option value="uk"&gt;United Kingdom&lt;/option&gt;
  &lt;/template&gt;
&lt;/dtf-select&gt;`,

  slider: `import { DtfSlider } from '@design-token-forge/slyte';

&lt;dtf-slider
  lt-prop-label="Volume"
  lt-prop-color-role="brand"
  lt-prop-min="0"
  lt-prop-max="100"
  lt-prop-value="40"
  on-change="{{method('onVolume')}}"&gt;
&lt;/dtf-slider&gt;`,

  toggle: `import { DtfToggle } from '@design-token-forge/slyte';

&lt;dtf-toggle
  lt-prop-label="Dark mode"
  lt-prop-color-role="brand"
  lt-prop-size="base"
  lt-prop-checked="true"
  on-change="{{method('onToggle')}}"&gt;
&lt;/dtf-toggle&gt;`,

  checkbox: `import { DtfCheckbox } from '@design-token-forge/slyte';

&lt;dtf-checkbox
  lt-prop-label="Accept terms"
  lt-prop-color-role="brand"
  lt-prop-size="base"
  lt-prop-checked="false"
  on-change="{{method('onChange')}}"&gt;
&lt;/dtf-checkbox&gt;

&lt;!-- Indeterminate --&gt;
&lt;dtf-checkbox
  lt-prop-label="Select all"
  lt-prop-indeterminate="true"&gt;
&lt;/dtf-checkbox&gt;`,

  radio: `import { DtfRadio } from '@design-token-forge/slyte';

&lt;dtf-radio lt-prop-name="plan" lt-prop-value="free"  lt-prop-label="Free"    lt-prop-checked="true"&gt;&lt;/dtf-radio&gt;
&lt;dtf-radio lt-prop-name="plan" lt-prop-value="pro"   lt-prop-label="Pro"&gt;&lt;/dtf-radio&gt;
&lt;dtf-radio lt-prop-name="plan" lt-prop-value="team"  lt-prop-label="Team"&gt;&lt;/dtf-radio&gt;`,

  avatar: `import { DtfAvatar } from '@design-token-forge/slyte';

&lt;!-- Image --&gt;
&lt;dtf-avatar lt-prop-src="/avatar.jpg" lt-prop-alt="Jane Doe" lt-prop-size="base" lt-prop-status="online"&gt;&lt;/dtf-avatar&gt;

&lt;!-- Initials fallback --&gt;
&lt;dtf-avatar lt-prop-initials="JD" lt-prop-size="base"&gt;&lt;/dtf-avatar&gt;`,

  badge: `import { DtfBadge } from '@design-token-forge/slyte';

&lt;dtf-badge lt-prop-color-role="brand" lt-prop-variant="filled" lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;New&lt;/template&gt;
&lt;/dtf-badge&gt;

&lt;dtf-badge lt-prop-color-role="danger" lt-prop-variant="soft"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;3&lt;/template&gt;
&lt;/dtf-badge&gt;`,

  tooltip: `import { DtfTooltip } from '@design-token-forge/slyte';

&lt;dtf-tooltip lt-prop-content="Save document" lt-prop-placement="top"&gt;
  &lt;template is="registerYield" yield-name="trigger"&gt;
    &lt;button class="btn" data-variant="ghost" data-role="brand"&gt;Save&lt;/button&gt;
  &lt;/template&gt;
&lt;/dtf-tooltip&gt;`,

  kbd: `import { DtfKbd } from '@design-token-forge/slyte';

Press &lt;dtf-kbd lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;&#8984;&lt;/template&gt;
&lt;/dtf-kbd&gt;
+
&lt;dtf-kbd&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;K&lt;/template&gt;
&lt;/dtf-kbd&gt;
to open the command palette.`,

  alert: `import { DtfAlert } from '@design-token-forge/slyte';

&lt;dtf-alert
  lt-prop-color-role="success"
  lt-prop-variant="soft"
  lt-prop-title="Saved!"
  lt-prop-dismissible="true"
  on-dismiss="{{method('onDismiss')}}"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Your changes have been saved.&lt;/template&gt;
&lt;/dtf-alert&gt;`,

  toast: `import { DtfToast } from '@design-token-forge/slyte';

&lt;dtf-toast
  lt-prop-color-role="brand"
  lt-prop-title="Update available"
  lt-prop-action-label="Reload"
  on-action="{{method('onReload')}}"
  on-dismiss="{{method('onDismiss')}}"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;A new version is ready.&lt;/template&gt;
&lt;/dtf-toast&gt;`,

  'progress-bar': `import { DtfProgressBar } from '@design-token-forge/slyte';

&lt;!-- Determinate --&gt;
&lt;dtf-progress-bar lt-prop-value="65" lt-prop-color-role="brand" lt-prop-size="base"&gt;&lt;/dtf-progress-bar&gt;

&lt;!-- Indeterminate --&gt;
&lt;dtf-progress-bar lt-prop-indeterminate="true" lt-prop-color-role="brand"&gt;&lt;/dtf-progress-bar&gt;`,

  'progress-ring': `import { DtfProgressRing } from '@design-token-forge/slyte';

&lt;!-- Determinate --&gt;
&lt;dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"&gt;&lt;/dtf-progress-ring&gt;

&lt;!-- Indeterminate --&gt;
&lt;dtf-progress-ring lt-prop-indeterminate="true" lt-prop-color-role="brand"&gt;&lt;/dtf-progress-ring&gt;`,

  'progress-circle': `import { DtfProgressRing } from '@design-token-forge/slyte';

&lt;dtf-progress-ring lt-prop-value="72" lt-prop-color-role="brand" lt-prop-size="base"&gt;&lt;/dtf-progress-ring&gt;`,

  spinner: `import { DtfSpinner } from '@design-token-forge/slyte';

&lt;dtf-spinner lt-prop-color-role="brand" lt-prop-size="base" lt-prop-label="Saving..."&gt;&lt;/dtf-spinner&gt;`,

  skeleton: `import { DtfSkeleton } from '@design-token-forge/slyte';

&lt;!-- Text line --&gt;
&lt;dtf-skeleton lt-prop-variant="text" lt-prop-width="200px" lt-prop-height="16px"&gt;&lt;/dtf-skeleton&gt;

&lt;!-- Avatar circle --&gt;
&lt;dtf-skeleton lt-prop-variant="circle" lt-prop-width="40px" lt-prop-height="40px"&gt;&lt;/dtf-skeleton&gt;`,

  card: `import { DtfCard } from '@design-token-forge/slyte';

&lt;dtf-card lt-prop-variant="elevated" lt-prop-size="base" lt-prop-rounded="true"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;
    &lt;h3&gt;Card title&lt;/h3&gt;
    &lt;p&gt;Card body content goes here.&lt;/p&gt;
  &lt;/template&gt;
&lt;/dtf-card&gt;`,

  divider: `import { DtfDivider } from '@design-token-forge/slyte';

&lt;!-- Simple horizontal --&gt;
&lt;dtf-divider&gt;&lt;/dtf-divider&gt;

&lt;!-- Labeled --&gt;
&lt;dtf-divider lt-prop-variant="dashed"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;or&lt;/template&gt;
&lt;/dtf-divider&gt;

&lt;!-- Vertical --&gt;
&lt;dtf-divider lt-prop-orientation="vertical"&gt;&lt;/dtf-divider&gt;`,

  datepicker: `import { DtfDatepicker } from '@design-token-forge/slyte';

&lt;dtf-datepicker
  lt-prop-label="Start date"
  lt-prop-placeholder="Pick a date"
  lt-prop-size="base"
  lt-prop-mode="popup"
  on-change="{{method('onDate')}}"&gt;
&lt;/dtf-datepicker&gt;`,

  'file-upload': `import { DtfFileUpload } from '@design-token-forge/slyte';

&lt;dtf-file-upload
  lt-prop-size="base"
  lt-prop-mode="button"
  lt-prop-accept="image/*"
  lt-prop-multiple="true"
  on-files="{{method('onFiles')}}"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Upload image&lt;/template&gt;
&lt;/dtf-file-upload&gt;`,

  _TEMPLATE: `import { DtfComponent } from '@design-token-forge/slyte';

&lt;dtf-component
  lt-prop-variant="filled"
  lt-prop-color-role="brand"
  lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;Content&lt;/template&gt;
&lt;/dtf-component&gt;`,
};

// ─── Patch each file ────────────────────────────────────────────────────────

const files = fs.readdirSync(DEMO).filter(f => f.endsWith('.html'));
let patched = 0, skipped = 0;

for (const file of files) {
  const p    = path.join(DEMO, file);
  let   src  = fs.readFileSync(p, 'utf8');

  if (!src.includes('fw-snippet-tabs')) { skipped++; continue; }
  if (src.includes('data-tab="slyte"')) { skipped++; console.log(`  skip: ${file} (already has Slyte tab)`); continue; }

  const key     = file.replace('.html', '');
  const snippet = SNIPPETS[key] || SNIPPETS._TEMPLATE;

  // 1. Add Slyte tab button AFTER the CSS tab
  src = src.replace(
    /(<button class="fw-snippet-tab"[^>]*data-tab="css"[^>]*>CSS Tokens<\/button>)/,
    '$1\n          <button class="fw-snippet-tab" aria-selected="false" data-tab="slyte" type="button">Slyte</button>'
  );

  // 2. Detect whether panels use <pre> or <div> in this file
  const usesPre = /class="fw-snippet-code"[^>]*data-panel="css"/.test(src) && src.match(/<pre class="fw-snippet-code"/);

  // 3. Inject Slyte panel after the last fw-snippet-code block.
  //    Find the closing tag of the css panel.
  if (usesPre) {
    // <pre class="fw-snippet-code" data-panel="css">...</pre>
    src = src.replace(
      /(<\/pre>\s*)(<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/,
      `$1        <pre class="fw-snippet-code" data-panel="slyte"><code>${snippet}</code></pre>\n        $2`
    );
  } else {
    // <div class="fw-snippet-code" data-panel="css">...</div>
    src = src.replace(
      /(<\/div>\s*)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
      `$1        <div class="fw-snippet-code" data-panel="slyte">${snippet}</div>\n$2`
    );
  }

  fs.writeFileSync(p, src, 'utf8');
  patched++;
  console.log(`  patch: ${file}`);
}

console.log(`\n✅ ${patched} files patched, ${skipped} skipped.`);
