// e2e/elemental-counts.spec.ts — Profile and Field Notes count the
// same thing.
//
// They did not. A field pass reported Profile showing 8 ELEMENTALS
// while Field Notes listed 9, and the dev seed reads 10 against 3. Two
// independent divergences, and neither surface was asking the question
// the number is supposed to answer:
//
//   1. The creation elemental is never marked seen — every other card's
//      dismissal calls markElementalSeen(id), the omen's calls
//      dismissOmen() and nothing else — so it appeared in the log,
//      gated on omenShown, and never in the set Profile counted. The
//      log read exactly one higher, always. That is the 8-against-9.
//   2. seenElementalIds can hold ids the account no longer earns. The
//      log intersects with earned; Profile did not. Ten against three.
//
// An earlier fix pointed both at seenElementalIds and closed the
// OPPOSITE direction, which is how a half-corrected number ends up
// looking settled. So this spec does not assert a number — a number
// would have passed for that fix too. It asserts the two surfaces
// AGREE, whatever the account happens to hold.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

async function fieldNotesCount(page: Page): Promise<number> {
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.getByTestId("lodestone-lede")).toBeVisible({ timeout: 30_000 });
  return page.locator('[data-testid="arrival-row"]').count();
}

async function profileCount(page: Page): Promise<number> {
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  const stat = page.getByTestId("stat-elementals");
  await expect(stat, "the Profile stat should be on screen").toBeVisible({ timeout: 30_000 });
  return Number((await stat.textContent())?.replace(/\D+/g, ""));
}

test.describe("how many elementals you have", () => {
  test("reads the same on Profile as in the arrivals log", async ({ page }) => {
    await boot(page);
    const listed = await fieldNotesCount(page);
    const counted = await profileCount(page);
    expect(listed, "the seeded account should have summoned something, or this "
      + "passes by both being zero").toBeGreaterThan(0);
    expect(counted, `Profile says ${counted}, Field Notes lists ${listed}`).toBe(listed);
  });

  test("the creation elemental is counted by both, not just listed", async ({ page }) => {
    /* The specific off-by-one. It is in the arrivals log on a seeded
       account (the omen has been dismissed) and it is NOT in
       seenElementalIds — nothing anywhere puts it there — so a Profile
       reading the raw set is exactly one short. Naming it here means a
       regression says which elemental went missing rather than just
       "8 != 9". */
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Field Notes", exact: true }).click();
    await expect(page.getByTestId("lodestone-lede")).toBeVisible({ timeout: 30_000 });

    const ids = await page.locator('[data-testid="arrival-row"]')
      .evaluateAll(els => els.map(e => e.getAttribute("data-elemental")));
    const seen = await page.evaluate(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("herbanium.seenAnimiIds") || "null");
        return raw?.__type === "Set" ? raw.items : (raw || []);
      } catch { return []; }
    });
    test.skip(!ids.includes("_creation"), "this seed has not dismissed the omen");
    expect(seen, "if this ever starts being marked seen, the helper's comment is stale")
      .not.toContain("_creation");
    expect(await profileCount(page),
      "Profile must count the creation elemental even though it is not in the seen set")
      .toBe(ids.length);
  });
});
