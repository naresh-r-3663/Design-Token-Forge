#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Design Token Forge — v2 migration audit
   ────────────────────────────────────────────────────────────────
   For each project under projects/, reports:
     • schemaVersion gap          (config.json missing schemaVersion:2)
     • palette inventory drift    (--prim-<id>-* in primitives.css
                                   that aren't declared in
                                   config.paletteKeys)
     • customRoles awaiting T1    (config.customRoles[] entries that
                                   v2 should promote to first-class
                                   T1 roles)
     • surfaces drift             (project's surfaces.css differs from
                                   what v2 would regenerate from the
                                   current paletteKeys + default
                                   surface map — flagged as "frozen"
                                   per migration policy D)
     • frozen hex literals        (raw #xxxxxx in semantic.css /
                                   surfaces.css that aren't already
                                   inside a var() chain)

   Usage:
     node scripts/migrate-v2/audit.cjs            # all projects
     node scripts/migrate-v2/audit.cjs <id>       # one project
     node scripts/migrate-v2/audit.cjs --json     # machine-readable

   Emits markdown to stdout by default. Exit code:
     0 — all projects pass (schemaVersion=2 + no migration items)
     1 — at least one project needs migration
     2 — script error
   ════════════════════════════════════════════════════════════════ */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT          = path.resolve(__dirname, '..', '..');
const PROJECTS_DIR  = path.join(ROOT, 'projects');
const STANDARD_PALETTES = ['brand', 'danger', 'warning', 'info', 'success', 'greyscale', 'desaturated'];
const TARGET_SCHEMA = 2;

/* ── arg parsing ─────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const wantJSON = argv.includes('--json');
const onlyId   = argv.find(a => !a.startsWith('--'));

/* ── helpers ─────────────────────────────────────────────────── */
function listProjects() {
  return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => fs.existsSync(path.join(PROJECTS_DIR, name, 'config.json')))
    .sort();
}

