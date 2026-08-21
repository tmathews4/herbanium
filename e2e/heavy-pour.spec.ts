// e2e/heavy-pour.spec.ts — the cup says when there's too much leaf in it.
//
// REPORTED: "assam black 5 and peppermint 1, that feels wrong". It did,
// and the bars were not the problem. Parts were grams then, so 5 + 1 was
// 3.33 cups' worth of leaf in one cup — every strong flavor sat at its
// ceiling and the strip went flat, with no way to say which led.
//
// THAT EXACT CUP IS NO LONGER BUILDABLE IN PARTS MODE, which is the
// point of this file now. Parts became a ratio normalized to one cup's
// worth, so no arrangement of them can over-dose the pot — 9:1 is the
// same amount of leaf as 1:1, just a different balance. The warning did
// not become dead: it moved to where a heavy cup is now actually made,
// which is weight mode, where the user types grams and means them.
//
// So the two tests are: a pot deliberately piled up says so, and an
// ordinary cup is left alone. The node suite holds the threshold and
// the per-leaf unit arithmetic (tests/perception-extras.test.mjs).
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, ensureBrewPanel } from "./helpers/brew";

// The composer mounts a lazy screen chunk and then the explorer, and
// this spec adds two ingredients through it and works the steppers.
test.beforeEach(() => test.slow());

const warning = (page: Page, kind: string) => page.getByTestId(`cup-warning-${kind}`);

async function addIngredient(page: Page, name: string) {
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(name);
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

test.describe("a heavy pour says so", () => {
  test("a pot piled up in weight mode is called out", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "assam");
    await addIngredient(page, "peppermint");

    // Weight mode, because that is the only way to over-dose a pot now.
    // Counts taps rather than reading the readout: it speaks the user's
    // chosen unit, and parsing it would assert on a display format.
    await page.getByTestId("amount-mode-weight").click();
    const ups = page.getByRole("button", { name: /increase .* amount/i });
    await expect(ups.first(), "weight mode should offer amount steppers")
      .toBeVisible({ timeout: 30_000 });
    const rows = await ups.count();
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < 12; i++) await ups.nth(row).click();
    }

    await ensureBrewPanel(page);

    const pour = warning(page, "pour");
    await expect(pour, "a pot piled well past a cup's worth should say so")
      .toBeVisible({ timeout: 30_000 });

    // Says HOW heavy, in cups' worth. A bare "this is strong" leaves the
    // reader nothing to act on, and the number is the whole lesson.
    await expect(pour).toContainText(/\d(\.\d)?×/);
    await expect(pour, "and names what it costs them").toContainText(/ceiling|flat/i);
  });

  test("an ordinary cup is not scolded, however the ratio is set", async ({ page }) => {
    // The half that keeps the notice worth reading — and it is a
    // stronger claim than it used to be. Parts normalize to one cup, so
    // even a lopsided 5:1 is an ordinary amount of leaf: the ratio moved
    // and the pour did not. That is the fix this warning was written
    // alongside, asserted from the user's side.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "assam");
    await addIngredient(page, "peppermint");

    // Assam to 5 parts: the first ingredient arrives at 2, so three taps.
    const more = page.getByRole("button", { name: /increase Assam Black parts/i });
    await expect(more).toBeVisible({ timeout: 30_000 });
    for (let i = 0; i < 3; i++) await more.click();

    await ensureBrewPanel(page);
    await expect(page.locator('[data-tour="blend-sliders"]').first(),
      "the brew panel should be up before judging what isn't on it").toBeVisible();
    await expect(warning(page, "pour"),
      "5 parts to 1 is a ratio, not a bigger pot — it should pass without comment")
      .toBeHidden();
  });
});
