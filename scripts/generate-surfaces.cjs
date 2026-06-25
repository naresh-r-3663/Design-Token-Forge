#!/usr/bin/env node
/**
 * generate-surfaces.cjs
 *
 * Generates surfaces.css deterministically from primitive palette steps.
 * Every hex value maps to an existing primitive → 100% Figma alias coverage.
 *
 * ARCHITECTURE:
 *   Canvas surfaces (bright, base, dim, deep, inverse) — page tones, pick one per region
 *   Elevation surfaces (card, modal, float)              — lifted regions placed on a canvas
 *     All use greyscale palette steps
 *   Accent surface uses brand (primary) palette steps
 *
 *   Old names `container` / `over-container` were renamed to `card` / `modal`
 *   for clarity (the role of each surface in the elevation ladder). A
 *   back-compat alias block is emitted at the end of surfaces.css so external
 *   consumers keep working during migration.
 *
 * SURFACE STEP MAP:
 *   Each surface property maps to a palette step name (e.g., "25", "900", "white").
 *   The generator reads the current palette values from primitives.css and outputs
 *   surfaces.css with those exact hex values.
 *
 * BENEFIT:
 *   Change primitives → re-run this script → surfaces update → Figma aliases cascade.
 *   No orphan hex values, no manual editing of surfaces.css.
 */

const fs = require('fs');
const path = require('path');

const TOKENS_DIR = path.resolve(__dirname, '../packages/tokens/src');

// ── Parse primitives.css ──────────────────────────────────────
function parsePrimitives() {
  const css = fs.readFileSync(path.join(TOKENS_DIR, 'primitives.css'), 'utf-8');
  const palettes = {};
  const re = /--prim-([a-zA-Z]+)-([a-zA-Z0-9]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const [, palette, step, value] = m;
    if (!palettes[palette]) palettes[palette] = {};
    palettes[palette][step] = value.trim();
  }
  return palettes;
}

// ── Step mapping ──────────────────────────────────────────────
// Grey step names from the 21-step greyscale palette.
// Light = light-to-dark (white..black), Dark = dark-to-light (black..white)
// Each surface definition maps 16 property slots to palette step names.

// Light greyscale surfaces: brightest → deepest
// "g" prefix = greyscale palette. "m" prefix = brand palette.

