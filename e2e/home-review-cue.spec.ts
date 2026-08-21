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
// its outcome would go, and carries a "review" cue where its RATING
// would — a slot that is empty on exactly the cups that still want
// reviewing, and occupied on the ones that don't. Tapping the row opens
// the cup with that same form already expanded. One form, one place.
//
// THAT SLOT IS UNDER THE TIME, and for a while the code disagreed with
// the paragraph above: the cue was moved down to the end of the brew
// line, on the argument that a terra pill level with the mood arc
// competes with the reading beside it. It has been moved back, so the
// right-hand column reads time-then-verdict straight down. The
// placement is asserted by MEASUREMENT below rather than left to prose,
// which is what let the two drift apart in the first place.
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

  test("sits in the right-hand column, directly under the time", async ({ page }) => {
    const rows = await homeRows(page);
    const row = rows.filter({ has: page.locator('[data-testid="row-review-cue"]') }).first();
    await expect(row, "the seed should carry an unreviewed cup").toBeVisible();

    /* WHICH LINE, and not just "somewhere below". The first version of
       this test asserted the cue was right-aligned and lower than the
       time — both of which were ALSO true of the old placement at the
       end of the brew line, two lines down. It passed on the very
       layout it was written to reject, which is worth recording: a
       geometric assertion that does not distinguish the two states is
       decoration.

       The claim is the row's SECOND line — the one holding the mood
       arc, where a rating would sit. So: same line as the arc, and
       sharing a right edge with the time above it. */
    const geom = await row.evaluate(el => {
      const cue = el.querySelector('[data-testid="row-review-cue"]') as HTMLElement;
      const lines = Array.from(el.children) as HTMLElement[];
      const firstLine = lines[0];
      const time = firstLine.lastElementChild as HTMLElement;
      const arc = lines[1]?.firstElementChild as HTMLElement;
      const c = cue.getBoundingClientRect(), t = time.getBoundingClientRect();
      const a = arc?.getBoundingClientRect();
      return {
        lineIndex: lines.findIndex(l => l.contains(cue)),
        lineCount: lines.length,
        cueRight: Math.round(c.right), timeRight: Math.round(t.right),
        cueMidY: Math.round(c.top + c.height / 2),
        arcMidY: a ? Math.round(a.top + a.height / 2) : null,
        timeText: (time.textContent || "").trim(),
        arcText: (arc?.textContent || "").trim().slice(0, 40),
      };
    });

    expect(geom.timeText, "the thing above should be the relative time")
      .toMatch(/ago|now|yesterday|[0-9]/i);
    expect(geom.lineIndex,
      `the cue is on line ${geom.lineIndex + 1} of ${geom.lineCount}; it belongs on ` +
      `line 2, beside the mood arc, where a rating would be`)
      .toBe(1);
    expect(geom.arcMidY, "line 2 should hold the mood arc").not.toBeNull();
    expect(Math.abs(geom.cueMidY - (geom.arcMidY as number)),
      `the cue's centre is y=${geom.cueMidY} and the arc "${geom.arcText}" is at ` +
      `y=${geom.arcMidY} — they must share a line`)
      .toBeLessThanOrEqual(4);
    expect(Math.abs(geom.cueRight - geom.timeRight),
      `the cue's right edge is ${geom.cueRight} and the time's is ${geom.timeRight} — ` +
      `they must stack in one right-hand column`)
      .toBeLessThanOrEqual(1);
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

  test("finishing the review puts you back where you started", async ({ page }) => {
    /* The review is a thing you came here TO DO. Submitting used to
       leave you parked on the cup's entry, reading a page you had just
       finished writing; now it returns to whatever opened the cup.

       The strongest assertion is not "we are on Home" — it is that the
       row you came from has CHANGED: it was asking for a rating and
       now shows one. That covers the navigation and the save in one
       claim, and it fails if either half stops working. */
    const rows = await homeRows(page);
    const row = rows.filter({ has: page.locator('[data-testid="row-review-cue"]') }).first();
    const before = await rows.count();
    await row.click();

    const panel = page.getByTestId("cup-review-panel");
    await expect(panel, "the cup opens with its review showing")
      .toBeVisible({ timeout: 30_000 });

    /* The submit lives in the cup's action bar and reads "pick a
       verdict" until one is picked — a cup with target moods cannot be
       logged without saying whether they landed. So answer it, the way
       a person would, rather than reaching for a cup that happens not
       to ask. */
    const submit = page.getByTestId("review-submit");
    await expect(submit).toBeVisible({ timeout: 15_000 });
    if (!(await submit.isEnabled())) {
      await panel.getByRole("button", { name: "yes", exact: true }).click();
    }
    await expect(submit, "a verdict picked, the review should be submittable")
      .toBeEnabled({ timeout: 15_000 });
    await submit.click();

    /* THE CUP MUST BE GONE FROM THE DOM, not merely hidden. The first
       version of this asserted the review PANEL was hidden, and that
       panel is gated on whether a score exists — so it disappears the
       moment the review is saved whether or not anything navigated.
       It passed against the old behaviour, which is the only reason
       anyone found out. Same trap on the rail: Home stays mounted
       under the overlay, so its rows read as visible from behind a
       screen covering them. */
    await expect(page.getByTestId("cup-detail"),
      "submitting should leave the cup behind, not just close its form")
      .toHaveCount(0, { timeout: 15_000 });
    await expect(panel).toHaveCount(0);
    await expect(rows.first(), "and land back on the rail we came from")
      .toBeVisible({ timeout: 15_000 });
    expect(await rows.count(), "with the same cups on it").toBe(before);

    const state = await rows.evaluateAll(els => els.map(e => ({
      cue: !!e.querySelector('[data-testid="row-review-cue"]'),
      dots: /●/.test(e.textContent || ""),
    })));
    expect(state.filter(r => r.cue).length,
      "one fewer cup should be asking for a review than before")
      .toBeLessThan(state.length);
    expect(state[0].dots || !state[0].cue,
      "the cup just reviewed should no longer be asking").toBe(true);
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
