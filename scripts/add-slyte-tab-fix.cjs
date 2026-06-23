#!/usr/bin/env node
/**
 * Second pass: fix pages where the panel injection was missed.
 * Targets ONLY the sec-framework section.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DEMO = path.join(__dirname, '../demo');

const SNIPPETS = {
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

  kbd: `import { DtfKbd } from '@design-token-forge/slyte';

Press &lt;dtf-kbd lt-prop-size="base"&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;&#8984;&lt;/template&gt;
&lt;/dtf-kbd&gt;
+
&lt;dtf-kbd&gt;
  &lt;template is="registerYield" yield-name="yield"&gt;K&lt;/template&gt;
&lt;/dtf-kbd&gt;
to open the command palette.`,

  skeleton: `import { DtfSkeleton } from '@design-token-forge/slyte';

&lt;!-- Text line --&gt;
&lt;dtf-skeleton lt-prop-variant="text" lt-prop-width="200px" lt-prop-height="16px"&gt;&lt;/dtf-skeleton&gt;

&lt;!-- Avatar circle --&gt;
&lt;dtf-skeleton lt-prop-variant="circle" lt-prop-width="40px" lt-prop-height="40px"&gt;&lt;/dtf-skeleton&gt;`,

  spinner: `import { DtfSpinner } from '@design-token-forge/slyte';

&lt;dtf-spinner lt-prop-color-role="brand" lt-prop-size="base" lt-prop-label="Saving..."&gt;&lt;/dtf-spinner&gt;`,
};

const FILES = ['card.html', 'divider.html', 'kbd.html', 'skeleton.html', 'spinner.html'];

for (const file of FILES) {
  const p    = path.join(DEMO, file);
  let   src  = fs.readFileSync(p, 'utf8');
  const key  = file.replace('.html', '');
  const snippet = SNIPPETS[key];

  if (src.includes('data-panel="slyte"')) {
    console.log(`  skip: ${file}`);
    continue;
  }

  // Find the sec-framework section boundaries
  const secStart = src.indexOf('id="sec-framework"');
  if (secStart === -1) { console.log(`  no sec-framework: ${file}`); continue; }

  // Find the </section> that closes the framework section
  // (it's the next </section> after secStart)
  const secEnd = src.indexOf('</section>', secStart);
  if (secEnd === -1) { console.log(`  no closing section: ${file}`); continue; }

  const section = src.slice(secStart, secEnd + '</section>'.length);

  // Find the last fw-snippet-code panel end inside this section
  // Look for the last </pre> or </div> that terminates a fw-snippet-code
  const insertMarker = '</code></pre>';
  const lastPre = section.lastIndexOf(insertMarker);
  if (lastPre === -1) { console.log(`  no code panel end found: ${file}`); continue; }

  const insertPos = secStart + lastPre + insertMarker.length;

  const newPanel = `\n        <pre class="fw-snippet-code" data-panel="slyte"><code>${snippet}</code></pre>`;
  src = src.slice(0, insertPos) + newPanel + src.slice(insertPos);

  fs.writeFileSync(p, src, 'utf8');
  console.log(`  patch: ${file}`);
}

console.log('\nDone.');
