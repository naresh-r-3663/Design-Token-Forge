/* ═══════════════════════════════════════════════════════════════
   Design Token Forge — Config-to-Tokens Generator

   Generates parseCSSTokens-compatible token objects from a
   project's config.json, using the palette engine to resolve
   key hex → 22 steps → individual token hex values.

   Used by build-static.js to make config.json the authoritative
   source of truth for the build pipeline.
   ═══════════════════════════════════════════════════════════════ */

import { generatePalette, STEP_NAMES, wcagContrast } from '../generator/src/palette-engine.js';
import { TYPOGRAPHY_PRESETS, TYPOGRAPHY_LADDER, DEFAULT_TYPOGRAPHY_PRESET } from './typography-presets.js';

// ── Fixed (theme-immune) colors ───────────────────────────────
// Must match the editor's solver (demo/editor-v2/solver.js):
//   white = '#FFFFFF', black = '#0A0A0A' (not pure #000 — slightly
//   warmer for OLED comfort and to match the editor's preview).
const FIXED_WHITE = '#FFFFFF';
const FIXED_BLACK = '#0A0A0A';

// Auto-AA pair: black or white, whichever beats the WORST of the
// supplied fills in WCAG. A button has 3 fills (default/hover/
// pressed) but a single on-component text colour — testing only
// default produced white-on-light-pressed and black-on-dark-pressed
// failures (Pearl brand pressed = #9803A9 needs white; default
// #C737D9 prefers black). Mirrors demo/editor-v2/solver.js so the
// value the editor previews is the value the sync server emits.
function deriveOnComponent(fills) {
  const list = Array.isArray(fills) ? fills.filter(Boolean) : [fills].filter(Boolean);
  if (!list.length) return FIXED_WHITE;
  let minW = Infinity, minB = Infinity;
  for (const f of list) {
    const rW = wcagContrast(f, FIXED_WHITE);
    const rB = wcagContrast(f, FIXED_BLACK);
    if (rW < minW) minW = rW;
    if (rB < minB) minB = rB;
  }
  return minB > minW ? FIXED_BLACK : FIXED_WHITE;
}

// Resolve a single semantic value. Centralises fixed-* handling so
// every call site supports the same vocabulary (was: only fixed-white
// in one place, which left fixed-black unrepresentable and forced the
// editor to write literal hex into semantic.css — drift waiting to
// happen).
function resolveStep(role, prop, stepName, look) {
  if (stepName === 'fixed-white') return FIXED_WHITE;
  if (stepName === 'fixed-black') return FIXED_BLACK;
  const hex = look[stepName];
  if (hex) return hex;
  // Loud, not silent. Returning #000 here previously masked typos and
  // missing palette steps for months. Magenta sentinel + warn so
  // missing values stand out in design review and CI.
  console.warn('[generate-from-config] missing palette step for ' + role + '.' + prop + ' (step=' + stepName + ') — emitting #FF00FF sentinel');
  return '#FF00FF';
}

// ── Constants (must match color-system.html) ──────────────────
//
// Note: 'primary' was renamed to 'brand' across the system in May 2026.
// 'brand' is the canonical name for the project's main UI color, both as
// a role and as a primitive palette key. The legacy 'monochromatic'
// palette name was renamed to 'brand' in the same pass so the role and
// palette key match 1:1. See docs/decisions/adrs.md.

const TOKEN_ROLES = ['brand', 'danger', 'warning', 'info', 'success'];

const ROLE_TO_PALETTE_KEY = {
  brand: 'brand', danger: 'danger',
  warning: 'warning', info: 'info', success: 'success',
  greyscale: 'greyscale', desaturated: 'desaturated'
};

const PALETTE_KEY_TO_ROLE = {
  brand: 'brand', danger: 'danger',
  warning: 'warning', info: 'info', success: 'success',
  greyscale: 'greyscale', desaturated: 'desaturated'
};

const SURFACE_NAMES = [
  'bright', 'base', 'dim', 'deep', 'accent',
  'container', 'over-container', 'float', 'inverse'
];

const SURF_PROP_ORDER = [
  'bg', 'subtle', 'strong', 'outline', 'separator',
  'ct-default', 'ct-strong', 'ct-subtle', 'ct-faint',
  'cm-bg', 'cm-bg-hover', 'cm-bg-pressed',
  'cm-outline', 'cm-outline-hover', 'cm-outline-pressed', 'cm-separator'
];

