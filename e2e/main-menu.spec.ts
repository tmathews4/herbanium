// e2e/main-menu.spec.ts — the main menu is never not on screen.
//
// Every detail screen in this app is `position: absolute; inset: 0;
// zIndex: 30` inside the app shell, which meant each one covered the tab
// bar by construction: a recipe, an ingredient, a cup, a journal entry
// and a running steep each took the whole app and left the back button
// as the only way out. They stop at `bottom: var(--app-dock-h)` now.
//
// This spec exists because that class of bug is invisible to ordinary
// assertions. The tab bar was always in the DOM, always `visible` to
// Playwright, always the right size — it was simply painted underneath
// something. So every check here is a HIT TEST: ask the document what
// element is actually at the menu's coordinates and require the answer
// to be the menu. `toBeVisible` would pass on every screen even with the
// bug fully present.
//
// Walks the real navigation rather than a list of routes, because the
// question is "can the user get somewhere the menu is gone", and the
// only honest way to answer it is to go there the way they would.
import { test, expect, type Page } from "@playwright/test";
import { brewFromDetail, detailBrewControl } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const openSubTab = (page: Page, name: string) =>
  page.locator('[data-tour="subtabs"]').getByRole("button", { name, exact: true }).click();

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

/**
 * The menu is the row of main tabs at the bottom. Located via the Home
 * tab button rather than a container hook so this can't silently start
 * asserting about some other element that happens to carry the id.
 *
 * Probes THREE points across the row — a menu can be half-covered by
 * something anchored to one edge, and a single center probe would miss
 * it. Returns a description rather than a boolean so a failure says what
 * was on top instead of just "false".
 */
async function menuState(page: Page): Promise<string> {
  return page.evaluate(() => {
    const home = [...document.querySelectorAll("button")]
      .find(b => b.textContent?.trim().toUpperCase() === "HOME");
    if (!home) return "no HOME button in the document";
    const row = home.parentElement;
    if (!row) return "HOME button has no row";
    const r = row.getBoundingClientRect();
    if (r.height === 0) return "menu has zero height";
    if (r.bottom > window.innerHeight + 1) {
      return `menu is below the fold (bottom ${Math.round(r.bottom)} > viewport ${window.innerHeight})`;
    }
    const y = r.top + r.height / 2;
    for (const [label, x] of [
      ["left", r.left + r.width * 0.15],
      ["center", r.left + r.width * 0.5],
      ["right", r.left + r.width * 0.85],
    ] as [string, number][]) {
      const top = document.elementFromPoint(x, y);
      if (!top) return `nothing at the ${label} of the menu`;
      if (!row.contains(top) && top !== row) {
        return `covered at the ${label} by <${top.tagName}${top.id ? "#" + top.id : ""}>`;
      }
    }
    return "reachable";
  });
}

async function expectMenu(page: Page, where: string) {
  // Polls rather than sampling once. Screens animate in, and a single
  // reading taken mid-transition describes a frame — the same mistake
  // that made the tour spotlight test fail across CI. The claim is that
  // the menu is reachable once the screen has settled, not that it is
  // reachable in every intermediate frame of a slide.
  //
  // Still a real assertion: a genuinely covered menu never settles, so
  // this fails on the bug it was written for.
  await expect.poll(() => menuState(page), {
    message: `main menu on ${where}`,
    timeout: 5_000,
  }).toBe("reachable");
}

