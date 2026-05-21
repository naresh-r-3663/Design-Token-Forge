// @ts-check
/**
 * Editor v2 — Tt (Typography) tier functional smoke tests
 *
 * DOM-only behavioural tests. The editor wraps state in an IIFE so we
 * never reach inside; every assertion reads observable affordances
 * (data-active, button text, modal visibility, emitted <style> tags).
 *
 * Coverage:
 *   1. Preset switch toggles data-active on the picked card.
 *   2. Density seg toggles data-active and shows scaled body px.
 *   3. Install dialog opens from sticky footer, lists Google Fonts,
 *      and closes via Got it / Escape.
 *   4. Reset Type clears density change back to baseline.
 *   5. Density change shows up in the preview iframe's typo override
 *      <style> tag (the live preview round-trip).
 *
 * Run with: pnpm exec playwright test tests/editor-v2/typography.spec.js
 */
const { test, expect } = require('@playwright/test');
const path = require('path');

const EDITOR_URL = 'file://' + path.resolve(__dirname, '../../demo/editor-v2/index.html');

/* The demo wraps every page in an auth gate that hides body content
   until a GitHub PAT is verified. For local DOM smoke tests we don't
   need a real PAT — we just need the gate to release the body. The
   gate's fast-path (auth-gate.js L150) trusts:
     sessionStorage 'dtf-auth-ok' === '1' AND localStorage 'dtf-gh-pat'
   Set both before goto() via addInitScript so they exist on the
   very first script tick (auth-gate.js runs in <head>, before <body>). */
async function seedAuth(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('dtf-gh-pat', 'test-token-not-real');
      localStorage.setItem('dtf-gh-user', 'playwright');
      localStorage.setItem('dtf-session-epoch', '2');
      sessionStorage.setItem('dtf-auth-ok', '1');
    } catch (_e) {}
  });
}

/* Force-navigate to Tt tier — click the tier tab and wait for the
   preset grid to render. */
async function gotoTt(page) {
  await seedAuth(page);
  await page.goto(EDITOR_URL);
  await page.click('button.ev2-tier[data-tier="tt"]');
  await page.waitForSelector('.ev2-typo-preset[data-preset]', { state: 'visible' });
}

test.describe('Tt tier — preset selection', () => {
  test('clicking a preset card sets data-active on exactly that card', async ({ page }) => {
    await gotoTt(page);

    await page.click('.ev2-typo-preset[data-preset="modern-geometric"]');

    const activeCount = await page.locator('.ev2-typo-preset[data-active]').count();
    expect(activeCount).toBe(1);

    const activeId = await page.locator('.ev2-typo-preset[data-active]').getAttribute('data-preset');
    expect(activeId).toBe('modern-geometric');
  });

  test('switching presets moves data-active to the new card', async ({ page }) => {
    await gotoTt(page);

    await page.click('.ev2-typo-preset[data-preset="modern-geometric"]');
    await page.click('.ev2-typo-preset[data-preset="editorial-serif"]');

    const activeId = await page.locator('.ev2-typo-preset[data-active]').getAttribute('data-preset');
    expect(activeId).toBe('editorial-serif');
    expect(await page.locator('.ev2-typo-preset[data-active]').count()).toBe(1);
  });
});

test.describe('Tt tier — density', () => {
  test('density seg toggles data-active', async ({ page }) => {
    await gotoTt(page);

    await page.click('.ev2-typo-density-opt[data-density="compact"]');
    let active = await page.locator('.ev2-typo-density-opt[data-active]').getAttribute('data-density');
    expect(active).toBe('compact');

    await page.click('.ev2-typo-density-opt[data-density="comfortable"]');
    active = await page.locator('.ev2-typo-density-opt[data-active]').getAttribute('data-density');
    expect(active).toBe('comfortable');

    expect(await page.locator('.ev2-typo-density-opt[data-active]').count()).toBe(1);
  });

  test('density labels show the scaled body px + line-height', async ({ page }) => {
    await gotoTt(page);

    const compactSub = page.locator('.ev2-typo-density-opt[data-density="compact"] .ev2-typo-density-sub');
    await expect(compactSub).toContainText('12');
    await expect(compactSub).toContainText('1.375');

    const comfortSub = page.locator('.ev2-typo-density-opt[data-density="comfortable"] .ev2-typo-density-sub');
    await expect(comfortSub).toContainText('14');
    await expect(comfortSub).toContainText('1.625');
  });
});

