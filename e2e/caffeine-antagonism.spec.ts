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
// a blend the user builds. It was unreachable from the catalog and
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
 * BUILT IN WEIGHT MODE, and that is the whole story of this helper.
 *
 * Parts used to be grams, so "chamomile 2 : assam 2" was a 4g pot and
 * reached the 80mg threshold easily. Parts are now a RATIO normalized
 * to one cup's worth of leaf, and at that size the two conditions are
 * mutually exclusive: raising the tea to reach 80mg necessarily lowers
 * the chamomile below the sedative threshold. Measured across every
 * sedative/caffeine pair in the catalog — valerian, hops, lavender,
 * passionflower against assam, matcha, gunpowder — and NONE of them
 * fire at one cup. At 1:2 the caffeine reaches 80mg with sleepy down to
 * 1.24; at 1:1 sleepy is 2.47 and the caffeine is only 60mg.
 *
 * That is the model being right rather than the warning being lost. One
 * cup's worth of leaf genuinely cannot hold a serious dose of both, and
 * the cup that can is a heavy one — which is why this now builds it in
 * weight mode, and why the `pour` notice fires alongside. Both are true
 * of the same cup and the app says both.
 */
async function buildAntagonisedCup(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await addIngredient(page, "chamomile");
  await addIngredient(page, "assam");

  await crankToAHeavyCup(page);
  await ensureBrewPanel(page);
}

/**
 * Take whatever is already in the pot up to a genuinely heavy dose, in
 * weight mode.
 *
 * Counts taps rather than reading grams, because the readout speaks the
 * user's chosen unit — teaspoons by default — and a spec that parsed it
 * would be asserting on a display format. The step is a quarter-teaspoon
 * of THAT leaf, so twelve taps is three teaspoons of each however the
 * two differ in density. The warning assertions are the real gate.
 */
async function crankToAHeavyCup(page: Page) {
  await page.getByTestId("amount-mode-weight").click();
  const ups = page.getByRole("button", { name: /increase .* amount/i });
  await expect(ups.first(), "weight mode should offer amount steppers")
    .toBeVisible({ timeout: 30_000 });
  const n = await ups.count();
  for (let row = 0; row < n; row++) {
    for (let i = 0; i < 12; i++) await ups.nth(row).click();
  }
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

    // Now make it a cup that genuinely holds both. In parts mode this is
    // unreachable by construction — one cup's worth of leaf cannot carry
    // a serious dose of caffeine AND of sedative, since raising one
    // lowers the other. See the note on buildAntagonisedCup.
    await addIngredient(page, "assam");
    await crankToAHeavyCup(page);
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