test.describe("the main menu is reachable everywhere you can navigate", () => {
  test.beforeEach(async ({ page }) => { await boot(page); });

  test("every tab and sub-tab", async ({ page }) => {
    await expectMenu(page, "Home");

    await openTab(page, "Apothecary");
    await expectMenu(page, "Apothecary");
    for (const sub of ["Blend", "Herbanium"]) {
      await openSubTab(page, sub);
      await expectMenu(page, `Apothecary · ${sub}`);
    }

    await openTab(page, "Journal");
    await expectMenu(page, "Journal");
    for (const sub of ["Recipes", "Reflections", "Field Notes"]) {
      await openSubTab(page, sub);
      await expectMenu(page, `Journal · ${sub}`);
    }

    await openTab(page, "Profile");
    await expectMenu(page, "Profile");
  });

  test("a recipe, and an ingredient reached from inside it", async ({ page }) => {
    await openTab(page, "Journal");
    await openSubTab(page, "Recipes");
    await page.locator('[data-tour="recipes-row"]').first().click();
    await expect(detailBrewControl(page), "the recipe offers its brew").toBeVisible();
    await expectMenu(page, "a recipe detail");

    // Overlay-on-overlay: tapping an ingredient inside the recipe swaps
    // one full-screen overlay for another, which is the path most likely
    // to leave a stale layer behind.
    //
    // Scoped to the open recipe. Unscoped, `.first()` matched an
    // ingredient chip in the recipes LIST still mounted behind the
    // overlay, and the click spent thirty seconds being intercepted by
    // the recipe sitting on top of it — a locator bug that reads exactly
    // like a layout bug.
    await page.getByTestId("blend-detail")
      .getByRole("button", { name: /Gunpowder Green|Spearmint|Chamomile/i })
      .first().click();
    await expectMenu(page, "an ingredient opened from a recipe");
  });

  test("an ingredient from the compendium, on all three of its tabs", async ({ page }) => {
    await openTab(page, "Apothecary");
    await openSubTab(page, "Herbanium");
    await page.getByRole("button", { name: /Chamomile/i }).first().click();
    for (const t of ["Overview", "Brewing", "Pairings"]) {
      await page.getByRole("button", { name: t, exact: true }).click();
      await expectMenu(page, `ingredient · ${t}`);
    }
  });

  test("a running steep, minimized and full", async ({ page }) => {
    await openTab(page, "Journal");
    await openSubTab(page, "Recipes");
    await page.locator('[data-tour="recipes-row"]').first().click();
    await brewFromDetail(page);

    // The full steep screen. This is the one that was most defensible as
    // an exception — it's immersive and has its own minimize — but the
    // rule is the rule: you can always leave.
    await expectMenu(page, "a running steep");

    await page.getByRole("button", { name: /minimize/i }).click();
    await expect(page.getByTestId("brew-banner"),
      "minimizing should leave the brew as a top dock row").toBeVisible();
    await expectMenu(page, "a minimized steep");

    // The minimized brew is a dock row at the TOP now, not a floating
    // card. Proven by what's underneath it: as a flex row it displaces
    // the page, so nothing of the app can be sitting under its middle.
    const bannerOverlaps = await page.getByTestId("brew-banner").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const under = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return under && !el.contains(under) && under !== el ? under.tagName : null;
    });
    expect(bannerOverlaps, "the brew row should occupy layout, not float over it").toBe(null);

    // And it restores, which is the whole point of it being a control.
    await page.getByTestId("brew-banner").click();
    await expect(page.getByRole("button", { name: /minimize/i }),
      "tapping the row should bring the steep back").toBeVisible();
    await expectMenu(page, "a restored steep");
  });

  test("the menu actually navigates out of a detail screen", async ({ page }) => {
    // A visible menu is only half of it. Sub-tabs became reachable from
    // detail screens the moment those screens stopped covering the dock,
    // and the sub-tab handler didn't dismiss the overlay the way the
    // main-tab handler does — so the tap changed the mode UNDERNEATH the
    // detail screen and read as a dead button. Reported as "open Brewing
    // on an ingredient, tap Blend, nothing happens".
    //
    // Both kinds of tab are checked from inside a detail screen, because
    // "the menu is on screen" and "the menu works from here" are
    // different claims and only the first was ever tested.
    await openTab(page, "Apothecary");
    await openSubTab(page, "Herbanium");
    await page.getByRole("button", { name: /Chamomile/i }).first().click();
    await page.getByRole("button", { name: "Brewing", exact: true }).click();
    await expect(page.locator('[data-tour="blend-controls"]'),
      "the ingredient's brewing tab should be open").toBeVisible();

    // Sub-tab out of it.
    await openSubTab(page, "Blend");
    await expect(page.locator('[data-tour="blend-search"]'),
      "tapping Blend should land on the compose screen, not sit behind the ingredient")
      .toBeVisible();
    await expect(page.locator("#brew-dock-ingredient-detail"),
      "and the ingredient screen should be gone").toHaveCount(0);

    // Main tab out of one too, for the same reason. Back via Herbanium
    // first — on the Blend screen a "Chamomile" chip ADDS the
    // ingredient to the pot rather than opening its page.
    await openSubTab(page, "Herbanium");
    await page.getByRole("button", { name: /Chamomile/i }).first().click();
    await expect(page.getByRole("button", { name: "Brewing", exact: true })).toBeVisible();
    await openTab(page, "Journal");
    await expect(page.locator("#brew-dock-ingredient-detail"),
      "a main tab should leave the detail screen as well").toHaveCount(0);
  });

  test("navigating away mid-brew keeps both the menu and the brew", async ({ page }) => {
    await openTab(page, "Journal");
    await openSubTab(page, "Recipes");
    await page.locator('[data-tour="recipes-row"]').first().click();
    await brewFromDetail(page);
    await page.getByRole("button", { name: /minimize/i }).click();

    // The menu is what makes this possible at all — with the steep
    // covering it there was nowhere to tap.
    for (const tab of ["Home", "Apothecary", "Journal", "Profile"]) {
      await openTab(page, tab);
      await expectMenu(page, `${tab} with a brew running`);
      await expect(page.getByTestId("brew-banner"),
        `the brew should follow you to ${tab}`).toBeVisible();
    }
  });
});