test.describe('Tt tier — install dialog', () => {
  test('sticky footer opens the install modal with Google-Fonts rows', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-preset[data-preset="editorial-serif"]');

    const stickyBtn = page.locator('#ttInstallOpen');
    await expect(stickyBtn).toBeVisible();
    await stickyBtn.click();

    const modal = page.locator('#ev2TtInstall');
    await expect(modal).toBeVisible();

    const googleRows = modal.locator('.ev2-typo-install-row[data-lane="google"]');
    expect(await googleRows.count()).toBeGreaterThan(0);

    const firstLink = googleRows.first().locator('a.ev2-typo-install-action');
    await expect(firstLink).toHaveAttribute('href', /fonts\.google\.com\/specimen\//);
  });

  test('install modal closes via Got it button', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-preset[data-preset="editorial-serif"]');
    await page.click('#ttInstallOpen');

    const modal = page.locator('#ev2TtInstall');
    await expect(modal).toBeVisible();

    await modal.locator('.ev2-modal-actions button.ev2-modal-btn-primary').click();
    await expect(modal).toBeHidden();
  });

  test('install modal closes via Escape', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-preset[data-preset="editorial-serif"]');
    await page.click('#ttInstallOpen');

    const modal = page.locator('#ev2TtInstall');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('all-system preset shows the green "nothing to install" path', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-preset[data-preset="neutral-system"]');
    await page.click('#ttInstallOpen');

    const modal = page.locator('#ev2TtInstall');
    await expect(modal).toBeVisible();

    await expect(modal.locator('.ev2-typo-install-ok')).toBeVisible();
    expect(await modal.locator('.ev2-typo-install-row[data-lane="google"]').count()).toBe(0);
    expect(await modal.locator('.ev2-typo-install-row[data-lane="custom"]').count()).toBe(0);
  });
});

test.describe('Tt tier — Reset Type', () => {
  test('Reset Type clears density change back to base', async ({ page }) => {
    await gotoTt(page);

    await page.click('.ev2-typo-density-opt[data-density="compact"]');
    expect(await page.locator('.ev2-typo-density-opt[data-active]').getAttribute('data-density')).toBe('compact');

    await page.click('#sectionResetBtn');

    expect(await page.locator('.ev2-typo-density-opt[data-active]').getAttribute('data-density')).toBe('base');
  });
});

test.describe('Tt tier — live preview round-trip', () => {
  test('preset switch injects an override <style> in the preview iframe', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-preset[data-preset="editorial-serif"]');

    const frame = page.frameLocator('iframe').first();

    await expect.poll(async () => {
      return await frame.locator('style').evaluateAll(nodes =>
        nodes.map(n => n.textContent || '').join('')
      );
    }, { timeout: 5000 }).toMatch(/Fraunces/);
  });

  test('density switch updates --line-height-normal in preview override', async ({ page }) => {
    await gotoTt(page);
    await page.click('.ev2-typo-density-opt[data-density="comfortable"]');

    const frame = page.frameLocator('iframe').first();

    await expect.poll(async () => {
      return await frame.locator('style').evaluateAll(nodes =>
        nodes.map(n => n.textContent || '').join('')
      );
    }, { timeout: 5000 }).toMatch(/--line-height-normal\s*:\s*1\.625/);
  });
});

/* The Custom Fonts modal accepts .woff2 / .woff / .ttf / .otf file
   uploads. Once a file is attached, the modal shows a "filename
   pill", the family name pre-fills, and (on Apply) an @font-face
   block lands in the preview iframe pointing at the data: URL. */