function readJSON(p)  { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readFile(p)  { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }

/* Extract palette ids from --prim-<id>-NNN declarations. */
function palettesInPrimitives(css) {
  const ids = new Set();
  const re = /--prim-([a-z][a-z0-9-]*)-\d+\s*:/gi;
  let m;
  while ((m = re.exec(css))) ids.add(m[1]);
  return Array.from(ids).sort();
}

/* Find raw hex literals NOT inside a var() chain. */
function frozenHexes(css) {
  const lines = css.split('\n');
  const hits = [];
  const hexRe = /#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;
  lines.forEach((line, i) => {
    // ignore comments
    if (/^\s*\/?\*/.test(line) || /\*\//.test(line)) return;
    // ignore lines that declare a primitive (those ARE the source)
    if (/--prim-[a-z0-9-]+-\d+\s*:/i.test(line)) return;
    let m;
    while ((m = hexRe.exec(line))) {
      hits.push({ line: i + 1, hex: m[0], snippet: line.trim().slice(0, 80) });
    }
  });
  return hits;
}

function pct(part, whole) {
  if (!whole) return '0%';
  return Math.round((part / whole) * 100) + '%';
}

/* ── per-project audit ───────────────────────────────────────── */
function auditProject(id) {
  const dir         = path.join(PROJECTS_DIR, id);
  const config      = readJSON(path.join(dir, 'config.json'));
  const primitives  = readFile(path.join(dir, 'primitives.css'));
  const semantic    = readFile(path.join(dir, 'semantic.css'));
  const surfaces    = readFile(path.join(dir, 'surfaces.css'));

  const schemaVersion = config.schemaVersion || 1;
  const declaredKeys  = Object.keys(config.paletteKeys || {});
  const palettesInCSS = palettesInPrimitives(primitives);
  const customRoles   = Array.isArray(config.customRoles) ? config.customRoles : [];

  /* Palette inventory drift:
     palettes living in primitives.css that the config doesn't declare. */
  const undeclaredPalettes = palettesInCSS.filter(p => !declaredKeys.includes(p));

  /* customRoles needing T1 promotion:
     v2 currently treats config.customRoles as custom palettes only.
     Each entry should become a first-class T1 role. */
  const t1Pending = customRoles.map(cr => ({
    id: cr.id, label: cr.label || cr.id, keyHex: cr.keyHex || null
  }));

  /* Surfaces drift signal: hand-edited surfaces.css.
     We approximate by counting frozen hex literals; per migration policy
     D, any surfaces.css with frozen hexes is treated as "user-owned" and
     skipped on regenerate. (Full byte-diff vs generator baseline is
     follow-up work — this catches the common case cheaply.) */
  const surfaceFrozen  = frozenHexes(surfaces);
  const semanticFrozen = frozenHexes(semantic);

  /* hasMigrationWork:
     true if a structural migration item needs attention. Frozen
     hex literals are reported as INFO only (current generator
     emits resolved hex by design, so they're noise as a blocker
     until we cut over to var()-only output). */
  const hasMigrationWork =
    schemaVersion < TARGET_SCHEMA ||
    undeclaredPalettes.length > 0 ||
    t1Pending.length > 0;

  return {
    id,
    name: config.name || id,
    owner: config.owner || null,
    schemaVersion,
    targetSchema: TARGET_SCHEMA,
    declaredKeys,
    palettesInCSS,
    undeclaredPalettes,
    customRoles: t1Pending,
    surfaceFrozenCount:  surfaceFrozen.length,
    semanticFrozenCount: semanticFrozen.length,
    surfaceFrozenSample:  surfaceFrozen.slice(0, 5),
    semanticFrozenSample: semanticFrozen.slice(0, 5),
    hasMigrationWork
  };
}

/* ── markdown report ─────────────────────────────────────────── */
function renderMd(reports) {
  const lines = [];
  lines.push('# Editor v2 — Project migration audit');
  lines.push('');
  lines.push(`_Target schema: \`schemaVersion: ${TARGET_SCHEMA}\`_`);
  lines.push('');

  /* summary */
  const need = reports.filter(r => r.hasMigrationWork);
  const ok   = reports.filter(r => !r.hasMigrationWork);
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Status | Count | Projects |`);
  lines.push(`|--------|-------|----------|`);
  lines.push(`| Needs migration | ${need.length} | ${need.map(r => '`' + r.id + '`').join(', ') || '—'} |`);
  lines.push(`| Ready (v2 native) | ${ok.length} | ${ok.map(r => '`' + r.id + '`').join(', ') || '—'} |`);
  lines.push('');

  /* per project */
  reports.forEach(r => {
    lines.push(`## \`${r.id}\``);
    lines.push('');
    lines.push(`- **Status:** ${r.hasMigrationWork ? '⚠️ needs migration' : '✅ ready'}`);
    lines.push(`- **Schema:** \`${r.schemaVersion}\` → target \`${r.targetSchema}\``);
    lines.push(`- **Declared palettes:** ${r.declaredKeys.length} (${r.declaredKeys.join(', ') || '—'})`);
    lines.push(`- **Palettes in primitives.css:** ${r.palettesInCSS.length}`);
    lines.push('');

    if (r.undeclaredPalettes.length) {
      lines.push(`### Palette inventory drift`);
      lines.push('');
      lines.push(`Palettes present in \`primitives.css\` but missing from \`config.paletteKeys\`:`);
      lines.push('');
      r.undeclaredPalettes.forEach(p => lines.push(`- \`${p}\``));
      lines.push('');
      lines.push(`> **Action:** add each to \`config.paletteKeys\` with its anchor hex, OR delete the primitive block from \`primitives.css\`.`);
      lines.push('');
    }

    if (r.customRoles.length) {
      lines.push(`### customRoles awaiting T1 promotion`);
      lines.push('');
      lines.push(`These are declared in \`config.customRoles\` and should be promoted to first-class T1 roles in v2:`);
      lines.push('');
      r.customRoles.forEach(cr => lines.push(`- \`${cr.id}\` — "${cr.label}" (anchor \`${cr.keyHex || 'n/a'}\`)`));
      lines.push('');
      lines.push(`> **Action:** v2 will offer "Promote to T1 role" in the migration banner. Until promoted, these render as custom palettes only.`);
      lines.push('');
    }

    if (r.surfaceFrozenCount || r.semanticFrozenCount) {
      lines.push(`### Resolved-hex inventory (info only)`);
      lines.push('');
      lines.push(`The current generator emits resolved hex values in semantic.css / surfaces.css instead of \`var(--prim-*)\` references. This is informational — does NOT block v2 migration. When the var()-only generator lands, these counts should drop to 0.`);
      lines.push('');
      lines.push(`| File | Resolved-hex count |`);
      lines.push(`|------|--------------------|`);
      lines.push(`| \`semantic.css\` | ${r.semanticFrozenCount} |`);
      lines.push(`| \`surfaces.css\` | ${r.surfaceFrozenCount} |`);
      lines.push('');
    }
  });

  return lines.join('\n');
}

/* ── main ────────────────────────────────────────────────────── */
function main() {
  let ids;
  try {
    ids = onlyId ? [onlyId] : listProjects();
    if (onlyId && !fs.existsSync(path.join(PROJECTS_DIR, onlyId, 'config.json'))) {
      console.error(`✗ project not found: ${onlyId}`);
      process.exit(2);
    }
  } catch (e) {
    console.error('✗ unable to list projects:', e.message);
    process.exit(2);
  }

  const reports = ids.map(auditProject);
  const exitCode = reports.some(r => r.hasMigrationWork) ? 1 : 0;

  if (wantJSON) {
    process.stdout.write(JSON.stringify({ targetSchema: TARGET_SCHEMA, reports }, null, 2) + '\n');
  } else {
    process.stdout.write(renderMd(reports) + '\n');
  }
  process.exit(exitCode);
}

main();
