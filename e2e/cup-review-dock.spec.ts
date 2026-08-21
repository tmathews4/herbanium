// e2e/cup-review-dock.spec.ts — the review commits from the bar it
// lives in.
//
// The review card rendered ABOVE the cup's own header whenever a
// moodScore was missing: first thing on the page, competing with the
// cup's identity for the opening screenful, and scrolling away with
// everything else. That is the same argument that had already moved
// "brew again" out of the scroll flow and into the bar — it just had
// not been applied to the other committing action on the screen.
//
// Its submit went with it, for the reason the write composer portals
// its Save out and states in its own spec: "SAVE IS IN THE HEADER, not
// at the foot of the form ... a footer button leaves the screen exactly
// when the form is longest." The review card is taste dots, a verdict,
// a dozen mood chips and a textarea, so it has the same shape.
//
// The bar cell carries the label logic that already existed at the
// card's foot — "pick a verdict" while it waits, "log it" once it will
// do something. Only its address changed.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** Open the newest cup, which the seed leaves unreviewed. */
async function openAnUnreviewedCup(page: Page) {
  await boot(page);
  await page.waitForTimeout(5200);            // the greeting choreography
  await page.locator('[data-testid="recent-brew-row"]').first().click();
  await expect(page.getByTestId("cup-review-panel"),
    "an unreviewed cup should open with its review showing")
    .toBeVisible({ timeout: 30_000 });
}

/** The bar's cells, left to right, as a user reads them. */
const barCells = (page: Page) => page.evaluate(() => {
  const bar = document.querySelector('[data-testid="cup-brew-again"]')?.parentElement;
  return bar ? Array.from(bar.children).map(c => (c.textContent || "").trim()) : [];
});

test.describe("reviewing a cup", () => {
  test("commits from the bar, not from the foot of the form", async ({ page }) => {
    await openAnUnreviewedCup(page);

    expect(await barCells(page),
      "the bar should offer the review beside brew again")
      .toEqual(["pick a verdict", "brew again →"]);

    /* The card must NOT also render its own footer button — that is the
       whole point of the slot. Two live submits for one form is the
       state this arrangement exists to prevent, and it is invisible
       unless counted. */
    const submits = await page.getByTestId("cup-review-panel")
      .getByTestId("review-submit").count();
    expect(submits, "the submit belongs in the bar, and only there").toBe(0);
  });

  test("the cell says what it will do, and only offers when it will do it", async ({ page }) => {
    await openAnUnreviewedCup(page);
    const cell = page.locator('[data-testid="cup-brew-again"]').locator("..")
      .getByTestId("review-submit");

    await expect(cell, "nothing picked yet, so nothing to commit")
      .toHaveText(/pick a verdict/i);
    await expect(cell).toBeDisabled();

    // The verdict controls are icon-only; "yes" is the thumbs-up.
    await page.getByTestId("cup-review-panel")
      .getByRole("button", { name: "yes", exact: true }).first().click();

    await expect(cell, "once a verdict exists the cell becomes the commit")
      .toHaveText(/log it/i);
    await expect(cell).toBeEnabled();
  });

  test("logging it settles the cup and hands the bar back", async ({ page }) => {
    await openAnUnreviewedCup(page);
    await page.getByTestId("cup-review-panel")
      .getByRole("button", { name: "yes", exact: true }).first().click();
    await page.locator('[data-testid="cup-brew-again"]').locator("..")
      .getByTestId("review-submit").click();

    /* A reviewed cup has no review to offer, so the panel goes and
       "brew again" takes the whole bar back. Asserted on the STORE as
       well, because a panel that merely hid while the score never
       landed would pass the visual half. */
    await expect(page.getByTestId("cup-review-panel")).toBeHidden({ timeout: 15_000 });
    expect(await barCells(page), "brew again should have the bar to itself")
      .toEqual(["brew again →"]);

    const scored = await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem("herbanium.sessions") || "[]");
      const mine = all.filter((s: any) => s.who === "you");
      return mine.some((s: any) => typeof s.moodScore === "number" && s.moodsPending === false);
    });
    expect(scored, "the verdict should have been recorded").toBe(true);
  });

  test("a cup that delivered nothing says so, rather than showing a dash", async ({ page }) => {
    /* Marking a cup as not delivering, and adding no other register, is
       a real answer — but it used to render "anxious → —", which reads
       as a blank where a word should be. That is exactly how a row
       looks when somebody has answered nothing at all, so two opposite
       states both rendered as an absence.

       The two are italic alike, because neither is a mood NAME and
       every settled value on the row is normal-weight. COLOUR is what
       separates them: terra carries the verdict that the cup missed,
       where pending is quiet ash because it claims nothing yet. Both
       are asserted, or "they look different" is only an assumption. */
    await openAnUnreviewedCup(page);
    await page.getByTestId("cup-review-panel")
      .getByRole("button", { name: "not really", exact: true }).first().click();
    await page.locator('[data-testid="cup-brew-again"]').locator("..")
      .getByTestId("review-submit").click();

    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(5200);   // the greeting choreography

    const rows = page.locator('[data-testid="recent-brew-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const text = await rows.evaluateAll(els =>
      els.map(e => (e.textContent || "").replace(/\s+/g, " ")));
    expect(text.some(t => /nothing landed/.test(t)),
      "the reviewed cup should say what happened").toBe(true);
    expect(text.some(t => /→\s*—/.test(t)),
      "and never fall back to a bare dash").toBe(false);

    const styles = await page.evaluate(() => {
      const read = (needle: string) => Array.from(document.querySelectorAll("span"))
        .filter(e => !e.children.length && e.textContent?.includes(needle))
        .map(e => ({ italic: getComputedStyle(e).fontStyle, color: getComputedStyle(e).color }))[0];
      return { landed: read("nothing landed"), pending: read("pending review") };
    });
    expect(styles.landed?.italic, "not a mood name, so not normal-weight").toBe("italic");
    expect(styles.pending?.italic, "nor is pending").toBe("italic");
    expect(styles.landed?.color,
      "a verdict and a not-yet-asked must not look identical")
      .not.toBe(styles.pending?.color);
  });
});
