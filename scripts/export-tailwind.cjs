#!/usr/bin/env node
/**
 * DTF → Tailwind CSS Preset Export
 * Outputs: dist/tailwind-preset.js  +  dist/tailwind-preset.cjs
 *
 * Run: node scripts/export-tailwind.cjs
 *
 * Design decision: values use var() references so Tailwind classes respond
 * to data-theme and data-product overrides automatically.
 * Trade-off: Tailwind opacity modifier (bg-primary-500/50) won't work.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TOKENS_SRC = path.join(__dirname, '../packages/tokens/src');
const OUT_DIR = path.join(__dirname, '../dist');

// ─── CSS Parser (only :root block) ───────────────────────────────────────────

function parseRootVars(css) {
  const out = new Map();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blockRe = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(stripped)) !== null) {
    const selector = m[1].trim();
    if (selector !== ':root') continue;
    const propRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let p;
    while ((p = propRe.exec(m[2])) !== null) {
      out.set(p[1].trim(), p[2].trim());
    }
  }
  return out;
}

// ─── Build palette color map ─────────────────────────────────────────────────

function buildColors(primVars, semVars) {
  const colors = {};

  // 1. Primitive palette steps: prim-{role}-{step}
  for (const [name] of primVars) {
    if (!name.startsWith('prim-')) continue;
    const rest = name.slice(5);
    const firstDash = rest.indexOf('-');
    if (firstDash === -1) continue;
    const role = rest.slice(0, firstDash);
    const step = rest.slice(firstDash + 1);
    if (!colors[role]) colors[role] = {};
    colors[role][step] = `var(--${name})`;
  }

  // 2. Semantic role tokens: {role}-{category}-{modifier}
  const semanticRoles = ['brand', 'danger', 'warning', 'success', 'info', 'neutral'];
  for (const role of semanticRoles) {
    const prefix = role + '-';
    const semanticGroup = {};
    for (const [name] of semVars) {
      if (!name.startsWith(prefix)) continue;
      const key = name.slice(prefix.length).replace(/-/g, '-'); // kebab as-is
      semanticGroup[key] = `var(--${name})`;
    }
    if (Object.keys(semanticGroup).length > 0) {
      colors[`${role}-semantic`] = semanticGroup;
    }
  }

  return colors;
}

// ─── Build spacing map ────────────────────────────────────────────────────────

function buildSpacing(primVars) {
  const spacing = { 0: '0px' };
  for (const [name] of primVars) {
    if (!name.startsWith('spacing-')) continue;
    const key = name.slice(8);
    if (key === 'none') {
      spacing['none'] = 'var(--spacing-none)';
    } else {
      spacing[key] = `var(--${name})`;
    }
  }
  return spacing;
}

// ─── Build typography maps ────────────────────────────────────────────────────

function buildTypography(primVars) {
  const fontSize = {};
  const fontWeight = {};
  const fontFamily = {};
  const lineHeight = {};
  const letterSpacing = {};

  for (const [name, val] of primVars) {
    if (val.startsWith('var(')) continue; // skip aliases
    if (name.startsWith('font-size-')) {
      fontSize[name.slice(10)] = `var(--${name})`;
    } else if (name.startsWith('font-weight-')) {
      fontWeight[name.slice(12)] = `var(--${name})`;
    } else if (name === 'font-family' || name === 'font-family-sans') {
      fontFamily[name === 'font-family' ? 'sans' : name.slice(12)] = `var(--${name})`;
    } else if (name === 'font-family-mono') {
      fontFamily['mono'] = `var(--${name})`;
    } else if (name.startsWith('line-height-')) {
      lineHeight[name.slice(12)] = `var(--${name})`;
    } else if (name.startsWith('letter-spacing-')) {
      letterSpacing[name.slice(15)] = `var(--${name})`;
    }
  }

  return { fontSize, fontWeight, fontFamily, lineHeight, letterSpacing };
}

// ─── Build extras maps ────────────────────────────────────────────────────────

function buildExtras(extrasVars) {
  const borderRadius = {};
  const boxShadow = {};
  const transitionDuration = {};
  const transitionTimingFunction = {};
  const zIndex = {};
  const opacity = {};

  for (const [name] of extrasVars) {
    if (name.startsWith('radius-')) {
      const key = name.slice(7);
      borderRadius[key] = `var(--${name})`;
    } else if (name.startsWith('shadow-')) {
      const key = name.slice(7);
      boxShadow[key] = `var(--${name})`;
    } else if (name.startsWith('duration-')) {
      const key = name.slice(9);
      transitionDuration[key] = `var(--${name})`;
    } else if (name.startsWith('easing-')) {
      const key = name.slice(7);
      transitionTimingFunction[key] = `var(--${name})`;
    } else if (name.startsWith('z-')) {
      const key = name.slice(2);
      zIndex[key] = `var(--${name})`;
    } else if (name.startsWith('opacity-')) {
      const key = name.slice(8);
      opacity[key] = `var(--${name})`;
    }
  }

  return { borderRadius, boxShadow, transitionDuration, transitionTimingFunction, zIndex, opacity };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const primVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'primitives.css'), 'utf8'));
const semVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'semantic.css'), 'utf8'));
const extrasVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'extras.css'), 'utf8'));

const colors = buildColors(primVars, semVars);
const spacing = buildSpacing(primVars);
const { fontSize, fontWeight, fontFamily, lineHeight, letterSpacing } = buildTypography(primVars);
const { borderRadius, boxShadow, transitionDuration, transitionTimingFunction, zIndex, opacity } = buildExtras(extrasVars);

const preset = {
  theme: {
    colors,
    spacing,
    borderRadius,
    boxShadow,
    fontSize,
    fontWeight,
    fontFamily,
    lineHeight,
    letterSpacing,
    transitionDuration,
    transitionTimingFunction,
    zIndex,
    opacity,
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

// ESM
const esmContent = `// @design-token-forge/tokens — Tailwind CSS preset
// Auto-generated — do not edit. Regenerate: node scripts/export-tailwind.cjs
//
// Usage:
//   import dtfPreset from '@design-token-forge/tokens/tailwind-preset';
//   export default { presets: [dtfPreset] };
//
// Note: Values use CSS custom properties (var()). This means:
//   - Theme switching (data-theme, data-product) works automatically.
//   - Tailwind's opacity modifier (bg-primary-500/50) is NOT supported.

export default ${JSON.stringify(preset, null, 2)};
`;

// CJS
const cjsContent = `// @design-token-forge/tokens — Tailwind CSS preset (CJS)
// Auto-generated — do not edit. Regenerate: node scripts/export-tailwind.cjs
module.exports = ${JSON.stringify(preset, null, 2)};
`;

fs.writeFileSync(path.join(OUT_DIR, 'tailwind-preset.mjs'), esmContent, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'tailwind-preset.cjs'), cjsContent, 'utf8');

const varCount = (JSON.stringify(preset).match(/var\(--/g) || []).length;
const keyCount = Object.keys(preset.theme).length;
console.log(`✅ dist/tailwind-preset.mjs + .cjs — ${keyCount} theme keys, ${varCount} var() references`);