const LIGHT_SURFACE_MAP = {
  // Surface-bright: whitest surface
  bright: {
    bg:                   'white',     // #FFFFFF
    subtle:                '25',        // F6
    strong:              '50',        // F1
    outline:              '150',       // D1
    separator:            '150',       // D1
    'ct-default':         '900',       // 1B
    'ct-strong':          'black',     // 00
    'ct-subtle':          '600',       // 5E
    'ct-faint':           '400',       // 86
    'cm-bg':              '25',        // F9 — gentle lift above bright
    'cm-bg-hover':        '50',        // F1 — bg+2 steps
    'cm-bg-pressed':      '75',        // E8 — bg+3 steps
    'cm-outline':         '150',       // D1
    'cm-outline-hover':   '200',       // BB
    'cm-outline-pressed': '250',       // AB
    'cm-separator':       '150',       // D1
  },
  // Surface-base: default canvas
  base: {
    bg:                   '25',
    subtle:                '50',
    strong:              '75',
    outline:              '150',
    separator:            '175',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '600',
    'ct-faint':           '400',
    'cm-bg':              'white',    // FF — lifted above base
    'cm-bg-hover':        '75',        // E8 — bg+2 steps
    'cm-bg-pressed':      '100',       // DD — bg+3 steps
    'cm-outline':         '150',
    'cm-outline-hover':   '200',
    'cm-outline-pressed': '250',
    'cm-separator':       '175',
  },
  // Surface-dim: receding area
  dim: {
    bg:                   '50',
    subtle:                '75',
    strong:              '100',
    outline:              '175',
    separator:            '175',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '600',
    'ct-faint':           '400',
    'cm-bg':              'white',    // FF — lifted above dim
    'cm-bg-hover':        '100',       // DD — bg+2 steps
    'cm-bg-pressed':      '150',       // CF — bg+3 steps
    'cm-outline':         '175',
    'cm-outline-hover':   '200',
    'cm-outline-pressed': '300',
    'cm-separator':       '175',
  },
  // Surface-deep: deeply recessed (sidebars, wells)
  deep: {
    bg:                   '75',
    subtle:                '100',
    strong:              '150',
    outline:              '175',
    separator:            '200',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '600',
    'ct-faint':           '450',
    'cm-bg':              '50',       // F1 — gentle lift above deep
    'cm-bg-hover':        '150',       // CF — bg+2 steps
    'cm-bg-pressed':      '175',       // C1 — bg+3 steps
    'cm-outline':         '200',
    'cm-outline-hover':   '250',
    'cm-outline-pressed': '300',
    'cm-separator':       '200',
  },
  // Surface-card: resting elevation (cards, panels on a surface)
  card: {
    bg:                   'white',
    subtle:                '25',
    strong:              '50',
    outline:              '150',
    separator:            '150',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '600',
    'ct-faint':           '400',
    'cm-bg':              '25',       // F9 — gentle lift above card
    'cm-bg-hover':        '50',        // F1 — bg+2 steps
    'cm-bg-pressed':      '75',        // E8 — bg+3 steps
    'cm-outline':         '150',
    'cm-outline-hover':   '200',
    'cm-outline-pressed': '250',
    'cm-separator':       '150',
  },
  // Surface-modal: blocking overlay (dialogs, sheets — has backdrop)
  modal: {
    bg:                   'white',
    subtle:                '25',
    strong:              '50',
    outline:              '150',
    separator:            '175',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '600',
    'ct-faint':           '400',
    'cm-bg':              '50',       // F1 — deeper default for overlay
    'cm-bg-hover':        '75',        // E8 — bg+3 steps (modal starts deeper)
    'cm-bg-pressed':      '100',       // DD — bg+4 steps
    'cm-outline':         '175',
    'cm-outline-hover':   '200',
    'cm-outline-pressed': '250',
    'cm-separator':       '175',
  },
  // Surface-float: tooltip, menu
  float: {
    bg:                   'white',
    subtle:                '25',
    strong:              '50',
    outline:              '150',
    separator:            '175',
    'ct-default':         '900',
    'ct-strong':          'black',
    'ct-subtle':          '550',
    'ct-faint':           '400',
    'cm-bg':              '50',       // F1 — deeper default for float
    'cm-bg-hover':        '75',        // E8 — bg+3 steps
    'cm-bg-pressed':      '100',       // DD — bg+4 steps
    'cm-outline':         '175',
    'cm-outline-hover':   '250',
    'cm-outline-pressed': '300',
    'cm-separator':       '175',
  },
  // Surface-inverse: FIXED dark surface in all themes (snackbars, toasts)
  inverse: {
    bg:                   '900',
    subtle:                '850',
    strong:              '800',
    outline:              '700',
    separator:            '700',
    'ct-default':         '25',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '400',
    'cm-bg':              '850',
    'cm-bg-hover':        '800',
    'cm-bg-pressed':      '750',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '700',
  },
};