// Default surface maps — used when config has no surfaceMap
const DEFAULT_SURF_L = {
  bright:           {bg:'white',subtle:'25',strong:'50',outline:'150',separator:'150','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'400','cm-bg':'25','cm-bg-hover':'50','cm-bg-pressed':'75','cm-outline':'150','cm-outline-hover':'200','cm-outline-pressed':'250','cm-separator':'150'},
  base:             {bg:'25',subtle:'50',strong:'75',outline:'150',separator:'175','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'400','cm-bg':'white','cm-bg-hover':'25','cm-bg-pressed':'50','cm-outline':'150','cm-outline-hover':'200','cm-outline-pressed':'250','cm-separator':'175'},
  dim:              {bg:'50',subtle:'75',strong:'100',outline:'175',separator:'175','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'400','cm-bg':'25','cm-bg-hover':'50','cm-bg-pressed':'75','cm-outline':'175','cm-outline-hover':'200','cm-outline-pressed':'300','cm-separator':'175'},
  deep:             {bg:'75',subtle:'100',strong:'150',outline:'175',separator:'200','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'450','cm-bg':'50','cm-bg-hover':'75','cm-bg-pressed':'100','cm-outline':'200','cm-outline-hover':'250','cm-outline-pressed':'300','cm-separator':'200'},
  container:        {bg:'white',subtle:'25',strong:'50',outline:'150',separator:'150','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'400','cm-bg':'25','cm-bg-hover':'50','cm-bg-pressed':'75','cm-outline':'150','cm-outline-hover':'200','cm-outline-pressed':'250','cm-separator':'150'},
  'over-container': {bg:'white',subtle:'25',strong:'50',outline:'150',separator:'175','ct-default':'900','ct-strong':'black','ct-subtle':'600','ct-faint':'400','cm-bg':'50','cm-bg-hover':'75','cm-bg-pressed':'100','cm-outline':'175','cm-outline-hover':'200','cm-outline-pressed':'250','cm-separator':'175'},
  float:            {bg:'white',subtle:'25',strong:'50',outline:'150',separator:'175','ct-default':'900','ct-strong':'black','ct-subtle':'550','ct-faint':'400','cm-bg':'50','cm-bg-hover':'75','cm-bg-pressed':'100','cm-outline':'175','cm-outline-hover':'250','cm-outline-pressed':'300','cm-separator':'175'},
  inverse:          {bg:'900',subtle:'850',strong:'800',outline:'700',separator:'700','ct-default':'25','ct-strong':'white','ct-subtle':'250','ct-faint':'400','cm-bg':'850','cm-bg-hover':'800','cm-bg-pressed':'750','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'700'}
};

const DEFAULT_SURF_D = {
  bright:           {bg:'850',subtle:'800',strong:'750',outline:'700',separator:'700','ct-default':'50','ct-strong':'white','ct-subtle':'250','ct-faint':'450','cm-bg':'800','cm-bg-hover':'750','cm-bg-pressed':'700','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'700'},
  base:             {bg:'900',subtle:'850',strong:'800',outline:'750',separator:'700','ct-default':'50','ct-strong':'white','ct-subtle':'250','ct-faint':'450','cm-bg':'850','cm-bg-hover':'800','cm-bg-pressed':'750','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'700'},
  dim:              {bg:'900',subtle:'850',strong:'800',outline:'750',separator:'750','ct-default':'75','ct-strong':'white','ct-subtle':'250','ct-faint':'450','cm-bg':'850','cm-bg-hover':'800','cm-bg-pressed':'750','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'750'},
  deep:             {bg:'black',subtle:'900',strong:'850',outline:'800',separator:'750','ct-default':'75','ct-strong':'white','ct-subtle':'300','ct-faint':'450','cm-bg':'900','cm-bg-hover':'850','cm-bg-pressed':'800','cm-outline':'700','cm-outline-hover':'600','cm-outline-pressed':'550','cm-separator':'750'},
  container:        {bg:'850',subtle:'800',strong:'750',outline:'700',separator:'700','ct-default':'50','ct-strong':'white','ct-subtle':'250','ct-faint':'450','cm-bg':'800','cm-bg-hover':'750','cm-bg-pressed':'700','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'700'},
  'over-container': {bg:'800',subtle:'750',strong:'700',outline:'600',separator:'600','ct-default':'50','ct-strong':'white','ct-subtle':'200','ct-faint':'400','cm-bg':'750','cm-bg-hover':'700','cm-bg-pressed':'600','cm-outline':'550','cm-outline-hover':'500','cm-outline-pressed':'450','cm-separator':'600'},
  float:            {bg:'750',subtle:'700',strong:'600',outline:'550',separator:'550','ct-default':'25','ct-strong':'white','ct-subtle':'200','ct-faint':'300','cm-bg':'700','cm-bg-hover':'600','cm-bg-pressed':'550','cm-outline':'500','cm-outline-hover':'450','cm-outline-pressed':'400','cm-separator':'550'},
  inverse:          {bg:'900',subtle:'850',strong:'800',outline:'700',separator:'700','ct-default':'25','ct-strong':'white','ct-subtle':'250','ct-faint':'400','cm-bg':'850','cm-bg-hover':'800','cm-bg-pressed':'750','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'700'}
};

const DEFAULT_SURF_LA = {bg:'25',subtle:'50',strong:'75',outline:'175',separator:'175','ct-default':'800','ct-strong':'900','ct-subtle':'700','ct-faint':'500','cm-bg':'white','cm-bg-hover':'25','cm-bg-pressed':'50','cm-outline':'175','cm-outline-hover':'200','cm-outline-pressed':'250','cm-separator':'175'};
const DEFAULT_SURF_DA = {bg:'900',subtle:'850',strong:'800',outline:'750',separator:'750','ct-default':'75','ct-strong':'white','ct-subtle':'150','ct-faint':'400','cm-bg':'850','cm-bg-hover':'800','cm-bg-pressed':'750','cm-outline':'600','cm-outline-hover':'550','cm-outline-pressed':'500','cm-separator':'750'};

const DEFAULT_LIGHT_MAP = {
  'content-default':'550','content-strong':'600','content-subtle':'350','content-faint':'200',
  'component-bg-default':'500','component-bg-hover':'550','component-bg-pressed':'600',
  'component-outline-default':'300','component-outline-hover':'350','component-outline-pressed':'450',
  'component-separator':'100',
  'container-bg':'50','container-hover':'75','container-pressed':'100','container-outline':'200','container-separator':'100',
  'on-component':'fixed-white','on-container':'600'
};

const DEFAULT_DARK_MAP = {
  'content-default':'150','content-strong':'100','content-subtle':'200','content-faint':'350',
  'component-bg-default':'450','component-bg-hover':'350','component-bg-pressed':'300',
  'component-outline-default':'450','component-outline-hover':'350','component-outline-pressed':'300',
  'component-separator':'750',
  'container-bg':'800','container-hover':'750','container-pressed':'700','container-outline':'550','container-separator':'750',
  'on-component':'fixed-white','on-container':'100'
};

/**
 * Normalize a semantic map — converts legacy integer indices to step name strings.
 * This ensures backward compatibility with config.json files that used the old format.
 */
function normalizeSemanticMap(map) {
  if (!map) return map;
  const normalized = {};
  for (const [key, val] of Object.entries(map)) {
    if (typeof val === 'number') {
      normalized[key] = val === -1 ? 'fixed-white' : STEP_NAMES[val];
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
}

// ── Palette generation ────────────────────────────────────────

function buildPalettes(paletteKeys, opts) {
  const palettes = {};
  for (const [key, hex] of Object.entries(paletteKeys)) {
    palettes[key] = generatePalette(hex, opts);
  }
  return palettes;
}

// Build a step-name → hex lookup for a palette
function stepLookup(palette) {
  const map = {};
  for (const step of palette.steps) {
    map[step.name] = step.hex;
  }
  return map;
}

// ── Token generators ──────────────────────────────────────────

/**
 * Generate primitive color tokens from palettes.
 * Returns { light: { 'prim-brand-white': '#FFFFFF', ... } }
 * (primitives have no dark block — all values are in :root)
 */
function generatePrimitiveTokens(palettes) {
  const light = {};
  // Palette prefix mapping: palette key → CSS prefix
  for (const [key, palette] of Object.entries(palettes)) {
    for (const step of palette.steps) {
      light[`prim-${key}-${step.name}`] = step.hex;
    }
  }
  return { light, dark: {} };
}

/**
 * Generate typography primitive tokens from a project's typography config.
 *
 * Emits, into `primitiveTokens.light`:
 *   --font-family-{role}      (headline | body | code)   stack string
 *   --font-size-{N}           (e.g. 14)                   "{N}px"
 *   --font-weight-{name}      (regular | medium | …)      "400"
 *   --line-height-{name}      (tight | snug | …)          unitless
 *   --letter-spacing-{name}   (tight | normal | …)        "{N}em"
 *
 * Same shape as colour primitives so the sync server can layer it onto the
 * parsed primitives.css without special-casing. The sync server's
 * normalizeFigmaValue() converts letter-spacing em → % at the Figma
 * boundary; font-size keeps its px suffix; weight stays numeric.
 *
 * If no typographyConfig is present we fall back to the default preset
 * (Neutral System) so every project ships with valid font tokens.
 */
// Density scales the size ladder + line-height-normal so the editor's
// compact/comfortable choice ships to Figma. Mirrors TYPO_DENSITY in
// demo/editor-v2/editor-v2.js — keep in lockstep or Figma will diverge
// from the web preview the moment a designer toggles density.
const TYPO_DENSITY_SCALE = { compact: 0.92, base: 1, comfortable: 1.08 };
const TYPO_DENSITY_LH    = { compact: 1.375, base: 1.5, comfortable: 1.625 };

// Build a CSS font-family stack from a bare family name (the shape the
// editor stores in `overrides`/`custom`). Mirrors typoStackFor() in
// demo/editor-v2/editor-v2.js so the sync server emits the same stack
// the web preview is showing — if these drift, Figma swatches a font
// the browser was actually substituting from a fallback.
function typoStackFor(role, raw) {
  const name = String(raw || '').trim();
  if (!name) return null;
  const needsQuote = /\s/.test(name) && !/^["']/.test(name);
  const quoted = needsQuote ? `"${name}"` : name;
  if (role === 'code') return `${quoted}, "SF Mono", Menlo, Consolas, monospace`;
  return `${quoted}, system-ui, -apple-system, sans-serif`;
}

function generateTypographyTokens(typoConfig) {
  const cfg = typoConfig && typoConfig.preset
    ? typoConfig
    : { preset: DEFAULT_TYPOGRAPHY_PRESET };

  // Resolve preset → fonts. The editor uses preset === 'custom' for
  // "bring your own"; for that case start with the neutral-system
  // stack so unspecified roles still ship a valid family, then
  // overlay the designer's picks below.
  const isCustomPreset = cfg.preset === 'custom';
  const preset = TYPOGRAPHY_PRESETS[cfg.preset]
              || TYPOGRAPHY_PRESETS[DEFAULT_TYPOGRAPHY_PRESET];
  const fonts = (cfg.fonts && Object.keys(cfg.fonts).length) ? cfg.fonts : preset.fonts;

  // Apply per-role overrides + custom picks the editor writes. Editor
  // stores these as bare family names ("Inter", "Playfair Display");
  // we wrap them through typoStackFor() so the shipped font-family
  // value matches the web preview's stack exactly.
  const overrides = (cfg.overrides && typeof cfg.overrides === 'object') ? cfg.overrides : {};
  const customs   = (cfg.custom    && typeof cfg.custom    === 'object') ? cfg.custom    : {};
  // Uploaded-font payloads: { headline?: { family, format, dataUrl, fileName }, ... }
  // Family name takes precedence over the typed customs[role] when both
  // are set for the same role — the file IS the source of truth (it's
  // what we'll ship as @font-face) and the typed name might be a
  // future install the user planned. The full payload (dataUrl, format)
  // is preserved verbatim in cfg.customFontFiles so consumers (web
  // bundler, future Figma font upload, doc page) can read it directly.
  const customFiles = (cfg.customFontFiles && typeof cfg.customFontFiles === 'object') ? cfg.customFontFiles : {};

  // Density scales font-size + line-height-normal. Defaults to base
  // so legacy configs (no density key) keep their original ladder.
  const density = (cfg.density && TYPO_DENSITY_SCALE[cfg.density]) ? cfg.density : 'base';
  const scale   = TYPO_DENSITY_SCALE[density];

  // Ladder: every preset shares the same scale today (Phase 1). Custom
  // configs may override individual ladders for advanced users.
  const ladder = cfg.ladder || TYPOGRAPHY_LADDER;
  const sizes = ladder.sizes || TYPOGRAPHY_LADDER.sizes;
  const weights = ladder.weights || TYPOGRAPHY_LADDER.weights;
  const lineHeights = ladder.lineHeights || TYPOGRAPHY_LADDER.lineHeights;
  const letterSpacings = ladder.letterSpacings || TYPOGRAPHY_LADDER.letterSpacings;

  const light = {};

  // 1. Base font-families from preset (skipped entirely for 'custom'
  //    so the overlay step is the only source — otherwise a partial
  //    custom config inherits neutral-system fallbacks unintentionally
  //    on roles the designer left blank).
  if (!isCustomPreset) {
    for (const [role, font] of Object.entries(fonts)) {
      if (font && font.stack) light[`font-family-${role}`] = font.stack;
    }
  }
  // 2. Custom-preset role picks overlay first (only applies when the
  //    designer selected the Custom card). Bare family name → full stack.
  if (isCustomPreset) {
    for (const role of ['headline', 'body', 'code']) {
      const fam = customs[role];
      const stack = typoStackFor(role, fam);
      if (stack) light[`font-family-${role}`] = stack;
    }
  }
  // 2b. Uploaded font files override the typed custom name for the
  //     same role — the @font-face block we ship references this
  //     family, so the token must point at it too. Applies for ANY
  //     preset (custom OR a built-in preset where the designer only
  //     swapped out one role with an embedded file).
  for (const role of ['headline', 'body', 'code']) {
    const f = customFiles[role];
    if (f && f.family && f.dataUrl) {
      const stack = typoStackFor(role, f.family);
      if (stack) light[`font-family-${role}`] = stack;
    }
  }
  // 3. Per-role overrides take precedence over both preset and custom
  //    — same precedence as typoResolvedFonts() in the editor.
  for (const role of ['headline', 'body', 'code']) {
    const fam = overrides[role];
    const stack = typoStackFor(role, fam);
    if (stack) light[`font-family-${role}`] = stack;
  }

  // 4. Sizes — scaled by density, rounded to .1px so Figma's number
  //    picker doesn't show 14.72000004. We keep the original token
  //    NAME (font-size-14) even when scaled, so existing component
  //    aliases (var(--font-size-14)) still resolve — only the value
  //    moves with density.
  for (const px of sizes) {
    const scaled = Math.round(px * scale * 10) / 10;
    light[`font-size-${px}`] = `${scaled}px`;
  }

  // 5. Weights — unchanged by density.
  for (const [name, val] of Object.entries(weights)) {
    light[`font-weight-${name}`] = String(val);
  }

  // 6. Line-heights — density only retunes the 'normal' rung (1.375 /
  //    1.5 / 1.625). The other rungs (tight/snug/relaxed/loose) keep
  //    their absolute values because they are explicit designer
  //    choices, not density-derived.
  const lhOverrides = { normal: TYPO_DENSITY_LH[density] };
  for (const [name, val] of Object.entries(lineHeights)) {
    const final = (lhOverrides[name] != null) ? lhOverrides[name] : val;
    light[`line-height-${name}`] = String(final);
  }

  // 7. Letter-spacings — unchanged by density.
  for (const [name, val] of Object.entries(letterSpacings)) {
    light[`letter-spacing-${name}`] = String(val);
  }

  return { light, dark: {} };
}

/**
 * Generate semantic tokens from semantic map + palettes.
 * Returns { light: { 'primary-content-default': '#hex', ... }, dark: { ... } }
 *
 * @param {Object} semanticMap — { light: {...}, dark: {...} }
 * @param {Object} palettes — generated palette objects keyed by palette name
 * @param {Array} [customRoles] — custom roles from config (already migrated)
 */
function generateSemanticTokens(semanticMap, palettes, customRoles) {
  const lightMap = normalizeSemanticMap(semanticMap.light) || DEFAULT_LIGHT_MAP;
  const darkMap  = normalizeSemanticMap(semanticMap.dark)  || DEFAULT_DARK_MAP;
  const light = {};
  const dark = {};

  // Include built-in roles + any custom roles from config
  const allRoles = [...TOKEN_ROLES];
  if (customRoles) {
    for (const cr of customRoles) {
      if (cr.id && !allRoles.includes(cr.id)) {
        allRoles.push(cr.id);
      }
    }
  }

  for (const role of allRoles) {
    const palKey = ROLE_TO_PALETTE_KEY[role] || role;
    const palette = palettes[palKey];
    if (!palette) continue;
    const look = stepLookup(palette);

    for (const [prop, stepName] of Object.entries(lightMap)) {
      light[`${role}-${prop}`] = resolveStep(role, prop, stepName, look);
    }
    for (const [prop, stepName] of Object.entries(darkMap)) {
      dark[`${role}-${prop}`] = resolveStep(role, prop, stepName, look);
    }

    // ── AA auto-swap for on-component ────────────────────────
    // config.json's semantic map is per-PROPERTY (one on-component
    // value applied to every role). That can never round-trip what
    // the editor's per-role AA-fix produces — e.g. Pearl's bright
    // magenta brand needs DARK text while danger/success/info on
    // the same project need WHITE. Without this swap the sync
    // server would emit white for every role and Figma would
    // diverge from the web preview (the original Pearl bug).
    //
    // We re-derive on-component from the role's own component-bg
    // fills, using the exact same rule as the editor's solver
    // (deriveOnComponent in demo/editor-v2/solver.js). The config
    // value is treated as a hint; AA always wins.
    //
    // We test against ALL THREE fill states (default + hover +
    // pressed), not just default — a button uses one foreground
    // colour across hover/pressed, so the colour must be readable
    // on the WORST fill, not the friendliest. Pearl brand caught
    // this: black passed AA on default #C737D9 but failed on
    // pressed #9803A9; worst-case derivation picks white instead.
    const lFills = [
      light[`${role}-component-bg-default`],
      light[`${role}-component-bg-hover`],
      light[`${role}-component-bg-pressed`]
    ].filter(Boolean);
    const dFills = [
      dark[`${role}-component-bg-default`],
      dark[`${role}-component-bg-hover`],
      dark[`${role}-component-bg-pressed`]
    ].filter(Boolean);
    if (lFills.length) {
      const wanted = deriveOnComponent(lFills);
      if (light[`${role}-on-component`] !== wanted) {
        light[`${role}-on-component`] = wanted;
      }
    }
    if (dFills.length) {
      const wanted = deriveOnComponent(dFills);
      if (dark[`${role}-on-component`] !== wanted) {
        dark[`${role}-on-component`] = wanted;
      }
    }
  }

  return { light, dark };
}

/**
 * Generate surface tokens from surface map + palettes.
 * Respects surfacePaletteSrc to pick the correct palette per surface.
 * Returns { light: { 'surface-bright-bg': '#hex', ... }, dark: { ... },
 *           paletteSrc: { 'surface-bright-bg': 'desaturated', ... } }
 */
function generateSurfaceTokens(surfaceMap, palettes, surfacePaletteSrc) {
  const monoPal = palettes.brand;
  if (!monoPal) return null;

  // Default palette source: accent → brand, all others → greyscale
  const defaultSrc = {};
  for (const sn of SURFACE_NAMES) defaultSrc[sn] = sn === 'accent' ? 'brand' : 'greyscale';
  const srcMap = { ...defaultSrc, ...(surfacePaletteSrc || {}) };

  // Map role names used in color-system editor to actual palette keys
  const roleToKey = { ...ROLE_TO_PALETTE_KEY };

  const surfL  = surfaceMap?.light       || DEFAULT_SURF_L;
  const surfD  = surfaceMap?.dark        || DEFAULT_SURF_D;
  const surfLA = surfaceMap?.lightAccent || DEFAULT_SURF_LA;
  const surfDA = surfaceMap?.darkAccent  || DEFAULT_SURF_DA;

  const light = {};
  const dark = {};
  const palSrc = {};  // track which palette each token came from

  for (const name of SURFACE_NAMES) {
    const isAccent = name === 'accent';
    const lMap  = isAccent ? surfLA : surfL[name];
    const dMap  = isAccent ? surfDA : surfD[name];

    // Resolve the palette for this surface
    const srcRole = srcMap[name] || 'greyscale';
    const palKey  = roleToKey[srcRole] || srcRole;
    const palette = palettes[palKey] || palettes.greyscale;
    const look    = stepLookup(palette);

    if (!lMap || !dMap) continue;

    for (const prop of SURF_PROP_ORDER) {
      const cssName = `surface-${name}-${prop}`;
      // Backwards-compat: 'elevated' was the old key for 'strong' in saved surfaceMaps.
      // Project configs written before the rename still use 'elevated'; fall back to it
      // so those projects don't get #000000 for every surface-*-strong token.
      const lStep = lMap[prop] ?? (prop === 'strong' ? lMap['elevated'] : undefined);
      const dStep = dMap[prop] ?? (prop === 'strong' ? dMap['elevated'] : undefined);
      light[cssName] = look[lStep] || '#000000';
      dark[cssName]  = look[dStep] || '#000000';
      palSrc[cssName] = palKey;
    }
  }

  return { light, dark, paletteSrc: palSrc };
}

// ── Main export ───────────────────────────────────────────────

/**
 * Generate token override objects from a project config.
 * Each returned object has the same shape as parseCSSTokens():
 *   { light: { cssVarName: hexValue }, dark: { ... } }
 *
 * Fields not present in config are omitted (caller should fall
 * back to CSS-parsed values for those).
 *
 * @param {Object} config — project config.json contents
 * @param {Object} basePrimitiveTokens — existing parsed primitives
 *   (non-color tokens like spacing/font are preserved from here)
 * @returns {{ primitiveTokens?, semanticTokens?, surfaceTokens? }}
 */
export function generateTokenOverrides(config, basePrimitiveTokens) {
  if (!config?.paletteKeys) return {};

  // ── Migrate stale custom-N palette keys → label slugs ─────────
  // The editor sometimes saves 'custom-1' instead of the label slug.
  // Fix it here so the build always produces the correct variable names.
  if (config.customRoles) {
    for (const cr of config.customRoles) {
      if (/^custom-\d+$/.test(cr.id) && cr.label) {
        const oldId = cr.id;
        const newId = cr.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';
        if (config.paletteKeys[oldId]) {
          config.paletteKeys[newId] = config.paletteKeys[oldId];
          delete config.paletteKeys[oldId];
        }
        if (config.surfacePaletteSrc) {
          for (const sn of Object.keys(config.surfacePaletteSrc)) {
            if (config.surfacePaletteSrc[sn] === oldId) config.surfacePaletteSrc[sn] = newId;
          }
        }
        cr.id = newId;
      }
    }
  }

  // Anchor MUST default to 'exact' so step-500 == the user's key colour.
  // Defaulting to 'normalized' shifts step-500 onto the L*=49 tone curve
  // (e.g. #07CBCF -> #008588), so the static build produced primitives.css
  // that disagreed with what the user picked in onboard and what the editor
  // (which uses 'exact') shows. Projects can still opt into 'normalized'
  // explicitly via config.paletteAnchor.
  const palettes = buildPalettes(config.paletteKeys, { anchor: config.paletteAnchor || 'exact' });
  const result = {};

  // Primitives: overlay config-derived colors onto existing tokens
  // (preserves spacing, font-size, font-weight, etc. from CSS)
  // Strip all prim-* color tokens from base — they are fully regenerated from config.
  // This prevents stale palette names (e.g. custom-1) from persisting.
  const baseLight = {};
  const baseDark = {};
  for (const [k, v] of Object.entries(basePrimitiveTokens.light || {})) {
    if (!k.startsWith('prim-')) baseLight[k] = v;
  }
  for (const [k, v] of Object.entries(basePrimitiveTokens.dark || {})) {
    if (!k.startsWith('prim-')) baseDark[k] = v;
  }
  const colorTokens = generatePrimitiveTokens(palettes);
  // Typography always emits (defaults to neutral-system preset when no
  // typographyConfig is set). Sits alongside palette primitives so the
  // sync server, build-static, and editor all consume identical token
  // sets — there is no second source of truth for fonts.
  const typoTokens = generateTypographyTokens(config.typographyConfig);
  result.primitiveTokens = {
    light: { ...baseLight, ...colorTokens.light, ...typoTokens.light },
    dark:  { ...baseDark,  ...colorTokens.dark,  ...typoTokens.dark }
  };

  // Semantics: full replacement if config has semanticMap
  if (config.semanticMap) {
    result.semanticTokens = generateSemanticTokens(config.semanticMap, palettes, config.customRoles);
  }

  // Surfaces: full replacement if config has surfaceMap, defaults if not
  result.surfaceTokens = generateSurfaceTokens(
    config.surfaceMap || null, palettes, config.surfacePaletteSrc || null
  );

  return result;
}
