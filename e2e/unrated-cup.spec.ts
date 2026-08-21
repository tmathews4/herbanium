// e2e/unrated-cup.spec.ts — a cup you have not rated does not show a
// rating.
//
// REPORTED: "All three entries in the list — two seeded, one I had just
// created seconds earlier and never scored — display an identical
// 4-of-5."
//
// It did. Brew completion logged `taste: 4` outright, and addSession
// carried `taste: taste ?? 4` behind it, so every cup was born rated
// four of five. The row guards on `s.taste != null`, which was never
// null because the value was stamped at creation. Four filled dots and
// one hollow, in exactly the visual language of a rating the user had
// actually given — on a cup they had brewed thirty seconds earlier.
//
// The comment on the brew-completion path said the follow-up card
// captures the real rating "once the cup has had a few minutes to
// settle". That is true and it is the problem: for those minutes the
// app showed a number nobody had given, indistinguishable from one
// they had.
import { test, expect, type Page } from "@playwright/test";
import { brewFromDetail } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion.js";

test.beforeEach(() => test.slow());

/** Brew and finish a cup, without waiting out a real timer. */
async function brewACup(page: Page) {
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
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="recipes-row"]').first().click();
  await brewFromDetail(page);
  await page.getByRole("button", { name: /done early|log this cup/i }).first().click();
}

test.describe("a freshly brewed cup", () => {
  test("carries no rating until one is given", async ({ page }) => {
    await brewACup(page);

    /* Read the STORE, not the dots. The dots are a rendering of this
       value and a future row could stop drawing them for its own
       reasons — what must be true is that the app did not invent a
       number. `taste` absent is the claim; the dots follow from it. */
    const fresh = await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem("herbanium.sessions") || "[]");
      const mine = all.filter((s: any) => s.who === "you");
      // Newest first is how the log reads; take whichever was just made.
      const newest = mine.sort((a: any, b: any) =>
        (b.brewedAt || 0) - (a.brewedAt || 0))[0];
      return newest ? { taste: newest.taste ?? null, brewedAt: newest.brewedAt ?? null } : null;
    });
    expect(fresh, "the brew should have been logged").not.toBeNull();
    expect(fresh!.brewedAt, "and logged just now").toBeTruthy();
    expect(fresh!.taste,
      `a cup nobody has scored was logged with taste ${fresh!.taste}`).toBeNull();
  });

  test("shows no rating on the new row, while older rated cups keep theirs", async ({ page }) => {
    /* Both directions in one test, deliberately. "The new row has no
       dots" passes just as well if the dots stopped rendering
       everywhere, and "some row has dots" passes if the new one has
       them too. The claim is the DIFFERENCE between them. */
    await brewACup(page);
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(5200);   // the greeting choreography

    const rows = page.locator('[data-testid="recent-brew-row"]');
    await expect(rows.first(), "Home should list recent brews")
      .toBeVisible({ timeout: 30_000 });
    const flags = await rows.evaluateAll(els =>
      els.map(e => e.getAttribute("data-rated")));

    expect(flags[0],
      "the cup just brewed and never scored must not show a rating").toBe("false");
    expect(flags.slice(1),
      "the seeded cups carry real ratings, so this cannot pass by the dots "
      + "having disappeared altogether").toContain("true");

    // And the dots follow the flag, so the attribute is not lying.
    const dotRows = await rows.evaluateAll(els => els.map(e => /\u25cf/.test(e.textContent || "")));
    expect(dotRows[0], "no flag, no dots").toBe(false);
    expect(dotRows.slice(1), "a rated cup still draws its dots").toContain(true);
  });
});
