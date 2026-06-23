#!/usr/bin/env node
/**
 * DTF → W3C DTCG Format Export
 * Outputs: dist/tokens.dtcg.json
 *
 * Run: node scripts/export-dtcg.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TOKENS_SRC = path.join(__dirname, '../packages/tokens/src');
const OUT_FILE = path.join(__dirname, '../dist/tokens.dtcg.json');

// ─── CSS Parser ──────────────────────────────────────────────────────────────

/**
 * Parses `--name: value;` lines from a CSS string.
 * Returns Map<name, value> per selector block.
 * Returns { root: Map, dark: Map }
 */
function parseCss(css) {
  const root = new Map();
  const dark = new Map();

  // Strip comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Split into blocks
  const blockRe = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(stripped)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    const isDark = selector.includes('[data-theme="dark"]') || selector.includes('[data-theme=dark]');
    const target = isDark ? dark : root;

    const propRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let p;
    while ((p = propRe.exec(body)) !== null) {
      target.set(p[1].trim(), p[2].trim());
    }
  }

  return { root, dark };
}

// ─── Type Inference ───────────────────────────────────────────────────────────

function inferType(name, value) {
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return 'color';
  if (/^rgb\(|^rgba\(|^hsl\(|^hsla\(/.test(value)) return 'color';
  if (/^\d+(\.\d+)?(px|rem|em)$/.test(value)) return 'dimension';
  if (/^0$/.test(value) && (name.includes('radius') || name.includes('spacing') || name.includes('shadow'))) return 'dimension';
  if (/^\d+ms$/.test(value)) return 'duration';
  if (/^cubic-bezier/.test(value)) return 'cubicBezier';
  if (/^(linear|ease|ease-in|ease-out|ease-in-out)$/.test(value)) return 'cubicBezier';
  if (name.startsWith('font-family')) return 'fontFamily';
  if (name.startsWith('font-weight') && /^\d+$/.test(value)) return 'fontWeight';
  if (name.startsWith('font-size')) return 'dimension';
  if (name.startsWith('line-height') && /^\d+(\.\d+)?$/.test(value)) return 'number';
  if (name.startsWith('opacity') && /^\d+(\.\d+)?$/.test(value)) return 'number';
  if (name.startsWith('letter-spacing')) return 'dimension';
  if (name.startsWith('shadow') && value !== 'none') return 'shadow';
  if (name.startsWith('z-') && /^\d+$/.test(value)) return 'number';
  return 'string';
}

// ─── Value Normalisation ──────────────────────────────────────────────────────

function normalizeValue(name, value, type) {
  if (type === 'dimension' && value === '0') return '0px';
  if (type === 'cubicBezier' && /^cubic-bezier\((.+)\)$/.test(value)) {
    const args = value.replace(/^cubic-bezier\(/, '').replace(/\)$/, '').split(',').map(Number);
    return args;
  }
  if (type === 'shadow' && value !== 'none') {
    // Parse multi-layer shadows
    return value.split(/,(?![^(]*\))/).map(layer => {
      const parts = layer.trim().split(/\s+/);
      // Handle "inset" keyword
      let idx = 0;
      const isInset = parts[0] === 'inset';
      if (isInset) idx = 1;
      return {
        inset: isInset || undefined,
        offsetX: parts[idx] || '0px',
        offsetY: parts[idx + 1] || '0px',
        blur: parts[idx + 2] || '0px',
        spread: parts[idx + 3] || '0px',
        color: parts.slice(idx + 4).join(' ') || 'rgba(0,0,0,0)',
      };
    });
  }
  if (type === 'fontFamily') return value.replace(/"/g, "'");
  return value;
}

// ─── Name → DTCG path mapping ────────────────────────────────────────────────

/**
 * Maps a CSS custom property name to a DTCG object path array.
 * e.g. "prim-brand-500" → ["primitive", "color", "brand", "500"]
 *      "spacing-16"     → ["primitive", "spacing", "16"]
 *      "brand-content-default" → ["semantic", "brand", "content", "default"]
 */
function nameToPath(name) {
  // Primitives
  if (name.startsWith('prim-')) {
    const rest = name.slice(5); // remove "prim-"
    const parts = rest.split('-');
    const palette = parts[0];
    const step = parts.slice(1).join('-');
    return ['primitive', 'color', palette, step];
  }
  if (name.startsWith('spacing-')) {
    return ['primitive', 'spacing', name.slice(8)];
  }
  if (name.startsWith('font-family')) {
    return ['primitive', 'font', 'family', name.slice(12) || 'default'];
  }
  if (name.startsWith('font-size-')) {
    return ['primitive', 'font', 'size', name.slice(10)];
  }
  if (name.startsWith('font-weight-')) {
    return ['primitive', 'font', 'weight', name.slice(12)];
  }
  if (name.startsWith('line-height-')) {
    return ['primitive', 'font', 'lineHeight', name.slice(12)];
  }
  if (name.startsWith('letter-spacing-')) {
    return ['primitive', 'font', 'letterSpacing', name.slice(15)];
  }
  // Extras
  if (name.startsWith('radius-')) {
    return ['extra', 'radius', name.slice(7)];
  }
  if (name.startsWith('shadow-')) {
    return ['extra', 'shadow', name.slice(7)];
  }
  if (name.startsWith('duration-')) {
    return ['extra', 'motion', 'duration', name.slice(9)];
  }
  if (name.startsWith('easing-')) {
    return ['extra', 'motion', 'easing', name.slice(7)];
  }
  if (name.startsWith('z-')) {
    return ['extra', 'zIndex', name.slice(2)];
  }
  if (name.startsWith('opacity-')) {
    return ['extra', 'opacity', name.slice(8)];
  }
  if (name.startsWith('color-')) {
    return ['extra', 'color', name.slice(6)];
  }
  // Semantic: {role}-{category}-{modifier}
  const semanticRoles = ['brand', 'danger', 'warning', 'success', 'info', 'neutral', 'primary'];
  for (const role of semanticRoles) {
    if (name.startsWith(role + '-')) {
      const rest = name.slice(role.length + 1);
      const parts = rest.split('-');
      return ['semantic', role, ...parts];
    }
  }
  // Fallback
  return ['misc', name];
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

// ─── Build DTCG object ───────────────────────────────────────────────────────

function buildDtcg() {
  const files = {
    primitives: fs.readFileSync(path.join(TOKENS_SRC, 'primitives.css'), 'utf8'),
    semantic: fs.readFileSync(path.join(TOKENS_SRC, 'semantic.css'), 'utf8'),
    extras: fs.readFileSync(path.join(TOKENS_SRC, 'extras.css'), 'utf8'),
  };

  const parsed = {};
  for (const [key, css] of Object.entries(files)) {
    parsed[key] = parseCss(css);
  }

  const dtcg = {
    $description: 'Design Token Forge — W3C DTCG token export',
    $version: '0.1.0',
  };

  // Process each file's root tokens
  for (const [, { root }] of Object.entries(parsed)) {
    for (const [name, rawValue] of root) {
      const type = inferType(name, rawValue);
      const value = normalizeValue(name, rawValue, type);
      const tokenPath = nameToPath(name);

      // Skip var() references in primitives (font-family sans = var(--font-family))
      if (typeof rawValue === 'string' && rawValue.startsWith('var(')) continue;

      const token = { $value: value, $type: type };
      deepSet(dtcg, tokenPath, token);
    }
  }

  // Overlay dark-mode values as $extensions
  const semanticParsed = parsed.semantic;
  if (semanticParsed && semanticParsed.dark) {
    for (const [name, darkValue] of semanticParsed.dark) {
      if (typeof darkValue === 'string' && darkValue.startsWith('var(')) continue;
      const tokenPath = nameToPath(name);
      const type = inferType(name, darkValue);

      // Find the light value
      const lightValue = semanticParsed.root.get(name);
      if (!lightValue) continue;

      const token = {
        $value: normalizeValue(name, lightValue, type),
        $type: type,
        $extensions: {
          'com.dtf.modes': {
            light: normalizeValue(name, lightValue, type),
            dark: normalizeValue(name, darkValue, type),
          },
        },
      };
      deepSet(dtcg, tokenPath, token);
    }
  }

  return dtcg;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const dtcg = buildDtcg();

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(dtcg, null, 2), 'utf8');

const count = (JSON.stringify(dtcg).match(/"\$value"/g) || []).length;
console.log(`✅ dist/tokens.dtcg.json — ${count} tokens`);
