// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const DEMO_DIR = path.resolve(__dirname, "../../demo");
const PROJECTS_DIR = path.resolve(__dirname, "../../projects");

const COMPONENTS = [
  "alert",
  "avatar",
  "badge",
  "button",
  "checkbox",
  "datepicker",
  "file-upload",
  "icon-button",
  "input",
  "menu-button",
  "progress-bar",
  "progress-circle",
  "radio",
  "select",
  "slider",
  "split-button",
  "textarea",
  "toast",
  "toggle",
  "tooltip",
];

function demoURL(name) {
  return `file://${path.join(DEMO_DIR, name + ".html")}`;
}

function readProjectCss(projectId) {
  const parts = [
    path.join(PROJECTS_DIR, projectId, "primitives.css"),
    path.join(PROJECTS_DIR, projectId, "semantic.css"),
    path.join(PROJECTS_DIR, projectId, "surfaces.css"),
  ];
  return parts.map((p) => fs.readFileSync(p, "utf8")).join("\n");
}

async function seedAuthState(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("dtf-session-epoch", "2");
      localStorage.setItem("dtf-gh-pat", "ghp_visual_snapshot_token");
      localStorage.setItem("dtf-gh-user", "visual-snapshot");
      localStorage.setItem("dtf-gh-owner", "visual-snapshot");
      sessionStorage.setItem("dtf-auth-ok", "1");
    } catch (_) {}
  });
}

async function seedProjectTheme(page, projectId, cssText) {
  await page.addInitScript(
    ({ id, css }) => {
      try {
        localStorage.setItem("dtf-active-project", id);
        localStorage.setItem(
          "dtf-known-projects",
          JSON.stringify([{ id, name: id, owner: "visual-snapshot" }])
        );
        localStorage.setItem("dtf-saved-tokens-" + id, css);
        localStorage.setItem("dtf-saved-tokens", css);
      } catch (_) {}
    },
    { id: projectId, css: cssText }
  );
}

