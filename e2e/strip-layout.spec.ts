// e2e/strip-layout.spec.ts — the words must not eat the graph.
//
// REPORTED, from a Pixel: "in experiment window when you show
// simple/detailed on my pixel phone, the graph is entirely blocked by
// the text so can't see the detailed underexpressions."
//
// The strip is three columns — a strength gauge, the row labels, and
// the plotted bands. The label column was `flex: 0 0 auto`, so it took
// whatever the longest word needed and the bands got the remainder.
// The rows already ellipsize, but ellipsis only fires inside a
// constrained box and nothing constrained that column, so the text
// always won.
//
// Detail mode is the sharp end: its rows are leaf tokens rather than
// family names, and children carry an indent on top. Measured at 320px
// before the fix, the labels took 98px of a 260px strip and left 102
// for the graph — the mode that most needs the plot had the least of
// it. On a phone with the system font scaled up, which this column had
// no answer to, "entirely blocked" is what that becomes.
//
// So the assertion is a SHARE, not a pixel count: how much of the strip
// the words may take is the same question at every width and every font
// size, which a pixel threshold is not.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, ensureBrewPanel } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** Label column and band column widths for the first strip on screen. */
const columns = (page: Page) => page.evaluate(() => {
  const row = document.querySelector('[data-testid="bar-row"]') as HTMLElement;
  if (!row) return null;
  const strip = row.parentElement?.parentElement as HTMLElement;
  const cols = Array.from(strip.children).map(c => {
    const b = (c as HTMLElement).getBoundingClientRect();
    return { w: Math.round(b.width), flex: getComputedStyle(c as HTMLElement).flex };
  });
  const bands = cols.find(c => c.flex.startsWith("1"));
  // The gauge is a 4px sliver; the label column is the other fixed one.
  const label = cols.filter(c => !c.flex.startsWith("1") && c.w > 10)[0];
  return { label: label?.w ?? 0, bands: bands?.w ?? 0 };
});

test.describe("the extraction strip", () => {
  for (const mode of ["Simple", "Detailed"]) {
    test(`leaves the graph most of the width in ${mode}`, async ({ page }) => {
      await boot(page);
      await page.getByRole("button", { name: "Journal", exact: true }).click();
      await page.locator('[data-tour="subtabs"]')
        .getByRole("button", { name: "Recipes", exact: true }).click();
      await page.locator('[data-tour="recipes-row"]').first().click();
      await ensureBrewPanel(page);

      const toggle = page.getByRole("button", { name: mode, exact: true });
      if (await toggle.count() > 0) await toggle.first().click();
      await expect(page.locator('[data-testid="bar-row"]').first())
        .toBeVisible({ timeout: 30_000 });

      const c = await columns(page);
      expect(c, "the strip should have rendered").not.toBeNull();
      const total = c!.label + c!.bands;
      const share = c!.bands / total;
      expect(share,
        `${mode}: labels take ${c!.label}px of ${total}px, leaving ${c!.bands}px ` +
        `for the graph (${Math.round(share * 100)}%)`)
        .toBeGreaterThanOrEqual(0.55);
    });
  }

  test("and the two modes agree on where the bands start", async ({ page }) => {
    /* The left edge of the plot should not move when you toggle. It
       did: detail rows carried the indent ON TOP of the column's
       minimum, so switching to Detailed shifted every band 12px right
       and shrank the graph by the same. Two readings of one cup should
       line up if you flip between them. */
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Recipes", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);
    await expect(page.locator('[data-testid="bar-row"]').first())
      .toBeVisible({ timeout: 30_000 });

    const widths: Record<string, number> = {};
    for (const mode of ["Simple", "Detailed"]) {
      const toggle = page.getByRole("button", { name: mode, exact: true });
      if (await toggle.count() > 0) await toggle.first().click();
      await page.waitForTimeout(150);
      widths[mode] = (await columns(page))!.label;
    }
    expect(widths.Detailed,
      `the label column is ${widths.Simple}px in Simple and ${widths.Detailed}px ` +
      `in Detailed, so the graph moves when you toggle`)
      .toBe(widths.Simple);
  });
});
