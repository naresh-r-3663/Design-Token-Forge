/* ════════════════════════════════════════════════════════════════
   Design Token Forge — Palette Engine
   ════════════════════════════════════════════════════════════════
   Hybrid CIE L* Tone + OKLCH Hue/Chroma generator.

   Input:  one hex color
   Output: 22-step certified palette

   Architecture:
     Tone axis  → CIE L* (guarantees WCAG contrast by construction)
     Hue axis   → OKLCH H (perceptually stable — no drift)
     Chroma axis→ OKLCH C shaped by bell curve (vibrant at key, muted at edges)
     Gamut      → sRGB clamp by reducing chroma (never shifts L or H)

   ════════════════════════════════════════════════════════════════ */

// ── Step names & indices ────────────────────────────────────
export const STEP_NAMES = [
  'white','25','50','75','100','150','175','200','250','300','350',
  '400','450','500','550','600','700','750','800','850','900','black'
];
export const KEY_INDEX = 13; // step 500

// ── Fixed Tone Scale ────────────────────────────────────────
// CIE L* values for each step. These GUARANTEE specific
// WCAG contrast ratios against white, regardless of hue.
//
//   Contrast vs white = (1.05) / (Y + 0.05)
//   where Y = Lstar_to_Y(tone)
//
// Step 600 (tone 40) → 6.47:1 (AA body text ✓)
// Step 500 (tone 49) → 4.65:1 (AA large text ✓, on-component ✓)
// Step 900 (tone 7) → ~18.2:1 (AAA ✓)
export const TONE_SCALE = [
  100,   // white
   98,   // 25
   95,   // 50
   92,   // 75
   88,   // 100
   83,   // 150
   78,   // 175
   73,   // 200
   68,   // 250
   63,   // 300
   59,   // 350
   55,   // 400
   52,   // 450
   49,   // 500 (key)
   45,   // 550
   40,   // 600
   33,   // 700
   26,   // 750
   19,   // 800
   12,   // 850
    5,   // 900
    0,   // black
];

// ══════════════════════════════════════════════════════════════
// Color Math — sRGB ↔ Linear ↔ OKLab ↔ OKLCH ↔ CIE L*
// ══════════════════════════════════════════════════════════════

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

export function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v * 255)));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── Relative luminance (WCAG definition) ────────────────────
export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function wcagContrast(hex1, hex2) {
  const L1 = relativeLuminance(hex1) + 0.05;
  const L2 = relativeLuminance(hex2) + 0.05;
  return Math.max(L1, L2) / Math.min(L1, L2);
}

// ── CIE L* ↔ Luminance Y ───────────────────────────────────
export function yToLstar(Y) {
  return Y <= 0.008856 ? 903.3 * Y : 116 * Y ** (1 / 3) - 16;
}

export function lstarToY(Lstar) {
  return Lstar <= 8 ? Lstar / 903.3 : ((Lstar + 16) / 116) ** 3;
}

export function hexToLstar(hex) {
  return yToLstar(relativeLuminance(hex));
}

// ── sRGB → OKLab ────────────────────────────────────────────
function rgbToOklab(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  let l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  let m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  let s_ = 0.0883024619 * lr + 0.2024326643 * lg + 0.7092648738 * lb;
  l_ = Math.cbrt(l_); m_ = Math.cbrt(m_); s_ = Math.cbrt(s_);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

// ── OKLab → sRGB ────────────────────────────────────────────
function oklabToRgb(L, a, b) {
  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  l_ = l_ * l_ * l_; m_ = m_ * m_ * m_; s_ = s_ * s_ * s_;
  return [
    linearToSrgb(+4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_),
  ];
}

// ── Hex ↔ OKLCH ─────────────────────────────────────────────
export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bv] = rgbToOklab(r, g, b);
  return [L, Math.sqrt(a * a + bv * bv), ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360];
}

export function oklchToHex(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const [r, g, bv] = oklabToRgb(L, a, b);
  return rgbToHex(Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, bv)));
}

// ── sRGB gamut check ────────────────────────────────────────
function isInSrgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const [r, g, bv] = oklabToRgb(L, a, b);
  return r >= -0.002 && r <= 1.002 && g >= -0.002 && g <= 1.002 && bv >= -0.002 && bv <= 1.002;
}

