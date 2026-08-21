// e2e/measured-by-hand.spec.ts — two claims that shipped with a number
// in the commit message and nothing holding them.
//
// Both were found by measuring the rendered page, fixed, and left
// uncovered; both are geometric or formatting claims that only a
// browser can check, and both would regress silently. Neither asserts
// the literal number the commit recorded — a magic 20 or a literal
// "9:10" would fail on the next padding tweak or catalogue edit while
// the actual claim still held. They assert the claim: the three labels
// AGREE, and the axis ends are times rather than rounded minutes.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
}

/* "Making" sat 90px right of the two labels above it, because a
   two-line label in a `space-between` row centred on the block rather
   than on the text. Renamed to Container and flattened to one line, and
   the fix was recorded as "all three labels measure left: 20".

   Asserted as agreement rather than as 20. The row's padding is a
   design decision that may move; the three labels lining up is the
   thing that was broken. */
test("the preference rows all start at the same left edge", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: "Profile", exact: true }).click();

  const labels = page.getByTestId("pref-label");
  await expect(labels.first()).toBeVisible({ timeout: 20_000 });
  const count = await labels.count();
  expect(count, "Temperature, Weight and Container").toBeGreaterThanOrEqual(3);

  /* WHERE THE TEXT STARTS, not where its box does. The bug was a label
     CENTRED inside a full-width block, so every box already began at
     the same x while the words sat 90px apart. A Range over the span's
     contents measures the glyphs, which is what a reader compares —
     and is the only version of this that fails on the original defect.
     Verified by re-centring one label on purpose. */
  const lefts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid="pref-label"]')).map(el => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return Math.round(r.getBoundingClientRect().left);
    }));
  const [first, ...rest] = lefts;
  for (const [i, l] of rest.entries()) {
    expect(l, `label ${i + 1} should line up with the first (${lefts.join(", ")})`)
      .toBe(first);
  }
});

/* The steep axis printed whole minutes through Math.round while the
   temperature labels beside it were exact: a 0:15 floor read "0m" —
   not a steep at all but the pouring of water TIME_HARD_MIN exists to
   forbid — and a 3:48 ceiling read "4m", naming a value no finger can
   reach. An END is a claim about what the control can do.
   `tests/steep-formatting.test.mjs` holds the formatter and walks the
   catalogue; nothing checked what the axis actually renders. */
test("the steep axis ends read as times, not rounded minutes", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();

  // A pot to have a range at all, then the brew row open — the axis
  // renders inside the panel — then the steep axis selected.
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill("chamomile");
  await page.getByRole("button", { name: /chamomile/i }).first().click();

  const row = page.locator('[data-tour="blend-controls"]').first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
  await page.getByTestId("brew-axis-timeS").click();

  const ends = page.getByTestId("axis-end");
  await expect(ends.first()).toBeVisible({ timeout: 20_000 });

  const texts: string[] = [];
  for (let i = 0; i < await ends.count(); i++) {
    texts.push(((await ends.nth(i).innerText()) || "").trim());
  }
  // Degrees belong to the other axis; whatever is left is the steep's.
  const timeEnds = texts.filter(t => !t.endsWith("°"));
  expect(timeEnds.length, `expected steep-axis ends among ${JSON.stringify(texts)}`)
    .toBeGreaterThan(0);

  for (const t of timeEnds) {
    expect(t, "an axis end must carry its seconds").toMatch(/^\d+:[0-5]\d$/);
    expect(t, "and must not be a rounded minute").not.toMatch(/^\d+m$/);
  }
});