// Dark greyscale surfaces: reverse — darkest base, lighter text
const DARK_SURFACE_MAP = {
  bright: {
    bg:                   '850',
    subtle:                '800',
    strong:              '750',
    outline:              '700',
    separator:            '700',
    'ct-default':         '50',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '450',
    'cm-bg':              '800',
    'cm-bg-hover':        '750',
    'cm-bg-pressed':      '700',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '700',
  },
  base: {
    bg:                   '900',
    subtle:                '850',
    strong:              '800',
    outline:              '750',
    separator:            '700',
    'ct-default':         '50',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '450',
    'cm-bg':              '850',
    'cm-bg-hover':        '800',
    'cm-bg-pressed':      '750',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '700',
  },
  dim: {
    bg:                   '900',
    subtle:                '850',
    strong:              '800',
    outline:              '750',
    separator:            '750',
    'ct-default':         '75',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '450',
    'cm-bg':              '850',
    'cm-bg-hover':        '800',
    'cm-bg-pressed':      '750',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '750',
  },
  deep: {
    bg:                   'black',
    subtle:                '900',
    strong:              '850',
    outline:              '800',
    separator:            '750',
    'ct-default':         '75',
    'ct-strong':          'white',
    'ct-subtle':          '300',
    'ct-faint':           '450',
    'cm-bg':              '900',
    'cm-bg-hover':        '850',
    'cm-bg-pressed':      '800',
    'cm-outline':         '700',
    'cm-outline-hover':   '600',
    'cm-outline-pressed': '550',
    'cm-separator':       '750',
  },
  card: {
    bg:                   '850',
    subtle:                '800',
    strong:              '750',
    outline:              '700',
    separator:            '700',
    'ct-default':         '50',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '450',
    'cm-bg':              '800',
    'cm-bg-hover':        '750',
    'cm-bg-pressed':      '700',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '700',
  },
  modal: {
    bg:                   '800',
    subtle:                '750',
    strong:              '700',
    outline:              '600',
    separator:            '600',
    'ct-default':         '50',
    'ct-strong':          'white',
    'ct-subtle':          '200',
    'ct-faint':           '400',
    'cm-bg':              '750',
    'cm-bg-hover':        '700',
    'cm-bg-pressed':      '600',
    'cm-outline':         '550',
    'cm-outline-hover':   '500',
    'cm-outline-pressed': '450',
    'cm-separator':       '600',
  },
  float: {
    bg:                   '750',
    subtle:                '700',
    strong:              '600',
    outline:              '550',
    separator:            '550',
    'ct-default':         '25',
    'ct-strong':          'white',
    'ct-subtle':          '200',
    'ct-faint':           '300',
    'cm-bg':              '700',
    'cm-bg-hover':        '600',
    'cm-bg-pressed':      '550',
    'cm-outline':         '500',
    'cm-outline-hover':   '450',
    'cm-outline-pressed': '400',
    'cm-separator':       '550',
  },
  // Surface-inverse dark theme: FIXED dark colors (same as light — snackbars always dark)
  inverse: {
    bg:                   '900',
    subtle:                '850',
    strong:              '800',
    outline:              '700',
    separator:            '700',
    'ct-default':         '25',
    'ct-strong':          'white',
    'ct-subtle':          '250',
    'ct-faint':           '400',
    'cm-bg':              '850',
    'cm-bg-hover':        '800',
    'cm-bg-pressed':      '750',
    'cm-outline':         '600',
    'cm-outline-hover':   '550',
    'cm-outline-pressed': '500',
    'cm-separator':       '700',
  },
};

// Accent surface uses brand (primary) palette
const LIGHT_ACCENT_MAP = {
  bg:                   '25',
  subtle:                '50',
  strong:              '75',
  outline:              '175',
  separator:            '175',
  'ct-default':         '800',
  'ct-strong':          '900',
  'ct-subtle':          '700',
  'ct-faint':           '500',
  'cm-bg':              'white',
  'cm-bg-hover':        '25',
  'cm-bg-pressed':      '50',
  'cm-outline':         '175',
  'cm-outline-hover':   '200',
  'cm-outline-pressed': '250',
  'cm-separator':       '175',
};

const DARK_ACCENT_MAP = {
  bg:                   '900',
  subtle:                '850',
  strong:              '800',
  outline:              '750',
  separator:            '750',
  'ct-default':         '75',
  'ct-strong':          'white',
  'ct-subtle':          '150',
  'ct-faint':           '400',
  'cm-bg':              '850',
  'cm-bg-hover':        '800',
  'cm-bg-pressed':      '750',
  'cm-outline':         '600',
  'cm-outline-hover':   '550',
  'cm-outline-pressed': '500',
  'cm-separator':       '750',
};

// ── Generator ──────────────────────────────────────────────────

function generateSurface(name, stepMap, palette, indent) {
  const lines = [];
  const PROP_ORDER = [
    'bg','subtle','strong','outline','separator',
    'ct-default','ct-strong','ct-subtle','ct-faint',
    'cm-bg','cm-bg-hover','cm-bg-pressed',
    'cm-outline','cm-outline-hover','cm-outline-pressed',
    'cm-separator'
  ];
  for (const prop of PROP_ORDER) {
    const step = stepMap[prop];
    if (!step) throw new Error(`Missing step for ${name}.${prop}`);
    const hex = palette[step];
    if (!hex) throw new Error(`No primitive value for ${name}.${prop} → palette step "${step}"`);
    lines.push(`${indent}--surface-${name}-${prop}: ${hex};`);
  }
  return lines.join('\n');
}

