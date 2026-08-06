// e2e/brew-everywhere.spec.ts — every brew window can be brewed from.
//
// REPORTED: "missing brew button on the saved/favorited window again."
// The "again" is the important word. BlendExtractionExplorer renders
// whatever `brewAction` it is handed and nothing more, and the button's
// styling lived at the one call site that passed one — so every panel
// added since had to remember to rebuild it from scratch, and two
// didn't. A saved blend and an ingredient profile both showed a brew
// window with a temperature, a timer and no way to commit.
//
// The fix was one shared BrewCornerButton, but a shared component only
// stops the styling drifting; it doesn't stop the NEXT panel forgetting
// to pass it. That's what this spec is for. It walks to each place a
// brew panel appears and asserts the button is in it.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

// Opening a detail overlay pulls a lazy-loaded screen chunk and then
// waits for the explorer to mount and settle. Under four workers that
// outruns the config's 30s budget — measured as "element(s) not found"
// after a 15s wait, not a pointer interception. Same call the tour specs
// already make, for the same reason.
test.beforeEach(() => test.slow());

async function boot(page: Page) {
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

const brewButton = (page: Page) => page.locator('[data-tour="blend-brew"]');

// Get to a rendered, open brew panel on whichever screen we're on.
//
// Two independent collapses, and they are NOT the same control. Detail
// screens wrap the explorer in a "Brewing" section that may be shut, and
// the brew row inside the panel folds on its own. Only expand either one
// if it's actually closed — an unconditional click on the section header
// SHUTS an already-open one, which is what the first version of this
// spec did while reporting "the brew panel should be on screen".
async function ensureBrewPanel(page: Page) {
  const row = page.locator('[data-tour="blend-controls"]').first();
  if (!(await row.count())) {
    const section = page.getByRole("button", { name: /Brewing/i }).first();
    if (await section.count()) await section.click();
  }
  await expect(row, "the brew panel should be on screen").toBeVisible({ timeout: 15_000 });
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
  await expect(page.locator('[data-tour="blend-sliders"]').first()).toBeVisible();
}

test.describe("every brew window has a Brew button", () => {
  test("composing a blend", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await expect(brewButton(page), "the compose panel should offer Brew").toBeVisible();
    await expect(brewButton(page)).toBeEnabled();
  });

  test("a saved blend's Brewing panel", async ({ page }) => {
    // The one that was reported. The screen already had a full-width
    // CTA further down the page; the panel itself had nothing, so
    // anyone dialling in a temperature had to scroll away from the
    // controls to act on it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await ensureBrewPanel(page);
    await expect(brewButton(page), "a saved blend's panel should offer Brew").toBeVisible();
  });

  test("a single ingredient's profile", async ({ page }) => {
    // "Even single ingredient it's no harm to allow it." One leaf is a
    // perfectly good cup, and this panel shows its temperature.
    await boot(page);
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
    await expect(brewButton(page), "an ingredient profile should offer Brew").toBeVisible();
  });

  test("brewing one leaf actually starts a steep", async ({ page }) => {
    // Present isn't the same as wired. This screen had no brew path at
    // all before — the button would have been decoration.
    await boot(page);
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
    await brewButton(page).click();
    // Every corner Brew asks first now. A leaf is already named, so this
    // prompt carries no name field.
    await expect(page.getByTestId("brew-confirm")).toBeVisible();
    await expect(page.getByTestId("brew-confirm-name"),
      "an already-named thing shouldn't ask for a rename").toHaveCount(0);
    await page.getByTestId("brew-confirm-go").click();

    await expect(page.getByTestId("steep-screen").or(page.getByText(/steep/i).first()),
      "brewing a single ingredient should open the timer").toBeVisible({ timeout: 15_000 });
  });
});

test.describe("brewing asks first", () => {
  test("the composer's Brew confirms, and takes the name", async ({ page }) => {
    // Brewing starts a timer and commits the cup — the one irreversible
    // thing this screen does. The name is asked for here because this is
    // the moment you know what to call it.
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();

    const dialog = page.getByTestId("brew-confirm");
    await expect(dialog, "Brew should ask before starting a timer").toBeVisible();
    await page.getByTestId("brew-confirm-name").fill("Evening Chamomile");
    await page.getByTestId("brew-confirm-go").click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Evening Chamomile").first(),
      "the name given at the prompt should follow the cup").toBeVisible({ timeout: 15_000 });
  });

  test("backing out of the prompt brews nothing", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const search = page.locator('[data-tour="blend-search"]').getByRole("textbox").first();
    await search.fill("chamomile");
    await page.getByRole("button", { name: /chamomile/i }).first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();
    await page.getByTestId("brew-confirm-cancel").click();

    await expect(page.getByTestId("brew-confirm")).toBeHidden();
    // Still on the composer, still holding the pot — nothing committed.
    await expect(page.locator('[data-tour="blend-quantity"]'),
      "cancelling should leave the pot exactly as it was").toBeVisible();
  });
});

