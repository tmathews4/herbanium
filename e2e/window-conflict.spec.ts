// e2e/window-conflict.spec.ts — the blend that cannot be brewed says so.
//
// REPORTED as a broken slider: "the steep slider can't reach the times
// the app itself recommends." The slider was right. Chamomile closes at
// 7:00, Lion's Mane opens at 10:00, and the time control stops at 9:10
// because a blend can only be stretched as far as its most fragile lead
// tolerates. What was wrong is that nothing said any of that.
//
// The cup was not even quiet. It fired pour, masking and ceiling
// warnings on the 7:00 brew and mentioned none of the conflict. Three
// confident warnings and no fourth reads as "checked, and it's fine",
// which is exactly why it was reported as a control defect rather than
// a bad pairing.
//
// The node suite proves the rules (tests/window-conflict.test.mjs).
// This proves a user composing the blend actually reaches the sentences,
// and that matters more than usual here: the no-overlap notice already
// existed and was UNREACHABLE from the composer. It gated on two or more
// LEADS, and ComposeScreen marks exactly one lead no matter what you
// build — first ingredient in takes 2 parts, everything after takes 1.
// A spec that opened a curated blend would never have caught it, and no
// curated blend fires either warning.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, ensureBrewPanel } from "./helpers/brew";

// Same budget argument as caffeine-antagonism: the composer mounts a
// lazy screen chunk and then the explorer, with two ingredients added
// through it.
test.beforeEach(() => test.slow());

/** Add one ingredient to the composer by name. */
async function addIngredient(page: Page, query: string, button: RegExp) {
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(query);
  await page.getByRole("button", { name: button }).first().click();
}

/**
 * Chamomile then Lion's Mane, in that order and at default parts.
 *
 * THE ORDER IS THE POINT. The composer gives the first ingredient 2
 * parts and makes it the lead; everything after takes 1 and is an
 * accent. That is the shape the no-overlap notice used to be invisible
 * in, so building it any other way — equalising the parts by hand —
 * would test a path the bug never lived on.
 */
async function buildImpossibleBlend(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await addIngredient(page, "chamomile", /chamomile/i);
  await addIngredient(page, "lion", /lion.s mane/i);
  await ensureBrewPanel(page);
}

test.describe("two leaves with no shared steep window", () => {
  test("the blend is named as impossible, not left to the slider", async ({ page }) => {
    await boot(page);
    await buildImpossibleBlend(page);

    // Visibility before text — a bare read on a locator that never
    // appears reports the wrong thing entirely.
    const notice = page.getByTestId("blend-no-overlap");
    await expect(notice, "a blend with no shared steep window must say so")
      .toBeVisible({ timeout: 30_000 });

    // The CLAIM, not the phrasing: both leaves named, and the verdict
    // that no slider position rescues it.
    await expect(notice).toContainText(/chamomile/i);
    await expect(notice).toContainText(/lion.s mane/i);
    await expect(notice).toContainText(/wherever the slider lands|brew these separately/i);
  });

  test("the leaf that loses at the opening brew is named", async ({ page }) => {
    // The opening cup clamps to chamomile's 420s ceiling, which leaves
    // Lion's Mane at 70% of its MINIMUM steep. That clamp is deliberate
    // — never open on an already over-pulled cup — but it steers into
    // under-steeping, which had no warning kind at all until now.
    await boot(page);
    await buildImpossibleBlend(page);

    const understeep = page.getByTestId("cup-warning-understeep");
    await expect(understeep, "the leaf barely in the water should be named")
      .toBeVisible({ timeout: 30_000 });
    await expect(understeep).toContainText(/lion.s mane/i);
  });

  test("a blend whose windows do meet says none of this", async ({ page }) => {
    // The control. Without it, both assertions above would pass just as
    // well against a screen that shows the warnings unconditionally.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "chamomile", /chamomile/i);
    await addIngredient(page, "peppermint", /peppermint/i);
    await ensureBrewPanel(page);

    // ensureBrewPanel has already waited on the lazy chunk, the explorer
    // mount and the portal, and asserts the sliders are up — so the
    // explorer has rendered THIS cup and the absences below are real
    // rather than a panel still arriving.
    await expect(page.locator('[data-tour="blend-sliders"]').first(),
      "the explorer should be showing this cup").toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("blend-no-overlap"),
      "chamomile and peppermint share a window; nothing to warn about").toBeHidden();
    await expect(page.getByTestId("cup-warning-understeep"),
      "neither leaf is short of its window at the opening brew").toBeHidden();
  });
});
