// e2e/dark-palette.spec.ts — the half of the app nothing was testing.
//
// A field pass over herbanium.app found a run of visual bugs and every
// one of them was in dark mode. That was not luck. `?dev` toggles a
// `force-light` class onto <html>, the whole
// `@media (prefers-color-scheme: dark)` block is guarded by
// `:root:not(.force-light)`, and twenty of the suite's twenty-five
// boots go through `?dev` — so the dark palette was switched off at the
// root for almost every test that has ever run. The other five did not
// emulate dark either. Dark was not under-tested; it was unreachable.
//
// The bug that prompted this: OmenCard and ElementalArrivalCard each
// hardcoded `rgba(232, 220, 192, 0.86)` as their reveal scrim — a
// light-palette literal in a codebase whose theme.js promises "every
// inline style picks up dark mode without any per-component wiring".
// The second had copied the first. In dark mode, summoning an elemental
// flashed cream over a near-black app.
//
// So the assertion here is deliberately not "the scrim is the right
// color". It is the CLASS of mistake: with the app in its dark
// palette, nothing large should be painting a light surface. A check
// pinned to one component's value would have to be extended by hand for
// every next one, which is how the first two diverged.
import { test, expect, type Page } from "@playwright/test";
import { bootDark } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** Perceived lightness 0..1 of a computed color, ignoring transparents. */
const LUMA = `(css) => {
  const m = css.match(/rgba?\\(([^)]+)\\)/);
  if (!m) return null;
  const p = m[1].split(",").map(Number);
  if (p.length > 3 && p[3] === 0) return null;
  return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
}`;

/** Every sizeable painted surface on screen, with its lightness. */
async function surfaces(page: Page) {
  return page.evaluate(([lumaSrc]) => {
    const luma = eval(lumaSrc) as (css: string) => number | null;
    const out: { tag: string; testid: string; luma: number; area: number }[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      // Big enough to be a surface rather than a chip, pill or icon.
      if (area < 40_000) continue;
      const l = luma(getComputedStyle(el).backgroundColor);
      if (l == null) continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        testid: el.getAttribute("data-testid") || el.getAttribute("data-tour") || "",
        luma: Math.round(l * 100) / 100,
        area: Math.round(area),
      });
    }
    return out;
  }, [LUMA]);
}

test.describe("the dark palette", () => {
  test("is actually on — the guard against a vacuous suite", async ({ page }) => {
    /* FIRST, because every other assertion in this file is worthless if
       it isn't. `force-light` silently makes dark and light identical,
       which is the trap tours.spec.ts documents and the reason the rest
       of the suite never saw any of this. */
    await bootDark(page);
    const ivory = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--ivory").trim());
    expect(ivory.toLowerCase(),
      `--ivory resolved to ${ivory}; the app is still in the light palette, so `
      + `nothing below proves anything`).toBe("#0f1410");
    await expect(page.locator("html")).not.toHaveClass(/force-light/);
  });

  test("paints no large light surface on any main tab", async ({ page }) => {
    await bootDark(page);
    const offenders: string[] = [];
    for (const tab of ["Home", "Apothecary", "Journal", "Profile"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await page.waitForTimeout(400);
      for (const s of await surfaces(page)) {
        // 0.6 is comfortably above every dark-palette surface (--cream,
        // the lightest, sits near 0.13) and below anything that reads as
        // a light-mode value. It is a class boundary, not a tuned one.
        if (s.luma > 0.6) {
          offenders.push(`${tab}: <${s.tag}${s.testid ? ` ${s.testid}` : ""}> `
            + `luma ${s.luma} over ${s.area}px²`);
        }
      }
    }
    expect(offenders, `light surfaces in the dark palette:\n    ${offenders.join("\n    ")}`)
      .toEqual([]);
  });

  test("keeps the reveal wash dark when an elemental arrives", async ({ page }) => {
    /* The reported bug, at its own component rather than through the
       lodestone — reaching the summon needs a queued arrival the dev
       seed does not have, and the value is what was wrong. Read off the
       resolved custom property so this fails if the token stops
       inverting, which is the actual regression. */
    await bootDark(page);
    const veil = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--veil-rgb").trim());
    const [r, g, b] = veil.split(",").map(Number);
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    expect(luma,
      `the reveal wash resolved to rgb(${veil}) — luma ${luma.toFixed(2)}. In the dark `
      + `palette it must be a dark ground, or summoning flashes the screen light.`)
      .toBeLessThan(0.2);
  });

  test("no component hardcodes a light surface color", async () => {
    /* The generalisation, and the half a rendered check cannot reach:
       most of these components only appear in states a spec cannot
       cheaply build. A literal light rgb() in an inline style is a
       value that cannot follow the theme, whatever screen it is on. */
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.jsx?$/.test(name)) continue;
        readFileSync(p, "utf8").split("\n").forEach((line, i) => {
          const m = line.match(/(?:background|backgroundColor):\s*"rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) return;
          const [, r, g, b] = m.map(Number);
          const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          if (luma > 0.6) hits.push(`${p}:${i + 1} → rgb(${r}, ${g}, ${b})`);
        });
      }
    };
    walk("src");
    expect(hits, `these paint a light surface that cannot follow the theme — use a `
      + `token:\n    ${hits.join("\n    ")}`).toEqual([]);
  });
});
