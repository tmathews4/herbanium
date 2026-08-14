// e2e/heavy-pour.spec.ts — the cup says when there's too much leaf in it.
//
// REPORTED: "assam black 5 and peppermint 1, that feels wrong". It did,
// and the bars were not the problem. Parts are grams, so 5 + 1 is 3.33
// cups' worth of leaf in one cup — every strong flavour sits at its
// ceiling and the strip goes flat: malty 5.00, bold 5.00, minty 5.00,
// with no way to say which one leads. The readings were correct. Nothing
// explained them, so the model looked broken instead of the pour.
//
// The node suite proves the threshold and that each leaf counts in its
// own units (tests/perception-extras.test.mjs). This proves a user can
// build the reported cup and actually meet the notice — which is the
// half that matters here, because the whole point of the warning is that
// it appears at the moment the bars stop being informative.
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

/** Click a parts stepper until the ingredient reads `target` parts. */
async function setParts(page: Page, label: RegExp, times: number) {
  const more = page.getByRole("button", { name: label });
  await expect(more, "the composer should offer a parts stepper").toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < times; i++) await more.click();
}

test.describe("a heavy pour says so", () => {
  test("the reported cup — assam 5 : peppermint 1 — is called out", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "assam");
    await addIngredient(page, "peppermint");

    // Assam to 5 parts. The FIRST ingredient arrives at 2 parts and the
    // second at 1 — so three taps, not four. Worth stating: assuming
    // both started at 1 built a 6:1 cup and the notice read 3.8×, which
    // is a correct reading of a blend the test didn't mean to make.
    await setParts(page, /increase Assam Black parts/i, 3);
    await ensureBrewPanel(page);

    const pour = warning(page, "pour");
    await expect(pour, "3.33 cups' worth of leaf should raise the pour notice")
      .toBeVisible({ timeout: 30_000 });

    // Says HOW heavy, in cups' worth. A bare "this is strong" leaves the
    // reader with nothing to act on, and the number is the whole lesson.
    await expect(pour).toContainText(/3\.3/);
    await expect(pour, "and names what it costs them").toContainText(/ceiling|flat/i);
  });

  test("an ordinary cup is not scolded", async ({ page }) => {
    // The other half, and the one that keeps the notice worth reading.
    // Two leaves at one part each is well inside the catalogue's own
    // range — the 72 curated blends run a median of 1.50 cup-doses.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "assam");
    await addIngredient(page, "peppermint");
    await ensureBrewPanel(page);

    // Assert something ELSE about the cup first, so this can't pass by
    // looking before the warnings have rendered at all.
    await expect(page.locator('[data-tour="blend-sliders"]').first(),
      "the brew panel should be up before judging what isn't on it").toBeVisible();
    await expect(warning(page, "pour"),
      "an ordinary two-leaf cup should pass without comment").toBeHidden();
  });
});
