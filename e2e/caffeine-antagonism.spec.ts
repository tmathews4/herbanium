// e2e/caffeine-antagonism.spec.ts — a caffeinated sedative cup says one
// thing, not three.
//
// REPORTED: sleepy read at full strength on a cup the app was already
// marking as blocked by caffeine. It was worse than that. Chamomile into
// a black tea returned `sleepy 5` AND `energy 5` at once, carried the
// "deepens sedation" synergy chip, and stacked three warnings that
// disagreed: at the sedative ceiling, high caffeine load, and caffeine
// working against the sedatives. Every subsystem was individually
// correct and nothing reconciled them.
//
// The node suite proves the arithmetic (tests/perception-extras.test.mjs).
// This proves a user can reach the cup and see the corrected version,
// which is the half the arithmetic can't show — and which matters here
// more than usual, because NO SHIPPED BLEND fires this warning. Every
// curated blend that pairs caffeine with a sedative herb keeps the
// sedative well under the threshold, so the only route to this state is
// a blend the user builds. It was unreachable from the catalogue and
// therefore unreachable from any spec that opens one.
//
// The research behind the numbers is in docs/research/synergies.md:
// Schellenberg 2004 (valerian/hops inhibiting caffeine arousal on EEG)
// and Roache & Griffiths 1987 (caffeine reversing diazepam's sedation
// ratings but NOT its impairment of recall). The second is why the
// safety line has to survive the damping.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot, ensureBrewPanel } from "./helpers/brew";

// Same budget argument as brew-everywhere: the composer mounts a lazy
// screen chunk and then the explorer, and this spec adds two ingredients
// through it rather than one.
test.beforeEach(() => test.slow());

const warning = (page: Page, kind: string) =>
  page.getByTestId(`cup-warning-${kind}`);

/** Add one ingredient to the composer by name. */
async function addIngredient(page: Page, name: string) {
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill(name);
  await page.getByRole("button", { name: new RegExp(name, "i") }).first().click();
}

/**
 * Chamomile plus enough black tea to matter.
 *
 * THE DOSE IS THE POINT, and the first version of this spec got it
 * wrong. The composer adds a second ingredient at 1 part, and chamomile
 * 2g + assam 1g is only ~60mg of caffeine — under the 80mg threshold,
 * so the app correctly says nothing. Bumping assam to 2 parts puts the
 * cup at ~120mg, which is where the interaction is real.
 *
 * That the default pour DOESN'T fire this is worth stating rather than
 * working around: the antagonism is a claim about a genuine dose of
 * both, not about two names appearing in one recipe.
 */
async function buildAntagonisedCup(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await addIngredient(page, "chamomile");
  await addIngredient(page, "assam");

  const more = page.getByRole("button", { name: /increase Assam Black parts/i });
  await expect(more, "the composer should offer a parts stepper").toBeVisible({ timeout: 30_000 });
  await more.click();

  await ensureBrewPanel(page);
}

test.describe("caffeine and sedatives in one cup", () => {
  test("the cup reports a competition, not a win and a settle at once", async ({ page }) => {
    await boot(page);
    await buildAntagonisedCup(page);

    // Assert visibility BEFORE reading text. A bare read on a locator
    // that never appears reports the wrong thing entirely — see the
    // flake note in CLAUDE.md.
    const antagonism = warning(page, "antagonism");
    await expect(antagonism,
      "chamomile in a black tea should raise the antagonism band").toBeVisible({ timeout: 30_000 });

    // The CLAIM, not the phrasing. The original copy said the caffeine
    // wins and the sedatives are spent losing; the valerian/hops trial
    // has the herb inhibiting the caffeine, so "uphill" is gone on
    // purpose and must not come back.
    await expect(antagonism).toContainText(/compete|work against|oppose/i);
    await expect(antagonism,
      "the retracted one-sided claim should not return").not.toContainText(/uphill/i);
  });

  test("the cup is not told it's settling while it's told it reads wired", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await addIngredient(page, "chamomile");
    await ensureBrewPanel(page);

    // Chamomile alone earns the sedation chip — establishing that the
    // absence below is suppression and not simply a chip that never
    // renders in this surface.
    await expect(page.getByTestId("synergy-deepens-sedation"),
      "a caffeine-free chamomile cup should carry its sedation synergy")
      .toBeVisible({ timeout: 30_000 });

    await addIngredient(page, "assam");
    await page.getByRole("button", { name: /increase Assam Black parts/i }).click();
    await expect(warning(page, "antagonism")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("synergy-deepens-sedation"),
      "a cup being warned it reads wired must not also claim to deepen sedation").toBeHidden();
  });

  test("the safety line survives the caffeine masking it", async ({ page }) => {
    // The one that would be easy to lose quietly. Damping sleepy pushes
    // the sedative pressure under the ceiling threshold, so the warning
    // would drop out on its own — for the reason Roache & Griffiths
    // says is exactly wrong. Caffeine reversed the RATINGS of sedation
    // and left the recall impairment in place; a cup must not stop
    // saying "don't drive" because the drinker won't feel it.
    await boot(page);
    await buildAntagonisedCup(page);

    await expect(warning(page, "antagonism"),
      "the cup under test should be the antagonised one").toBeVisible({ timeout: 30_000 });
    await expect(warning(page, "ceiling"),
      "the sedative ceiling warning must not be suppressed by the damping").toBeVisible();
  });
});
