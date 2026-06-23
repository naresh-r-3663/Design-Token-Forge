/**
 * Build script for @design-token-forge/tokens
 * Processes each CSS source file through PostCSS → dist/
 */
import { readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const SRC = 'src';
const DIST = 'dist';

const files = (await readdir(SRC)).filter(f => f.endsWith('.css'));

execSync(`mkdir -p ${DIST}`);

for (const file of files) {
  const src = join(SRC, file);
  const out = join(DIST, file);
  console.log(`  ${src} → ${out}`);
  execSync(`npx postcss ${src} --no-map -o ${out}`, { stdio: 'inherit' });
}

console.log(`✓ Built ${files.length} token files to ${DIST}/`);

// Generate interop exports after CSS build
console.log('  Generating interop exports...');
execSync('node ../../scripts/export-dtcg.cjs', { stdio: 'inherit' });
execSync('node ../../scripts/export-tailwind.cjs', { stdio: 'inherit' });
execSync('node ../../scripts/export-style-dictionary.cjs', { stdio: 'inherit' });

// Copy interop outputs into dist/ (so they ship with the package)
execSync('cp ../../dist/tokens.dtcg.json dist/tokens.dtcg.json');
execSync('cp ../../dist/tailwind-preset.mjs dist/tailwind-preset.mjs');
execSync('cp ../../dist/tailwind-preset.cjs dist/tailwind-preset.cjs');
execSync('mkdir -p dist/style-dictionary && cp ../../dist/style-dictionary/tokens.json dist/style-dictionary/tokens.json && cp ../../dist/style-dictionary/config.json dist/style-dictionary/config.json');
console.log('✓ Interop exports copied to dist/');
