// e2e/helpers/brew.ts — how a test starts a cup.
//
// Not a .spec file, so Playwright doesn't collect it.
//
// This exists because eleven call sites across four spec files each
// knew how to brew, and all eleven knew it the same way: click the
// recipe page's full-width "Brew this cup" CTA. When that CTA became a
// duplicate of the brew panel's own corner Brew and was hidden, twenty
// tests went down at once — not because the app broke, but because the
// knowledge was copied eleven times instead of named once.
//
// The same shape this session kept finding: behaviour defined at the
// call site rather than in the thing being called. Naming it here means
// the next change to how brewing starts is one edit.
import { expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../../src/data/schemaVersion";

/**
 * Start a brew from an open recipe/blend detail screen.
 *
 * Goes through the brew panel's corner Brew — the control every brew
 * window carries — and answers the confirmation, which every corner
 * Brew now asks. Leaves the app on whatever the brew opens (the steep
 * screen, unless something minimised it).
 *
 * Assumes a detail screen is already open; navigating there is the
 * caller's business, since they differ on how they got there.
 */
export async function brewFromDetail(page: Page) {
  const row = page.locator('[data-tour="blend-controls"]').first();
  // 30s, not 15. A detail overlay pulls a lazy screen chunk, mounts the
  // explorer and portals it into the host's dock slot; under four
  // workers that chain has measured past 15s. This is the helper's OWN
  // wait, so test.slow() doesn't cover it — raising the test budget
  // never touched this number.
  await expect(row, "the detail screen should have a brew panel").toBeVisible({ timeout: 30_000 });
  // The panel folds; the corner only exists while it's open.
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();

  await page.locator('[data-tour="blend-brew"]').first().click();

  // Brewing asks first — a saved recipe already has a name, so this
  // prompt carries no name field, just the confirmation.
  const go = page.getByTestId("brew-confirm-go");
  await expect(go, "the corner Brew should ask before starting a timer").toBeVisible();
  await go.click();
}

/** The control a detail screen offers for brewing, for visibility assertions. */
export const detailBrewControl = (page: Page) => page.locator('[data-tour="blend-brew"]').first();

/**
 * A booted app with the tours off and the dev seed in.
 *
 * Copied verbatim into five spec files before it lived here. Same
 * argument as brewFromDetail above: the knowledge of what a test needs
 * before it can look at anything is one thing, not five.
 */
export async function bootApp(page: Page) {
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
}

/**
 * The same booted app, but actually in the dark palette.
 *
 * TWO THINGS BOTH HAVE TO BE TRUE and only one of them is obvious.
 * `emulateMedia({ colorScheme: "dark" })` sets the media query — and
 * the app then ignores it, because `?dev` toggles a `force-light` class
 * onto <html> and the entire `@media (prefers-color-scheme: dark)`
 * block in index.css is guarded by `:root:not(.force-light)`. That
 * class exists for a good reason (spot-checking the cream register on a
 * phone stuck in system dark) and it means twenty of the suite's
 * twenty-five boots have the dark palette switched off at the root.
 *
 * So the dark half of the app had no coverage at all, which is exactly
 * where a field pass found its bugs: a cream scrim hardcoded into two
 * reveal cards, flashing light over a near-black app. tours.spec.ts had
 * already hit this trap and stripped the class inline in one test, with
 * a comment saying that otherwise it "reports light and dark as
 * identical while proving nothing". That workaround is this helper now.
 *
 * emulateMedia REPLACES the emulated state rather than merging, so
 * reducedMotion is passed alongside — dropping it makes animations run
 * and turns colour reads into races. Same footgun tours.spec documents.
 */
export async function bootDark(page: Page) {
  await bootApp(page);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.evaluate(() => document.documentElement.classList.remove("force-light"));
  // Nothing re-adds it: App toggles the class in an effect keyed on
  // isDev, which does not change again during a run.
}

/**
 * Get to a rendered, OPEN brew panel on whichever screen we're on.
 *
 * Two independent collapses, and they are NOT the same control. Detail
 * screens wrap the explorer in a "Brewing" section that may be shut, and
 * the brew row inside the panel folds on its own. Only expand either one
 * if it's actually closed — an unconditional click on the section header
 * SHUTS an already-open one, which is what the first version of
 * brew-everywhere.spec did while reporting "the brew panel should be on
 * screen".
 *
 * Both are asked directly, via aria-expanded. Inferring "shut" from "its
 * contents aren't here yet" is the same bug wearing a condition.
 */
export async function ensureBrewPanel(page: Page) {
  // Say WHICH stage is missing. "no brew panel" covered three different
  // failures — the detail overlay never opened, its lazy chunk never
  // arrived, or the panel never portalled into the slot — and under
  // contention they are not the same bug.
  const detail = page.locator('[data-testid="blend-detail"]');
  if (await detail.count()) {
    await expect(detail, "the detail overlay should be open").toBeVisible({ timeout: 30_000 });
  }
  const section = page.getByTestId("brewing-section");
  if (await section.count()) {
    await expect(section, "the Brewing section should say whether it's open")
      .toHaveAttribute("aria-expanded", /true|false/, { timeout: 30_000 });
    if ((await section.getAttribute("aria-expanded")) !== "true") await section.click();
  }
  const row = page.locator('[data-tour="blend-controls"]').first();
  // 45s. This waits on a lazy screen chunk, an explorer mount and a
  // portal into the host's dock; under four workers it has measured
  // past 30s. It is a load-tolerance number, not a correctness one —
  // the same walk takes ~2s run alone.
  await expect(row, "the brew panel should be on screen").toBeVisible({ timeout: 45_000 });
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
  await expect(page.locator('[data-tour="blend-sliders"]').first()).toBeVisible();
}

/* ──────────────────────────────────────────────────────────────
   THE THREE BREW WINDOWS.

   Every screen that mounts a <BrewSurface> is named here, and
   tests/brew-surfaces.test.mjs fails if src/ grows a fourth that
   isn't. The walk to each is the part that keeps drifting, so it is
   written once rather than at every call site.
   ────────────────────────────────────────────────────────────── */

/** Apothecary → Blend: the composer. Its controls dock in the tab bar. */
export async function walkToComposer(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
  await search.fill("chamomile");
  await page.getByRole("button", { name: /chamomile/i }).first().click();
  await ensureBrewPanel(page);
}

/** Journal → a saved recipe. A full-screen overlay with its own dock. */
export async function walkToRecipe(page: Page) {
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="recipes-row"]').first().click();
  await ensureBrewPanel(page);
}

/** Apothecary → Herbanium → chamomile → Brewing. Also its own dock. */
export async function walkToIngredient(page: Page) {
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Herbanium", exact: true }).click();
  // A NAMED ingredient, not just the first row. The explorer only
  // renders for ingredients that have an extraction profile, so
  // whatever happens to sort first is not a safe target.
  await page.locator('[data-tour="herb-search"]').getByRole("textbox").first().fill("chamomile");
  await page.locator('[data-tour="herb-ingredient"]').first().click();
  // The panel lives in this screen's own Brewing tab; Overview is default.
  await page.getByRole("button", { name: "Brewing", exact: true }).first().click();
  await ensureBrewPanel(page);
}

export const BREW_WINDOWS = [
  { name: "the composer", dockId: "brew-dock", walk: walkToComposer },
  { name: "a saved recipe", dockId: "brew-dock-blend-detail", walk: walkToRecipe },
  { name: "an ingredient", dockId: "brew-dock-ingredient-detail", walk: walkToIngredient },
] as const;