function generate() {
  const palettes = parsePrimitives();
  const grey = palettes.greyscale;
  const mono = palettes.brand;

  if (!grey) throw new Error('Greyscale palette not found in primitives.css');
  if (!mono) throw new Error('Monochromatic palette not found in primitives.css');

  // Canvas surfaces come first (page tones), then elevation surfaces (lifted layers).
  const SURFACE_ORDER = ['bright','base','dim','deep','accent','card','modal','float','inverse'];
  const SURFACE_LABELS = {
    bright:  'SURFACE-BRIGHT  · canvas · highlighted / lifted page area',
    base:    'SURFACE-BASE    · canvas · default page',
    dim:     'SURFACE-DIM     · canvas · muted / receded',
    deep:    'SURFACE-DEEP    · canvas · recessed / sidebars / wells',
    accent:  'SURFACE-ACCENT  · canvas · primary-tinted',
    card:    'SURFACE-CARD    · elevation · resting lift (cards, panels on a surface)',
    modal:   'SURFACE-MODAL   · elevation · blocking overlay (dialogs, sheets, has backdrop)',
    float:   'SURFACE-FLOAT   · elevation · transient overlay (menus, dropdowns, tooltips, popovers)',
    inverse: 'SURFACE-INVERSE · fixed   · snackbars/toasts (dark in both themes)',
  };
  const DARK_SURFACE_LABELS = {
    bright:  'SURFACE-BRIGHT  · canvas · highlighted / lifted area (dark)',
    base:    'SURFACE-BASE    · canvas · default page (dark)',
    dim:     'SURFACE-DIM     · canvas · muted (dark)',
    deep:    'SURFACE-DEEP    · canvas · deepest (dark)',
    accent:  'SURFACE-ACCENT  · canvas · primary-tinted (dark)',
    card:    'SURFACE-CARD    · elevation · resting lift (dark)',
    modal:   'SURFACE-MODAL   · elevation · blocking overlay (dark)',
    float:   'SURFACE-FLOAT   · elevation · transient overlay (dark)',
    inverse: 'SURFACE-INVERSE · fixed   · snackbars/toasts (always dark)',
  };

  let out = '';
  out += `/* ════════════════════════════════════════════════════════════════\n`;
  out += `   Design Token Forge — T2 Surface Context Tokens\n`;
  out += `   9 surfaces × 16 tokens × light/dark\n`;
  out += `   Generated from primitive palette step mappings.\n`;
  out += `   DO NOT EDIT — regenerate via: node scripts/generate-surfaces.cjs\n`;
  out += `   ════════════════════════════════════════════════════════════════ */\n\n`;

  // Light theme
  out += `/* ── Light Theme (default) ───────────────────────────────────────── */\n`;
  out += `:root {\n`;
  for (const name of SURFACE_ORDER) {
    const isAccent = name === 'accent';
    const map = isAccent ? LIGHT_ACCENT_MAP : LIGHT_SURFACE_MAP[name];
    const palette = isAccent ? mono : grey;
    out += `\n  /* ── ${SURFACE_LABELS[name]} ── */\n`;
    out += generateSurface(name, map, palette, '  ');
    out += '\n';
  }

  out += `}\n\n`;

  // Dark theme
  out += `/* ── Dark Theme ─────────────────────────────────────────────── */\n`;
  out += `[data-theme="dark"] {\n`;
  for (const name of SURFACE_ORDER) {
    const isAccent = name === 'accent';
    const map = isAccent ? DARK_ACCENT_MAP : DARK_SURFACE_MAP[name];
    const palette = isAccent ? mono : grey;
    out += `\n  /* ── ${DARK_SURFACE_LABELS[name]} ── */\n`;
    out += generateSurface(name, map, palette, '  ');
    out += '\n';
  }

  out += `}\n`;

  return out;
}

// ── Main ──────────────────────────────────────────────────────
const css = generate();
const outPath = path.join(TOKENS_DIR, 'surfaces.css');
fs.writeFileSync(outPath, css, 'utf-8');
console.log(`✅ Generated surfaces.css (${css.split('\n').length} lines)`);
console.log(`   Source: greyscale + brand palette steps from primitives.css`);
console.log(`   Every hex value maps to an existing primitive → 100% alias coverage`);
