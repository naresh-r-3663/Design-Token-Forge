#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   audit-token-drift.cjs

   Guarantees that what the editor saved to projects/<id>/*.css
   matches what build-static.js emits to dist/projects/<id>/*.css.

   Any non-empty diff is a regression: either the build pipeline
   is mutating source files (the bug fixed in ee1dff5) or a CSS
   file was edited outside the editor and the deploy is stale.

   Usage:
     node scripts/audit-token-drift.cjs          # all projects
     node scripts/audit-token-drift.cjs pearl    # one project

   Exit codes:
     0  every file matches
     1  one or more files drifted (CI gate)
     2  build failed for a project
   ════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PROJ_DIR = path.join(ROOT, 'projects');
const DIST_DIR = path.join(ROOT, 'dist', 'projects');
const FILES   = ['primitives.css', 'semantic.css', 'surfaces.css'];

function listProjects() {
  if (!fs.existsSync(PROJ_DIR)) return [];
  return fs.readdirSync(PROJ_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => fs.existsSync(path.join(PROJ_DIR, d.name, 'config.json')))
    .map(d => d.name);
}

function build(project) {
  try {
    execFileSync(
      'node',
      [path.join(ROOT, 'packages/sync-server/build-static.js'), '--project', project],
      { cwd: path.join(ROOT, 'packages/sync-server'), stdio: 'pipe' }
    );
    return true;
  } catch (e) {
    console.error(`  ✗ build failed for ${project}:\n${e.stderr ? e.stderr.toString() : e.message}`);
    return false;
  }
}

function diff(a, b) {
  // Cheap byte-level compare. Source and dist are both written
  // verbatim by the build (mirror copyFileSync) so they should be
  // bit-identical — no whitespace normalisation needed.
  if (!fs.existsSync(a)) return { ok: false, reason: 'source missing' };
  if (!fs.existsSync(b)) return { ok: false, reason: 'dist missing' };
  const aBuf = fs.readFileSync(a);
  const bBuf = fs.readFileSync(b);
  if (aBuf.equals(bBuf)) return { ok: true };
  // build-static.js intentionally appends a typography block to the dist
  // primitives.css (sourced from typographyConfig) that is NOT present in
  // the editor-saved source. Strip that sentinel-delimited block from the
  // dist before comparing so the append is not flagged as drift.
  const TYPO_SENTINEL = '\n/* ── Typography primitives (appended by build-static;';
  function stripTypoAppend(str) {
    const idx = str.indexOf(TYPO_SENTINEL);
    return idx >= 0 ? str.slice(0, idx) : str;
  }
  const aStr = stripTypoAppend(aBuf.toString('utf8'));
  const bStr = stripTypoAppend(bBuf.toString('utf8'));
  if (aStr === bStr) return { ok: true };
  // First differing line — helpful for CI logs without spamming.
  const aLines = aStr.split('\n');
  const bLines = bStr.split('\n');
  const n = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < n; i++) {
    if (aLines[i] !== bLines[i]) {
      return { ok: false, reason: `line ${i + 1}: \n    source: ${aLines[i] || '(end)'}\n    dist:   ${bLines[i] || '(end)'}` };
    }
  }
  return { ok: false, reason: 'differs (no line found — encoding mismatch?)' };
}

function main() {
  const arg = process.argv[2];
  const projects = arg ? [arg] : listProjects();
  if (!projects.length) {
    console.error('No projects found under projects/');
    process.exit(0);
  }

  console.log('');
  console.log('  Token Drift Audit');
  console.log('  ─────────────────');
  let drifted = 0;
  let buildFailed = 0;

  for (const proj of projects) {
    if (!build(proj)) { buildFailed++; continue; }
    let projDrift = 0;
    for (const f of FILES) {
      const src = path.join(PROJ_DIR, proj, f);
      const dst = path.join(DIST_DIR, proj, f);
      if (!fs.existsSync(src) && !fs.existsSync(dst)) continue; // both missing → not a tracked file
      const r = diff(src, dst);
      if (!r.ok) {
        if (projDrift === 0) console.log(`  ✗ ${proj}`);
        console.log(`      ${f}  ${r.reason}`);
        projDrift++;
        drifted++;
      }
    }
    if (projDrift === 0) console.log(`  ✓ ${proj}`);
  }

  console.log('');
  if (buildFailed) {
    console.log(`  Result: ${buildFailed} project build(s) failed.`);
    process.exit(2);
  }
  if (drifted) {
    console.log(`  Result: ${drifted} file(s) drifted between editor source and dist.`);
    console.log('  Likely cause: build-static.js is overwriting projects/<id>/*.css,');
    console.log('  or projects/<id>/*.css was edited by hand and the deploy is stale.');
    process.exit(1);
  }
  console.log('  Result: all projects in sync.');
  process.exit(0);
}

main();
