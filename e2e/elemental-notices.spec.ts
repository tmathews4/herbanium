// e2e/elemental-notices.spec.ts — the two things that happen off-screen.
//
// Elementals arrive and the lodestone fills, both while the user is
// doing something else. Each gets a ribbon.
//
// WHY THE ARRIVAL ONE NEEDED FIXING: it used to be armed by snapshotting
// the earned set in the steep flow's onDone and diffing afterwards,
// which worked while a brew was the only way an elemental could arrive.
// The lodestone moved that moment to a deliberate tap on another screen,
// which never armed the snapshot — so the banner silently stopped firing
// for the path that had become the main one. Five different places add
// to the earned set now, so the effect watches the SET rather than being
// armed at any of them.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";


test.beforeEach(() => test.slow());

async function boot(page: Page, seed: (w: Window) => void = () => {}) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.addInitScript(seed);
  await page.goto("/?dev");
}

const banner = (page: Page) => page.getByText(/your lodestone is (pulsing|charged)/i).first();

test.describe("notices for what happened while you looked away", () => {
  test("an already-full lodestone doesn't greet you on every load", async ({ page }) => {
    /* The seeding behaviour, and the reason both watchers start from a
       ref rather than from zero. Without it, opening the app on a
       charged stone — or with elementals already collected — would
       announce things the user did days ago, every single time. */
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(6));
    });
    await page.waitForTimeout(2500);
    await expect(banner(page),
      "a charge that was already full is not news").toHaveCount(0);
  });

  /* Driven through the dev charge control on Profile rather than by
     writing localStorage: usePersistedState reads its key once at mount
     and never listens for storage events, so a write from the page
     changes the stored value and not the running app. The first draft
     of this test did exactly that and reported the app broken when the
     test was. */
  const fillTheStone = async (page: Page) => {
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByRole("button", { name: "full", exact: true }).click();
  };

  test("the stone filling while you're on another screen says so", async ({ page }) => {
    // The event the charge model created and nothing announced: the
    // lodestone fills from brewing, reviewing and writing, on screens
    // that say nothing about it, then waits to be noticed.
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(0));
    });
    await page.waitForTimeout(2000);
    await expect(banner(page), "nothing to announce yet").toHaveCount(0);

    await fillTheStone(page);

    await expect(banner(page), "a stone that just filled should say so")
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/brewing, reviewing and writing/i)).toBeVisible();
  });

  test("dismissing it puts it away and it doesn't come back", async ({ page }) => {
    // The charge keeps until it's spent, so the ribbon must not nag —
    // one telling is the whole contract.
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(0));
    });
    await page.waitForTimeout(2000);
    await fillTheStone(page);
    await expect(banner(page)).toBeVisible({ timeout: 15_000 });

    // exact: the ribbon itself is a role=button whose accessible name
    // contains the word, so a loose match hits the banner instead of
    // its ×.
    await page.getByRole("button", { name: "dismiss", exact: true }).click();
    await expect(banner(page)).toHaveCount(0);
    await page.waitForTimeout(1500);
    await expect(banner(page), "a dismissed notice must stay dismissed").toHaveCount(0);
  });
});
