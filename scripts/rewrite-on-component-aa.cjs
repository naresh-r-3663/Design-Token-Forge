#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   rewrite-on-component-aa.cjs

   One-shot retroactive rewrite: for every projects/<id>/semantic.css,
   recompute each role's --<role>-on-component value using the SAME
   worst-case-fill rule the editor + sync server now use, and write
   it back in place (only when it differs).

   Why: editor + sync now derive on-component against the worst of
   { default, hover, pressed } fills, but existing semantic.css
   files were written with the old default-only rule. Until a user
   re-saves the project, the deployed web preview would diverge
   from Figma. This script fast-forwards every project.

   Idempotent: re-running on already-fixed files is a no-op.
   ═══════════════════════════════════════════════════════════════ */
const fs   = require('fs');
const path = require('path');

const FIXED_WHITE = '#FFFFFF';
const FIXED_BLACK = '#0A0A0A';
const ROLES = ['brand', 'danger', 'success', 'warning', 'info'];

// ── WCAG contrast (mirror of palette-engine.wcagContrast) ────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16)
  ];
}
function relLum([r, g, b]) {
  const s = [r, g, b].map(c => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function contrast(a, b) {
  const la = relLum(hexToRgb(a));
  const lb = relLum(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function deriveOnComponent(fills) {
  const list = fills.filter(Boolean);
  if (!list.length) return FIXED_WHITE;
  let minW = Infinity, minB = Infinity;
  for (const f of list) {
    const rW = contrast(f, FIXED_WHITE);
    const rB = contrast(f, FIXED_BLACK);
    if (rW < minW) minW = rW;
    if (rB < minB) minB = rB;
  }
  return minB > minW ? FIXED_BLACK : FIXED_WHITE;
}

// ── Parser: split file into mode blocks ──────────────────────
// File has two top-level blocks: `:root { ... }` (light) and
// `[data-theme="dark"] { ... }` (dark). Brace-counting walk is
// safer than a regex because tokens may sit at any depth.
function splitBlocks(css) {
  const blocks = [];
  let i = 0;
  while (i < css.length) {
    // Find selector start
    const braceOpen = css.indexOf('{', i);
    if (braceOpen < 0) break;
    const selector = css.slice(i, braceOpen).trim().split(/\s+/).pop();
    // Find matching close
    let depth = 1, j = braceOpen + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const body = css.slice(braceOpen + 1, j - 1);
    let mode = null;
    if (/:root/.test(css.slice(i, braceOpen))) mode = 'light';
    else if (/\[data-theme="dark"\]/.test(css.slice(i, braceOpen))) mode = 'dark';
    blocks.push({ start: i, end: j, head: css.slice(i, braceOpen + 1), body, mode });
    i = j;
  }
  return blocks;
}

function rewriteBody(body, mode) {
  let changed = false;
  let out = body;
  for (const role of ROLES) {
    const grab = (slot) => {
      const m = new RegExp(`--${role}-component-bg-${slot}\\s*:\\s*(#[0-9a-fA-F]{3,6})`).exec(body);
      return m ? m[1] : null;
    };
    const fills = [grab('default'), grab('hover'), grab('pressed')].filter(Boolean);
    if (!fills.length) continue;
    const wanted = deriveOnComponent(fills);
    const reOn = new RegExp(`(--${role}-on-component\\s*:\\s*)(#[0-9a-fA-F]{3,6})`, 'g');
    out = out.replace(reOn, (full, prefix, current) => {
      if (current.toUpperCase() === wanted.toUpperCase()) return full;
      changed = true;
      return prefix + wanted;
    });
  }
  return { body: out, changed };
}

// ── Main ─────────────────────────────────────────────────────
const root = path.resolve(__dirname, '..');
const projectsDir = path.join(root, 'projects');
const ids = fs.readdirSync(projectsDir)
  .filter(n => fs.statSync(path.join(projectsDir, n)).isDirectory())
  .filter(n => !n.startsWith('_'));

let touched = 0, scanned = 0;
const report = [];

for (const id of ids) {
  const file = path.join(projectsDir, id, 'semantic.css');
  if (!fs.existsSync(file)) continue;
  scanned++;
  const css = fs.readFileSync(file, 'utf8');
  const blocks = splitBlocks(css);
  let rebuilt = '';
  let cursor = 0;
  let fileChanged = false;
  const diffs = [];
  for (const b of blocks) {
    rebuilt += css.slice(cursor, b.start);
    if (b.mode) {
      const { body, changed } = rewriteBody(b.body, b.mode);
      if (changed) {
        fileChanged = true;
        // log per-role diffs for the report
        for (const role of ROLES) {
          const oldM = new RegExp(`--${role}-on-component\\s*:\\s*(#[0-9a-fA-F]{3,6})`).exec(b.body);
          const newM = new RegExp(`--${role}-on-component\\s*:\\s*(#[0-9a-fA-F]{3,6})`).exec(body);
          if (oldM && newM && oldM[1].toUpperCase() !== newM[1].toUpperCase()) {
            diffs.push(`    ${b.mode}/${role}: ${oldM[1]} → ${newM[1]}`);
          }
        }
      }
      rebuilt += b.head + body + '}';
    } else {
      rebuilt += css.slice(b.start, b.end);
    }
    cursor = b.end;
  }
  rebuilt += css.slice(cursor);
  if (fileChanged) {
    fs.writeFileSync(file, rebuilt);
    touched++;
    report.push(`✏️  ${id}/semantic.css`);
    report.push(...diffs);
  } else {
    report.push(`✓  ${id}/semantic.css (already AA-correct)`);
  }
}

console.log(report.join('\n'));
console.log(`\nScanned ${scanned} project(s); rewrote ${touched}.`);