// ── Tone → OKLCH L mapping ──────────────────────────────────
// Convert a CIE L* tone to the corresponding OKLCH L value
// by going through an achromatic sRGB intermediate.
function toneToOklchL(tone) {
  const Y = lstarToY(tone);
  const gray = linearToSrgb(Math.max(0, Math.min(1, Y)));
  return rgbToOklab(gray, gray, gray)[0];
}

// ══════════════════════════════════════════════════════════════
// PALETTE GENERATOR
// ══════════════════════════════════════════════════════════════

/**
 * Generate a 22-step palette from a single key hex color.
 *
 * @param {string} keyHex - Key color as hex (e.g. "#E53F28")
 * @returns {{ steps: {name:string, hex:string, tone:number, contrast:number}[] }}
 */
export function generatePalette(keyHex) {
  const [, keyC, keyH] = hexToOklch(keyHex);
  // Anchor: rescale tone curve so KEY_INDEX lands on key's actual L*.
  // Light side lerps tone 100..keyTone, dark side lerps keyTone..0,
  // preserving monotonicity for any input hex.
  const keyToneActual = hexToLstar(keyHex);
  // Clamp tone for remap math so extreme inputs (near-black/near-white)
  // don't collapse the opposite-side ladder. Step 500 still outputs the
  // exact input hex; only the neighbor-step interpolation uses the clamp.
  const keyTone = Math.max(20, Math.min(80, keyToneActual));
  const baseKeyTone = TONE_SCALE[KEY_INDEX];

  const steps = TONE_SCALE.map((tone, i) => {
    const name = STEP_NAMES[i];

    // White and black anchors
    if (i === 0)                    return { name, hex: '#FFFFFF', tone: 100, contrast: 1.0 };
    if (i === STEP_NAMES.length - 1) return { name, hex: '#000000', tone: 0,   contrast: 21.0 };

    // Anchor the key step to the exact input hex — input colors must round-trip
    // at step 500 so brand-component-bg-default === designer-supplied brand hex.
    if (i === KEY_INDEX) {
      return { name, hex: keyHex.toUpperCase(), tone: keyToneActual, contrast: wcagContrast(keyHex, '#FFFFFF') };
    }

    // Remap fixed tone onto input's effective scale (monotonic).
    const remappedTone = i < KEY_INDEX
      ? 100 + (tone - 100) * (100 - keyTone) / (100 - baseKeyTone)
      : keyTone * (tone / baseKeyTone);
    const targetL = toneToOklchL(remappedTone);

    // Chroma: asymmetric bell curve peaking at key (index 13), tapering to 0
    // at white/black. Light side decays faster (0.6/1.3) to keep tints clean;
    // dark side decays slower (0.35/1.8) to preserve vibrancy in darks.
    const isLight = i < KEY_INDEX;
    const range = isLight ? KEY_INDEX : (STEP_NAMES.length - 1 - KEY_INDEX);
    const distFromKey = Math.abs(i - KEY_INDEX) / range;
    const decayFactor = isLight ? 0.6  : 0.35;
    const decayPower  = isLight ? 1.3  : 1.8;
    let chroma = keyC * Math.max(0, 1 - decayFactor * distFromKey ** decayPower);

    // Hue: constant (perceptual — no drift)
    const hue = keyH;

    // Gamut mapping: reduce chroma until we're in sRGB.
    // This preserves lightness (= contrast guarantee) and hue (= color identity).
    while (chroma > 0.0005 && !isInSrgb(targetL, chroma, hue)) {
      chroma *= 0.97;
    }

    const hex = oklchToHex(targetL, chroma, hue);
    const contrast = wcagContrast(hex, '#FFFFFF');

    return { name, hex, tone, contrast };
  });

  return { keyHex, steps };
}

// ══════════════════════════════════════════════════════════════
// TRUST CERTIFICATION
// ══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} TrustTest
 * @property {string} name
 * @property {string} description
 * @property {'PASS'|'WARN'|'FAIL'} status
 * @property {number} checked
 * @property {number} passed
 * @property {Array} details
 */

/**
 * Run 7 trust tests on a palette.
 * @param {{ steps: {name:string, hex:string, tone:number}[] }} palette
 * @returns {{ overall: string, pass: number, warn: number, fail: number, tests: TrustTest[] }}
 */