test.describe("a named cup isn't asked to be renamed", () => {
  test("a saved recipe's corner Brew asks, without a name field", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await ensureBrewPanel(page);
    await brewButton(page).click();

    await expect(page.getByTestId("brew-confirm"),
      "a saved recipe should still confirm — it starts a timer").toBeVisible();
    await expect(page.getByTestId("brew-confirm-name"),
      "but the recipe already has a name").toHaveCount(0);
  });
});

test.describe("quick brew — the deliberate exception", () => {
  test("a recipe row brews on the spot, minimized, without asking", async ({ page }) => {
    // Everything else confirms. This doesn't, and that IS the feature:
    // the prompt exists to catch an accidental commit while you're
    // dialling something in, and a saved recipe is a cup you already
    // keep. It also stays out of your way — the timer folds into the
    // banner instead of taking the screen.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();

    const quick = page.locator('[data-testid^="quick-brew-"]').first();
    await expect(quick, "a saved recipe should offer a one-tap brew").toBeVisible();
    await quick.click();

    await expect(page.getByTestId("brew-confirm"),
      "quick brew must not ask — that's the whole point of it").toHaveCount(0);

    // AND IT ACTUALLY BREWED. Asserting only that nothing was asked
    // would pass just as happily for a button wired to nothing.
    await expect(page.getByRole("button", { name: /return to your steeping brew/i }),
      "the cup should be running, folded into the banner")
      .toBeVisible({ timeout: 15_000 });

    // Still on the list rather than staring at a full-screen timer.
    await expect(page.locator('[data-tour="recipes-row"]').first(),
      "quick brew should leave you where you were").toBeVisible();
  });

  test("tapping the row itself still opens the recipe, not a brew", async ({ page }) => {
    // The quick-brew control sits ON the row, and the row's own tap
    // opens the detail page. A stray tap must not start a cup — this is
    // the "traditional-rows-auto-brewing incident" the row's own comment
    // warns about, now with a control that really does brew sitting
    // inside it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();

    await expect(page.getByRole("button", { name: /Brewing/i }).first(),
      "the row should open the recipe").toBeVisible({ timeout: 15_000 });
  });
});

test.describe("a recipe page offers exactly one brew", () => {
  test("the full-width CTA stands down while the panel is open", async ({ page }) => {
    // The page used to carry both, and they didn't agree: the panel's
    // corner asks for confirmation, the CTA didn't. One page, two
    // brews, two behaviours.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    await expect(brewButton(page), "the panel's corner Brew is the control")
      .toBeVisible();
    await expect(page.getByRole("button", { name: /Brew this cup|Brew your twist/i }),
      "and the full-width CTA should stand down while it's there")
      .toHaveCount(0);
  });

  test("folding the section brings the CTA back", async ({ page }) => {
    // Why it isn't simply deleted: fold the section and the panel goes
    // with it, which would leave a recipe page with no way to brew.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    await page.getByRole("button", { name: /Brewing/i }).first().click();
    await expect(page.getByRole("button", { name: /Brew this cup|Brew your twist/i }),
      "a folded recipe page must still be brewable")
      .toBeVisible({ timeout: 15_000 });
  });
});

test.describe("an empty dock slot draws nothing", () => {
  test("folding the panel leaves no band behind", async ({ page }) => {
    // The slot carries the dock's chrome — a rule line and a strip of
    // ivory — because the controls themselves are transparent. Reported
    // from a saved recipe as a bare band above the sub-tabs where the
    // brew row belonged: the slot drawn, the panel not in it.
    await boot(page);
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await ensureBrewPanel(page);

    // Fold the Brewing section: the explorer unmounts and the slot is
    // left with nothing to hold.
    await page.getByRole("button", { name: /Brewing/i }).first().click();
    await page.waitForTimeout(600);

    const slot = await page.evaluate(() => {
      const el = document.getElementById("brew-dock-blend-detail");
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        children: el.childElementCount,
        height: Math.round(el.getBoundingClientRect().height),
        borderTop: cs.borderTopWidth,
      };
    });
    expect(slot, "the detail screen should still render its slot").not.toBeNull();
    expect(slot!.children, "nothing should be portalled in").toBe(0);
    expect(slot!.height, "an empty slot must take no space").toBeLessThanOrEqual(1);
    expect(parseFloat(slot!.borderTop), "and draw no rule line").toBe(0);
  });
});