test.describe('Tt tier — Custom font file upload', () => {
  // A tiny, valid base64-encoded "file" we hand to the file input via
  // setInputFiles. The contents aren't a real font — we only assert
  // the JS pipeline accepts the upload, derives a family name from
  // the filename, and emits an @font-face block. The browser won't
  // actually render glyphs from these bytes, but the data: URL still
  // round-trips into the @font-face src.
  const FAKE_WOFF2 = Buffer.from('woof', 'utf8');

  test('uploading a .woff2 stages the family name + shows the pill', async ({ page }) => {
    await gotoTt(page);
    await page.click('#ttCustomOpen');
    await page.waitForSelector('#ev2TtCustom:not([hidden])');

    await page.setInputFiles('#ttCustomFileHeadline', {
      name: 'MyBrand-Display.woff2',
      mimeType: 'font/woff2',
      buffer: FAKE_WOFF2
    });

    /* Filename pill should appear and the text input should
       pre-fill with the derived family ("MyBrand-Display"). */
    await expect(page.locator('.ev2-tt-modal-file-name[data-role="headline"]')).toBeVisible();
    await expect(page.locator('#ttCustomHeadline')).toHaveValue('MyBrand-Display');

    /* The fileops row should mark itself embedded so the Upload
       button hides and the Clear (×) button appears. */
    await expect(page.locator('.ev2-tt-modal-fileops[data-role="headline"]'))
      .toHaveAttribute('data-embedded', '');
    await expect(page.locator('.ev2-tt-modal-file-clear[data-role="headline"]')).toBeVisible();
  });

  test('Apply ships @font-face for the upload into the preview iframe', async ({ page }) => {
    await gotoTt(page);
    await page.click('#ttCustomOpen');
    await page.waitForSelector('#ev2TtCustom:not([hidden])');

    await page.setInputFiles('#ttCustomFileBody', {
      name: 'MyBodyFace.woff2',
      mimeType: 'font/woff2',
      buffer: FAKE_WOFF2
    });
    await page.click('#ttCustomApply');

    const frame = page.frameLocator('iframe').first();

    await expect.poll(async () => {
      return await frame.locator('style').evaluateAll(nodes =>
        nodes.map(n => n.textContent || '').join('')
      );
    }, { timeout: 5000 }).toMatch(/@font-face[\s\S]*MyBodyFace[\s\S]*font\/woff2;base64/);

    /* Editor's own document gets the @font-face too so the
       Custom tile sample paints in the uploaded face. */
    await expect.poll(async () => {
      const txt = await page.locator('#ev2-typo-faces').textContent();
      return txt || '';
    }, { timeout: 2000 }).toMatch(/MyBodyFace/);
  });

  test('clearing the staged file removes the pill', async ({ page }) => {
    await gotoTt(page);
    await page.click('#ttCustomOpen');
    await page.waitForSelector('#ev2TtCustom:not([hidden])');

    await page.setInputFiles('#ttCustomFileCode', {
      name: 'CodeFace.woff2',
      mimeType: 'font/woff2',
      buffer: FAKE_WOFF2
    });
    await expect(page.locator('.ev2-tt-modal-file-name[data-role="code"]')).toBeVisible();

    await page.click('.ev2-tt-modal-file-clear[data-role="code"]');

    await expect(page.locator('.ev2-tt-modal-file-name[data-role="code"]')).toBeHidden();
    await expect(page.locator('.ev2-tt-modal-fileops[data-role="code"]'))
      .not.toHaveAttribute('data-embedded', '');
  });

  test('install dialog reports embedded fonts in their own row', async ({ page }) => {
    await gotoTt(page);
    await page.click('#ttCustomOpen');
    await page.waitForSelector('#ev2TtCustom:not([hidden])');
    await page.setInputFiles('#ttCustomFileHeadline', {
      name: 'BrandHeadline.woff2',
      mimeType: 'font/woff2',
      buffer: FAKE_WOFF2
    });
    await page.click('#ttCustomApply');

    /* Sticky-footer summary should mention embedded count. */
    await expect(page.locator('#ttInstallOpen')).toContainText(/embedded/i);

    await page.click('#ttInstallOpen');
    const modal = page.locator('#ev2TtInstall');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ev2-typo-install-row[data-lane="embedded"]')).toContainText('BrandHeadline');
  });
});