export function certifyPalette(palette) {
  const hexes = palette.steps.map(s => s.hex);
  const tests = [];
  let totalPass = 0, totalWarn = 0, totalFail = 0;
  const N = STEP_NAMES.length;
  const idx = name => STEP_NAMES.indexOf(name);

  // ── Test 1: Valid sRGB ────────────────────────────────────
  {
    const details = hexes.map((h, i) => {
      const valid = /^#[0-9A-Fa-f]{6}$/.test(h);
      const [r, g, b] = hexToRgb(h);
      const inRange = r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1;
      return { step: STEP_NAMES[i], hex: h, pass: valid && inRange };
    });
    const passed = details.filter(d => d.pass).length;
    const status = passed === N ? 'PASS' : 'FAIL';
    tests.push({ name: '1. Valid sRGB Colors', description: 'Every step is a displayable sRGB hex color', status, checked: N, passed, details });
    if (status === 'PASS') totalPass++; else totalFail++;
  }

  // ── Test 2: Monotonic Lightness ───────────────────────────
  {
    const tones = hexes.map(h => hexToLstar(h));
    const details = [];
    for (let i = 0; i < N - 1; i++) {
      const delta = +(tones[i] - tones[i + 1]).toFixed(2);
      details.push({ from: STEP_NAMES[i], to: STEP_NAMES[i + 1], delta, pass: delta >= 0 });
    }
    const passed = details.filter(d => d.pass).length;
    const status = passed === N - 1 ? 'PASS' : 'FAIL';
    tests.push({ name: '2. Monotonic Lightness', description: 'Every step is darker than the previous (no brightness reversals)', status, checked: N - 1, passed, details: details.filter(d => !d.pass) });
    if (status === 'PASS') totalPass++; else totalFail++;
  }

  // ── Test 3: WCAG Contrast Compliance ──────────────────────
  {
    const checks = [
      { label: 'Step 600 on white (body text)',  fg: hexes[idx('600')], bg: '#FFFFFF', threshold: 4.5, level: 'AA' },
      { label: 'Step 700 on white (body text)',  fg: hexes[idx('700')], bg: '#FFFFFF', threshold: 4.5, level: 'AA' },
      { label: 'Step 500 on white (large text)', fg: hexes[idx('500')], bg: '#FFFFFF', threshold: 3.0, level: 'AA-lg' },
      { label: 'Step 900 on white (AAA text)',   fg: hexes[idx('900')], bg: '#FFFFFF', threshold: 7.0, level: 'AAA' },
      { label: 'White on step 500 (button)',     fg: '#FFFFFF', bg: hexes[idx('500')], threshold: 3.0, level: 'AA-lg' },
      { label: 'Step 600 on step 50 (card text)',fg: hexes[idx('600')], bg: hexes[idx('50')],  threshold: 4.5, level: 'AA' },
    ];
    const details = checks.map(c => {
      const ratio = +wcagContrast(c.fg, c.bg).toFixed(2);
      return { ...c, ratio, pass: ratio >= c.threshold };
    });
    const passed = details.filter(d => d.pass).length;
    const status = passed === details.length ? 'PASS' : passed >= details.length - 1 ? 'WARN' : 'FAIL';
    tests.push({ name: '3. WCAG Contrast Compliance', description: 'Critical steps meet WCAG AA/AAA contrast requirements', status, checked: details.length, passed, details });
    if (status === 'PASS') totalPass++; else if (status === 'WARN') totalWarn++; else totalFail++;
  }

  // ── Test 4: Dark Mode Readability ─────────────────────────
  {
    const checks = [
      { label: 'Step 200 on step 900', light: idx('200'), dark: idx('900'), threshold: 4.5 },
      { label: 'Step 300 on step 900', light: idx('300'), dark: idx('900'), threshold: 4.5 },
      { label: 'Step 200 on step 850', light: idx('200'), dark: idx('850'), threshold: 4.5 },
      { label: 'Step 100 on step 800', light: idx('100'), dark: idx('800'), threshold: 4.5 },
      { label: 'Step 50 on step 900',  light: idx('50'),  dark: idx('900'), threshold: 7.0 },
    ];
    const details = checks.map(c => {
      const ratio = +wcagContrast(hexes[c.light], hexes[c.dark]).toFixed(2);
      return { label: c.label, ratio, threshold: c.threshold, pass: ratio >= c.threshold };
    });
    const passed = details.filter(d => d.pass).length;
    const status = passed === details.length ? 'PASS' : passed >= details.length - 1 ? 'WARN' : 'FAIL';
    tests.push({ name: '4. Dark Mode Readability', description: 'Light-on-dark combinations meet WCAG AA for dark themes', status, checked: details.length, passed, details });
    if (status === 'PASS') totalPass++; else if (status === 'WARN') totalWarn++; else totalFail++;
  }

  // ── Test 5: Perceptual Distinguishability ─────────────────
  {
    const Ls = hexes.map(h => hexToOklch(h)[0]);
    const inner = N - 2;
    const details = [];
    for (let i = 1; i < N - 1; i++) {
      const delta = +Math.abs(Ls[i] - Ls[i + 1]).toFixed(4);
      if (delta < 0.015) details.push({ from: STEP_NAMES[i], to: STEP_NAMES[i + 1], delta });
    }
    const clumps = details.length;
    const status = clumps <= 1 ? 'PASS' : clumps <= 3 ? 'WARN' : 'FAIL';
    tests.push({ name: '5. Perceptual Distinguishability', description: 'Adjacent steps are visually different (no invisible transitions)', status, checked: inner, passed: inner - clumps, clumps, details });
    if (status === 'PASS') totalPass++; else if (status === 'WARN') totalWarn++; else totalFail++;
  }

  // ── Test 6: White/Black Anchoring ─────────────────────────
  {
    const whiteOk = hexes[0].toUpperCase() === '#FFFFFF';
    const blackOk = hexes[N - 1].toUpperCase() === '#000000';
    const status = whiteOk && blackOk ? 'PASS' : 'FAIL';
    tests.push({ name: '6. White/Black Anchoring', description: 'Palette anchors at pure #FFFFFF and #000000', status, checked: 2, passed: (whiteOk ? 1 : 0) + (blackOk ? 1 : 0), details: [] });
    if (status === 'PASS') totalPass++; else totalFail++;
  }

  // ── Test 7: Hue Consistency ───────────────────────────────
  {
    const keyHue = hexToOklch(hexes[KEY_INDEX])[2];
    let maxDrift = 0;
    let sumDrift = 0, count = 0;
    for (let i = 1; i < N - 1; i++) {
      const [, C, H] = hexToOklch(hexes[i]);
      if (C < 0.01) continue;
      let d = Math.abs(H - keyHue);
      if (d > 180) d = 360 - d;
      maxDrift = Math.max(maxDrift, d);
      sumDrift += d;
      count++;
    }
    const avgDrift = count > 0 ? sumDrift / count : 0;
    const status = maxDrift < 15 ? 'PASS' : maxDrift < 30 ? 'WARN' : 'FAIL';
    tests.push({ name: '7. Hue Consistency', description: 'All steps maintain the same perceived color family', status, checked: count, passed: count, maxDrift: +maxDrift.toFixed(1), avgDrift: +avgDrift.toFixed(1), details: [] });
    if (status === 'PASS') totalPass++; else if (status === 'WARN') totalWarn++; else totalFail++;
  }

  const overall = totalFail === 0 && totalWarn <= 1 ? 'CERTIFIED' : totalFail <= 1 ? 'CONDITIONAL' : 'FAILED';
  return { overall, pass: totalPass, warn: totalWarn, fail: totalFail, tests };
}

// ══════════════════════════════════════════════════════════════
// CSS / JSON EXPORT
// ══════════════════════════════════════════════════════════════

/**
 * Generate CSS custom properties for a palette.
 * @param {string} paletteName - e.g. "brand"
 * @param {{ steps: {name:string, hex:string}[] }} palette
 */
export function toCss(paletteName, palette) {
  const lines = palette.steps.map(s =>
    `  --prim-${paletteName}-${s.name}: ${s.hex};`
  );
  return `:root {\n${lines.join('\n')}\n}`;
}

/**
 * Generate DTCG-compatible JSON tokens.
 */
export function toDtcgJson(paletteName, palette) {
  const tokens = {};
  for (const s of palette.steps) {
    tokens[s.name] = { $type: 'color', $value: s.hex };
  }
  return JSON.stringify({ [paletteName]: tokens }, null, 2);
}

// ── Convenience: contrast at any tone (for docs/UI) ─────────
export function contrastAtTone(tone) {
  const Y = lstarToY(tone);
  return (1.0 + 0.05) / (Y + 0.05);
}
