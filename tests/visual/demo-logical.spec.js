// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const DEMO_DIR = path.resolve(__dirname, "../../demo");
const PROJECTS_DIR = path.resolve(__dirname, "../../projects");

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

test.describe("demo logical QC", () => {
  test("radio: outlined variant reflects in density and deep surface labels remain readable", async ({ page }) => {
    const projectId = "desktop-pdf-editor";
    const projectCss = readProjectCss(projectId);

    await seedAuthState(page);
    await seedProjectTheme(page, projectId, projectCss);

    await page.goto(demoURL("radio"));
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);

    const beforeBg = await page.$eval(
      "#densityScale .radio .radio__circle",
      (el) => getComputedStyle(el).backgroundColor
    );

    await page.click('#variantBar .pill[data-ctrl-variant="outlined"]');
    await page.waitForTimeout(200);

    const afterBg = await page.$eval(
      "#densityScale .radio .radio__circle",
      (el) => getComputedStyle(el).backgroundColor
    );

    expect(afterBg).not.toBe(beforeBg);

    const deepSurface = await page.$eval("#surfaceDeep", (panel) => {
      const label = panel.querySelector(".radio__label");
      if (!label) return null;
      const bg = getComputedStyle(panel).backgroundColor;
      const fg = getComputedStyle(label).color;
      return { bg, fg };
    });

    expect(deepSurface).not.toBeNull();

    const toRgb = (s) => {
      const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
    };

    const ratio = contrastRatio(toRgb(deepSurface.bg), toRgb(deepSurface.fg));
    expect(ratio).toBeGreaterThan(3);
  });
});
