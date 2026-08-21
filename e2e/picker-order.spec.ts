// e2e/picker-order.spec.ts — the picker RANKS candidates by how well
// they fit what is already in the pot, and that ranking is the feature.
//
// This spec exists because the ranking was removed once, by me, on the
// theory that it duplicated the chip's green / yellow / red tint. It
// does not. The color says whether ONE candidate fits; the order
// surfaces which candidates fit without the user scanning fifty-odd
// chips for green. Selecting an ingredient and watching the compatible
// ones rise is how the picker teaches what goes with what — it is the
// answer to "what pairs with this", delivered by the act of choosing.
//
// The cost is real and is not what this spec is for: because the score
// is null on an empty pot and live the moment anything is added, one
// pick reorders the list. Measured across the catalog, an average of
// 9.3 of the ten visible rows change identity after a single pick. A
// fast second tap at a remembered position can therefore land on
// something else. That is a tap-timing problem to be solved without
// giving up the ranking — not a reason to give it up.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** Fit as the chip itself reports it, highest first. The tooltip is the
 *  rendered form of the same score the sort reads, so asserting on it
 *  checks what the user can actually perceive rather than internals. */
function fitRank(title: string): number {
  if (/Full overlap/i.test(title)) return 2;
  if (/Matches the pot on temp or time/i.test(title)) return 1;
  if (/Doesn't share a brew window|Skip this combination/i.test(title)) return 0;
  return -1;                                    // unscored — empty pot
}

async function chips(page: Page): Promise<{ id: string; fit: number }[]> {
  const els = page.locator('[data-testid="candidate-chip"]');
  await expect(els.first(), "the picker should be showing candidates")
    .toBeVisible({ timeout: 30_000 });
  return els.evaluateAll(nodes => nodes.map(n => ({
    id: n.getAttribute("data-ingredient") || "",
    title: n.getAttribute("title") || "",
  }))).then(rows => rows.map(r => ({ id: r.id, fit: fitRank(r.title) })));
}

test.describe("the ingredient picker", () => {
  test("ranks compatible candidates first once something is in the pot", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();

    const before = await chips(page);
    expect(before.length, "the catalog should offer plenty to pick from").toBeGreaterThan(10);
    expect(before.every(c => c.fit === -1),
      "with an empty pot nothing has a fit to report yet").toBe(true);

    await page.locator(`[data-ingredient="${before[0].id}"]`).first().click();

    const after = await chips(page);
    expect(after.some(c => c.fit >= 0),
      "with something in the pot, candidates should be scored against it").toBe(true);

    // The whole sequence, not a spot check: fit must never climb as you
    // read down the list. This is the property the user relies on —
    // "the good ones are at the top" — stated exactly.
    const climbs = after.findIndex((c, i) => i > 0 && c.fit > after[i - 1].fit);
    expect(climbs, climbs < 0 ? "" :
      `fit rises at row ${climbs}: ${after[climbs - 1].id}(${after[climbs - 1].fit}) `
      + `then ${after[climbs].id}(${after[climbs].fit}) — the ranking is not being applied`)
      .toBe(-1);
  });

  test("puts a full-overlap candidate above one that shares no window", async ({ page }) => {
    // The claim in the plainest possible form, so a regression reads as
    // a sentence rather than as an index.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const before = await chips(page);
    await page.locator(`[data-ingredient="${before[0].id}"]`).first().click();

    const after = await chips(page);
    const bestAt = after.findIndex(c => c.fit === 2);
    const worstAt = after.findIndex(c => c.fit === 0);
    test.skip(bestAt < 0 || worstAt < 0, "this pot did not produce both a best and a worst fit");
    expect(bestAt, `${after[bestAt]?.id} fits fully and ${after[worstAt]?.id} does not, `
      + `so the first should come first`).toBeLessThan(worstAt);
  });

  test("sorts alphabetically within a fit band, so the order is not arbitrary", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const before = await chips(page);
    await page.locator(`[data-ingredient="${before[0].id}"]`).first().click();

    const after = await chips(page);
    const band = after.filter(c => c.fit === 2).map(c => c.id);
    test.skip(band.length < 2, "need at least two full-overlap candidates to compare");
    expect(band, "ties are broken by name, so a band's order is stable and scannable")
      .toEqual([...band].sort((a, b) => a.localeCompare(b)));
  });
});
