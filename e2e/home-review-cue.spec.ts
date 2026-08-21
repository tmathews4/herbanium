// e2e/home-review-cue.spec.ts — Home invites the review; the cup holds
// the form.
//
// A full follow-up form — taste dots, a verdict, a dozen mood chips and
// a textarea — used to render on the home screen above the recent rail,
// on the reasoning that it was the most time-sensitive thing on the
// page. It was also a second copy of a form that already exists on the
// cup, shown to somebody who had opened the app to do something else.
//
// The rail asks instead. An unreviewed cup reads "pending review" where
// its outcome would go, and carries a "review →" cue where its RATING
// would — a slot that is empty on exactly the cups that still want
// reviewing, and occupied on the ones that don't. Tapping the row opens
// the cup with that same form already expanded. One form, one place.
//
// The cue is not a button: the row is one. A nested button would be
// invalid markup and a second tap target for a single destination.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

async function homeRows(page: Page) {
  await boot(page);
  await page.waitForTimeout(5200);              // the greeting choreography
  const rows = page.locator('[data-testid="recent-brew-row"]');
  await expect(rows.first(), "Home should list recent brews")
    .toBeVisible({ timeout: 30_000 });
  return rows;
}

test.describe("the recent-brews rail", () => {
  test("offers a review where a rating would be, and only there", async ({ page }) => {
    const rows = await homeRows(page);
    const state = await rows.evaluateAll(els => els.map(e => ({
      cue: !!e.querySelector('[data-testid="row-review-cue"]'),
      dots: /●/.test(e.textContent || ""),
    })));

    expect(state.some(r => r.cue), "the seed carries unreviewed cups").toBe(true);
    expect(state.some(r => r.dots), "and reviewed ones, or the contrast is untested")
      .toBe(true);
    /* The two are exclusive by construction — the cue occupies the slot
       the rating would have used. Stated as a property rather than a
       count, so it holds however many cups the seed carries. */
    for (const [i, r] of state.entries()) {
      expect(r.cue && r.dots, `row ${i} shows both a rating and an invitation to give one`)
        .toBe(false);
      expect(r.cue || r.dots, `row ${i} shows neither`).toBe(true);
    }
  });

  test("the cue reaches the review, and Home holds no form of its own", async ({ page }) => {
    const rows = await homeRows(page);

    /* Home must carry no submit at all. The card it used to render was
       a working second copy of the cup's form, and "the card is gone"
       is only true if nothing of it is left behind. */
    await expect(page.getByTestId("review-submit"),
      "the follow-up form belongs to the cup now").toHaveCount(0);

    await page.locator('[data-testid="row-review-cue"]').first().click();
    await expect(page.getByTestId("cup-review-panel"),
      "tapping the row should land on the cup's review, already open")
      .toBeVisible({ timeout: 30_000 });
  });

  test("the cue is markup the row can own", async ({ page }) => {
    // A button inside a button is invalid and would give one
    // destination two tap targets. The row is the control.
    const rows = await homeRows(page);
    const tag = await page.locator('[data-testid="row-review-cue"]').first()
      .evaluate(e => e.tagName.toLowerCase());
    expect(tag, "the cue must not be a nested button").toBe("span");
    expect(await rows.first().evaluate(e => e.tagName.toLowerCase()),
      "because the row already is one").toBe("button");
  });
});