function parseRgb(input) {
  const m = String(input || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function colorDistance(a, b) {
  if (!a || !b) return Infinity;
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(rgbA, rgbB) {
  const la = luminance(rgbA);
  const lb = luminance(rgbB);
  const [l1, l2] = la > lb ? [la, lb] : [lb, la];
  return (l1 + 0.05) / (l2 + 0.05);
}

test.describe("demo consistency QC", () => {
  test("surface panel label mapping matches rendered panel background", async ({ page }) => {
    const projectId = "desktop-pdf-editor";
    const projectCss = readProjectCss(projectId);

    await seedAuthState(page);
    await seedProjectTheme(page, projectId, projectCss);

    for (const component of COMPONENTS) {
      await page.goto(demoURL(component));
      await page.waitForLoadState("load");
      await page.waitForTimeout(250);

      const rows = await page.$$eval(".surface-panel", (panels) => {
        return panels.map((panel) => {
          const label = panel.querySelector(".surface-panel-label");
          return {
            label: label ? label.textContent.trim() : "",
            renderedBg: getComputedStyle(panel).backgroundColor,
          };
        });
      });

      for (const row of rows) {
        const tokenName = row.label.toLowerCase();
        if (!/^surface-[a-z0-9-]+$/.test(tokenName)) continue;

        const expectedBg = await page.evaluate((token) => {
          const probe = document.createElement("div");
          probe.style.backgroundColor = `var(--${token})`;
          document.body.appendChild(probe);
          const v = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return v;
        }, tokenName);

        const renderedRgb = parseRgb(row.renderedBg);
        const expectedRgb = parseRgb(expectedBg);
        const delta = colorDistance(renderedRgb, expectedRgb);

        expect(
          delta,
          `${component}: panel label ${tokenName} mismatches rendered background (${row.renderedBg} vs ${expectedBg})`
        ).toBeLessThanOrEqual(3);
      }
    }
  });

  test("global variant and size bars propagate to synced previews", async ({ page }) => {
    const projectId = "desktop-pdf-editor";
    const projectCss = readProjectCss(projectId);

    await seedAuthState(page);
    await seedProjectTheme(page, projectId, projectCss);

    for (const component of COMPONENTS) {
      await page.goto(demoURL(component));
      await page.waitForLoadState("load");
      await page.waitForTimeout(250);

      const hasVariantBar = (await page.locator("#variantBar").count()) > 0;
      if (hasVariantBar) {
        const variantPills = page.locator("#variantBar .pill");
        const variantCount = await variantPills.count();
        if (variantCount > 1) {
          const target = await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll("#variantBar .pill"));
            const current = pills.find((p) => p.getAttribute("aria-pressed") === "true");
            const preferred = pills.find(
              (p) => p.dataset.ctrlVariant && p.dataset.ctrlVariant !== (current && current.dataset.ctrlVariant)
            );
            const fallback = pills.find((p) => p !== current);
            const pick = preferred || fallback;
            return pick ? pick.dataset.ctrlVariant || "" : null;
          });

          if (target !== null) {
            const before = await page.evaluate((targetVariant) => {
              const synced = Array.from(document.querySelectorAll('[class*="synced-"], .synced'));
              const matching = targetVariant
                ? synced.filter((el) => el.getAttribute("data-variant") === targetVariant).length
                : synced.filter((el) => !el.hasAttribute("data-variant")).length;
              return { total: synced.length, matching };
            }, target);

            const selector = target
              ? `#variantBar .pill[data-ctrl-variant="${target}"]`
              : "#variantBar .pill[data-ctrl-variant='']";
            await page.click(selector);
            await page.waitForTimeout(120);

            const after = await page.evaluate((targetVariant) => {
              const synced = Array.from(document.querySelectorAll('[class*="synced-"], .synced'));
              const matching = targetVariant
                ? synced.filter((el) => el.getAttribute("data-variant") === targetVariant).length
                : synced.filter((el) => !el.hasAttribute("data-variant")).length;
              return { total: synced.length, matching };
            }, target);

            if (after.total > 0) {
              expect(
                after.matching,
                `${component}: variant bar selection did not propagate to synced previews`
              ).toBeGreaterThan(before.matching);
            }
          }
        }
      }

      const hasSizeBar = (await page.locator("#sizeBar").count()) > 0;
      if (hasSizeBar) {
        const sizePills = page.locator("#sizeBar .pill");
        const sizeCount = await sizePills.count();
        if (sizeCount > 1) {
          const targetSize = await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll("#sizeBar .pill"));
            const current = pills.find((p) => p.getAttribute("aria-pressed") === "true");
            const preferred = pills.find(
              (p) => p.dataset.ctrlSize === "huge" && p !== current
            );
            const fallback = pills.find((p) => p !== current);
            const pick = preferred || fallback;
            return pick ? pick.dataset.ctrlSize || null : null;
          });

          if (targetSize) {
            const before = await page.evaluate((size) => {
              const synced = Array.from(document.querySelectorAll('[class*="synced-"], .synced'));
              const matching = synced.filter((el) => el.getAttribute("data-size") === size).length;
              return { total: synced.length, matching };
            }, targetSize);

            await page.click(`#sizeBar .pill[data-ctrl-size="${targetSize}"]`);
            await page.waitForTimeout(120);

            const after = await page.evaluate((size) => {
              const synced = Array.from(document.querySelectorAll('[class*="synced-"], .synced'));
              const matching = synced.filter((el) => el.getAttribute("data-size") === size).length;
              return { total: synced.length, matching };
            }, targetSize);

            if (after.total > 0) {
              expect(
                after.matching,
                `${component}: size bar selection did not propagate to synced previews`
              ).toBeGreaterThan(before.matching);
            }
          }
        }
      }
    }
  });

  test("hero inspector shows resolved values and no broken placeholders", async ({ page }) => {
    const projectId = "desktop-pdf-editor";
    const projectCss = readProjectCss(projectId);

    await seedAuthState(page);
    await seedProjectTheme(page, projectId, projectCss);

    for (const component of COMPONENTS) {
      await page.goto(demoURL(component));
      await page.waitForLoadState("load");
      await page.waitForTimeout(250);

      const hasInspector = (await page.locator("#heroInspector").count()) > 0;
      if (!hasInspector) continue;

      const inspector = await page.evaluate(() => {
        const el = document.querySelector("#heroInspector");
        if (!el) return { rowCount: 0, text: "", unresolved: 0, valueLikeRows: 0 };
        const rows = Array.from(el.querySelectorAll(".inspector-row"));
        const text = (el.textContent || "").trim();

        let unresolved = 0;
        let valueLikeRows = 0;
        rows.forEach((row) => {
          const t = (row.textContent || "").toLowerCase();
          if (t.includes("undefined") || t.includes("nan")) unresolved++;
          if (/rgb\(|hsl\(|px|ms|#|\d/.test(t) && !/^\s*\u2014\s*$/.test(t)) valueLikeRows++;
        });

        return { rowCount: rows.length, text, unresolved, valueLikeRows };
      });

      expect(inspector.rowCount, `${component}: hero inspector has no token rows`).toBeGreaterThan(0);
      expect(inspector.unresolved, `${component}: hero inspector contains undefined/NaN`).toBe(0);
      expect(
        inspector.valueLikeRows,
        `${component}: hero inspector rows do not contain resolved values`
      ).toBeGreaterThan(0);
    }
  });

  test("playground chain reacts to controls and deep-surface labels keep minimum contrast", async ({ page }) => {
    const projectId = "desktop-pdf-editor";
    const projectCss = readProjectCss(projectId);

    await seedAuthState(page);
    await seedProjectTheme(page, projectId, projectCss);

    for (const component of COMPONENTS) {
      await page.goto(demoURL(component));
      await page.waitForLoadState("load");
      await page.waitForTimeout(250);

      const hasChain = (await page.locator("#pgChain").count()) > 0;
      if (hasChain) {
        const before = await page.$eval("#pgChain", (el) => (el.textContent || "").trim());

        const surfaceA = page.locator('select[data-pg-surface="A"]');
        const roleA = page.locator('select[data-pg-role="A"]');

        if ((await surfaceA.count()) > 0) {
          const nextSurface = await page.evaluate(() => {
            const sel = document.querySelector('select[data-pg-surface="A"]');
            if (!sel) return null;
            const options = Array.from(sel.options).map((o) => o.value);
            const pick = options.find((v) => v !== sel.value);
            return pick || null;
          });
          if (nextSurface) await surfaceA.selectOption(nextSurface);
        }

        if ((await roleA.count()) > 0) {
          const nextRole = await page.evaluate(() => {
            const sel = document.querySelector('select[data-pg-role="A"]');
            if (!sel) return null;
            const options = Array.from(sel.options).map((o) => o.value);
            const pick = options.find((v) => v !== sel.value);
            return pick || null;
          });
          if (nextRole) await roleA.selectOption(nextRole);
        }

        await page.waitForTimeout(120);
        const after = await page.$eval("#pgChain", (el) => (el.textContent || "").trim());

        expect(before.length, `${component}: playground chain is empty before interaction`).toBeGreaterThan(0);
        expect(after.length, `${component}: playground chain is empty after interaction`).toBeGreaterThan(0);

        const hasSelectableControls = ((await surfaceA.count()) > 0) || ((await roleA.count()) > 0);
        if (hasSelectableControls) {
          expect(after, `${component}: playground chain did not react to control changes`).not.toBe(before);
        }
      }

      const contrastFindings = await page.evaluate(() => {
        const selectors = [
          ".surface-panel--deep .radio__label",
          ".surface-panel--deep .checkbox__label",
          ".surface-panel--deep .switch-label__text",
          ".surface-panel--deep .input__label",
          ".surface-panel--deep .select__label",
          ".surface-panel--deep .textarea__label",
          ".surface-panel--deep .btn__label",
          ".surface-panel--deep .split-btn__label",
          ".surface-panel--deep .menu-btn__label"
        ];

        const toRgb = (input) => {
          const m = String(input || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
        };

        const luminance = (rgb) => {
          const [r, g, b] = rgb.map((c) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const contrast = (a, b) => {
          const la = luminance(a);
          const lb = luminance(b);
          const l1 = Math.max(la, lb);
          const l2 = Math.min(la, lb);
          return (l1 + 0.05) / (l2 + 0.05);
        };

        const deepPanel = document.querySelector(".surface-panel--deep");
        if (!deepPanel) return [];
        const panelBg = toRgb(getComputedStyle(deepPanel).backgroundColor);
        if (!panelBg) return [];

        const nodes = selectors.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
        const unique = Array.from(new Set(nodes));
        return unique
          .filter((node) => {
            const text = (node.textContent || "").trim();
            const style = getComputedStyle(node);
            return text.length > 0 && style.display !== "none" && style.visibility !== "hidden";
          })
          .map((node) => {
            const fg = toRgb(getComputedStyle(node).color);
            if (!fg) return null;
            return {
              text: (node.textContent || "").trim().slice(0, 40),
              ratio: contrast(panelBg, fg),
            };
          })
          .filter(Boolean);
      });

      for (const finding of contrastFindings) {
        expect(
          finding.ratio,
          `${component}: deep surface text contrast too low for "${finding.text}"`
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
