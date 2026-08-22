// e2e/track-order.spec.ts — the strips hold their rows still while you
// drag.
//
// REPORTED: "when changing temp or time, shouldn't resort the
// mind/body/palate graphs. I saw detailed categories switching position
// back and forth as they usurped each others values which read glitchy."
//
// It was true, and only in Detailed mode. Rows are ordered by family so
// a strip reads the same across a drag; in Detailed the rows are leaf
// tokens, every leaf of a family shares its family's position, and the
// tie broke on the leaf's CURRENT PEAK. Two leaves cross as the water
// cools, and they swap rows under the reader.
//
// WHAT THIS FILE IS AND IS NOT, because the difference matters.
// tests/track-order.test.mjs is the guard: it holds the comparator
// against the vocabulary and fails if either the family ordering or
// the leaf ordering is removed. Verified both ways.
//
// This one is a FLOW-LEVEL SMOKE CHECK, and it does not reproduce the
// reported swap. Three attempts are recorded so nobody repeats them:
// comparing the order before and after a min/max drag; sweeping both
// axes in ten steps; and pointing it at Moroccan Mint, which a
// catalogue-wide computation showed has `minty` and `cooling` swapping
// peak order with steep time (130 of 49 blends have some such pair).
// All three passed with the old peak tie-break restored.
//
// The reason is visibility, not ordering: the strip renders a handful
// of secondary rows, and the crossings sit mostly among the rows below
// that cap. Rows drop in and out as the sliders move — `brisk` and
// `uplifting` do it on this very blend — and what is left on screen
// happens to keep its order anyway.
//
// So this asserts the user-level claim (drag the sliders, the rows
// that stay do not reshuffle) and is honest that it would not have
// caught the bug. It is worth keeping as the thing that walks the real
// screen; it is not worth trusting as the regression guard.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, ensureBrewPanel } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** The rows on every strip, top to bottom, as names. */
const rowOrder = (page: Page) =>
  page.locator('[data-testid="bar-row"]')
    .evaluateAll(els => els.map(e => e.getAttribute("data-bar") || ""));

async function openExplorerDetailed(page: Page) {
  await boot(page);
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Recipes", exact: true }).click();
  /* MOROCCAN MINT, NOT WHATEVER IS FIRST, and this is the difference
     between a test and a decoration. Peaks are sampled across the
     TEMPERATURE axis at the current steep time, so it is TIME that
     moves them — and two leaves have to actually cross for a
     value-based tie-break to show itself. Computed over the whole
     catalogue: 130 blends have a same-family pair that flips with
     steep time, and this one has the cleanest, `minty` and `cooling`
     in the fresh family swapping straight over.

     The first version of this spec opened whatever recipe sat first
     and passed with the defect restored. */
  await page.locator('[data-tour="recipes-filter"]')
    .getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("button", { name: /Moroccan Mint/i }).first().click();
  await ensureBrewPanel(page);

  /* DETAILED IS THE MODE THAT BROKE. Simple rows are families, which
     have distinct positions and never tied, so a test left on Simple
     would pass against the defect. */
  const detailed = page.getByRole("button", { name: "Detailed", exact: true });
  if (await detailed.count() > 0) await detailed.first().click();
  await expect(page.locator('[data-testid="bar-row"]').first())
    .toBeVisible({ timeout: 30_000 });
}

test.describe("dragging the brew sliders", () => {
  test("does not reorder the rows", async ({ page }) => {
    await openExplorerDetailed(page);

    const before = await rowOrder(page);
    expect(before.length, "there should be rows to reorder").toBeGreaterThan(3);

    /* SWEEP, DON'T JUST VISIT THE ENDS. Two leaves cross at one
       particular temperature; land only on min and max and you can sit
       on the same side of every crossing at both, which is how the
       first version of this test passed with the defect put back. Ten
       stops across each axis walks through the crossings instead of
       stepping over them. */
    const moved: Array<{ at: string; rows: string[] }> = [];
    for (const [axis, label] of [
      ["brew-axis-tempC", "Water temperature"],
      ["brew-axis-timeS", "Steep time"],
    ] as const) {
      await page.getByTestId(axis).click();
      const slider = page.getByLabel(label);
      await expect(slider).toBeVisible();
      const lo = Number(await slider.getAttribute("min"));
      const hi = Number(await slider.getAttribute("max"));
      const step = Number(await slider.getAttribute("step")) || 1;
      for (let k = 0; k <= 10; k++) {
        const raw = lo + ((hi - lo) * k) / 10;
        const v = Math.round(raw / step) * step;
        await slider.fill(String(v));
        await page.waitForTimeout(60);
        moved.push({ at: `${label} ${v}`, rows: await rowOrder(page) });
      }
    }

    /* The set may legitimately change — a row can drop below the
       visibility floor at one end of the range, or appear at the
       other. What must not change is the ORDER of whatever is
       showing, so compare the shared rows in sequence. */
    for (const { at, rows } of moved) {
      const shared = before.filter(n => rows.includes(n));
      const inAfter = rows.filter(n => shared.includes(n));
      expect(inAfter,
        `at ${at} the rows came back in a different order\n` +
        `  before: ${shared.join(" ")}\n  after:  ${inAfter.join(" ")}`)
        .toEqual(shared);
    }
  });
});
