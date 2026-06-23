#!/usr/bin/env node
/**
 * DTF → Style Dictionary Format Export
 * Outputs:
 *   dist/style-dictionary/tokens.json   — SD input tokens
 *   dist/style-dictionary/config.json   — SD build config (CSS + iOS + Android)
 *
 * Run: node scripts/export-style-dictionary.cjs
 *
 * Note: Style Dictionary uses RESOLVED values (not var()).
 * Teams run `style-dictionary build` with the config to get platform files.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TOKENS_SRC = path.join(__dirname, '../packages/tokens/src');
const OUT_DIR = path.join(__dirname, '../dist/style-dictionary');

// ─── CSS Parser ──────────────────────────────────────────────────────────────

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

// ─── Type Inference ───────────────────────────────────────────────────────────

function inferType(name, value) {
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return 'color';
  if (/^rgb\(|^rgba\(/.test(value)) return 'color';
  if (/^\d+(\.\d+)?(px|rem|em)$/.test(value) || name.startsWith('font-size') || name.startsWith('spacing')) return 'dimension';
  if (/^\d+ms$/.test(value)) return 'duration';
  if (/^cubic-bezier/.test(value)) return 'cubicBezier';
  if (name.startsWith('font-family')) return 'fontFamily';
  if (name.startsWith('font-weight')) return 'fontWeight';
  if (name.startsWith('line-height')) return 'number';
  if (name.startsWith('opacity-') || name.startsWith('z-')) return 'number';
  return 'other';
}

// ─── CTI path mapping ────────────────────────────────────────────────────────
// Style Dictionary canonical: Category / Type / Item

function nameToSDPath(name) {
  if (name.startsWith('prim-')) {
    const rest = name.slice(5);
    const dash = rest.indexOf('-');
    const palette = rest.slice(0, dash);
    const step = rest.slice(dash + 1);
    return ['color', palette, step];
  }
  if (name.startsWith('spacing-')) return ['size', 'spacing', name.slice(8)];
  if (name.startsWith('font-family')) return ['asset', 'font', name.replace('font-family-', '').replace('font-family', 'sans')];
  if (name.startsWith('font-size-')) return ['size', 'font', name.slice(10)];
  if (name.startsWith('font-weight-')) return ['font', 'weight', name.slice(12)];
  if (name.startsWith('line-height-')) return ['font', 'lineHeight', name.slice(12)];
  if (name.startsWith('letter-spacing-')) return ['font', 'letterSpacing', name.slice(15)];
  if (name.startsWith('radius-')) return ['size', 'borderRadius', name.slice(7)];
  if (name.startsWith('shadow-')) return ['effect', 'shadow', name.slice(7)];
  if (name.startsWith('duration-')) return ['time', 'duration', name.slice(9)];
  if (name.startsWith('easing-')) return ['time', 'easing', name.slice(7)];
  if (name.startsWith('z-')) return ['other', 'zIndex', name.slice(2)];
  if (name.startsWith('opacity-')) return ['other', 'opacity', name.slice(8)];
  if (name.startsWith('color-')) return ['color', 'utility', name.slice(6)];

  const semanticRoles = ['brand', 'danger', 'warning', 'success', 'info', 'neutral'];
  for (const role of semanticRoles) {
    if (name.startsWith(role + '-')) {
      const parts = name.slice(role.length + 1).split('-');
      return ['color', role, ...parts];
    }
  }
  return ['other', name];
}

// ─── Deep-set helper ─────────────────────────────────────────────────────────

function deepSet(obj, pathArr, value) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const key = pathArr[i];
    if (!(key in cur)) cur[key] = {};
    cur = cur[key];
  }
  cur[pathArr[pathArr.length - 1]] = value;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const primVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'primitives.css'), 'utf8'));
const semVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'semantic.css'), 'utf8'));
const extrasVars = parseRootVars(fs.readFileSync(path.join(TOKENS_SRC, 'extras.css'), 'utf8'));

const tokens = {};

const allVars = new Map([...primVars, ...extrasVars, ...semVars]);

for (const [name, rawValue] of allVars) {
  // Skip var() aliases — SD uses resolved values
  if (rawValue.startsWith('var(')) continue;
  const type = inferType(name, rawValue);
  if (type === 'other') continue; // skip shadows/compound values for now

  const sdPath = nameToSDPath(name);
  deepSet(tokens, sdPath, {
    value: rawValue,
    type,
    ...(name.startsWith('prim-') || name.startsWith('spacing-') ? {} : { description: name }),
  });
}

const config = {
  source: ['dist/style-dictionary/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/style-dictionary/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
    ios: {
      transformGroup: 'ios-swift',
      buildPath: 'dist/style-dictionary/ios/',
      files: [{ destination: 'DTFTokens.swift', format: 'ios-swift/class.swift' }],
    },
    android: {
      transformGroup: 'android',
      buildPath: 'dist/style-dictionary/android/',
      files: [{ destination: 'dtf_tokens.xml', format: 'android/resources' }],
    },
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'tokens.json'), JSON.stringify(tokens, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'config.json'), JSON.stringify(config, null, 2), 'utf8');

const count = (JSON.stringify(tokens).match(/"value"/g) || []).length;
console.log(`✅ dist/style-dictionary/tokens.json + config.json — ${count} tokens`);
console.log('   Run: npx style-dictionary build --config dist/style-dictionary/config.json');
