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

/* The seed takes no argument. Typing it `(w: Window) => void` looked
   harmless and doesn't match what addInitScript accepts — Playwright's
   PageFunction<Window> resolves to a structural Window that TS won't
   unify with the lib.dom one, and the error unfolds into forty lines
   about ClipboardItem. Caught by CI's typecheck, which is a command
   this repo has and I hadn't been running. */
async function boot(page: Page, seed: () => void = () => {}) {
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
  test("an elemental arriving announces itself, whatever path brought it", async ({ page }) => {
    /* THE GAP THIS CLOSES. The banner used to be armed by snapshotting
       the earned set in the steep flow's onDone, so it only fired for
       elementals that arrived during a brew. The lodestone moved the
       moment of arrival to a deliberate tap on another screen, that
       path never armed the snapshot, and the banner silently stopped
       firing for what had become the main route.

       The watcher now watches the SET, so anything that grows it
       announces itself. This drives it through the dev forcer, which
       adds an id the same way a real roll does — if the watcher is ever
       rewired back to a single caller, this fails. */
    await boot(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(banner(page), "nothing has arrived yet").toHaveCount(0);

    await page.getByRole("button", { name: /Force glimpse banner/i }).click();

    await expect(banner(page), "an elemental that just arrived should say so")
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/something stirs in the stone/i)).toBeVisible();
  });

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

  test("a glimpse doesn't outlive the thing it points at", async ({ page }) => {
    /* REPORTED: released every elemental, changed tab, and was told
       something was waiting.

       The watcher announces growth in the earned set and nothing ever
       retracted the announcement. The path is ordinary — a summon adds
       an elemental, the banner arms, the user meets it right there on
       the lodestone screen, which marks it seen. Pending is zero and
       the banner is still armed, so the next tab change surfaces it.

       Worth more than tidiness: a non-null glimpse suppresses the
       charged-stone banner, so a stale one silences the notice the user
       would have wanted, for good.

       ZERO PENDING IS THE CONDITION UNDER TEST, so the fixture has to
       be able to reach zero — and neither shipped seed can. The dev
       profile has 26 elementals waiting and the "new user" seed has 29,
       because attribute elementals are earned from what the profile
       already contains rather than seeded as a list. Meeting one leaves
       the rest pending, where the banner is correct to stay up.

       So the seen set is written before load: every attribute id marked
       met, which is the state a player reaches by playing. Written as
       an init script rather than mid-run because usePersistedState
       reads its key once at mount and never listens for storage events
       — a write from the page changes the stored value and not the
       running app, which an earlier test in this file learned the hard
       way. */
    /* REACHING ZERO PENDING, which is the condition under test and
       which neither shipped seed reaches on its own: the dev profile
       has 26 elementals waiting and the "new user" seed has 29, because
       attribute elementals are earned from what the profile already
       contains rather than seeded as a list.

       Two approaches that don't work, both worth recording. Marking
       them all seen in localStorage before load is undone by first
       paint — in ?dev the seed mode is re-applied on every mount, and
       applying it overwrites seenElementalIds. Draining all 26 through
       the UI does work and took ~55s of summon-and-dismiss, which under
       fullyParallel starves its own file-mates into failing; a test
       that makes its neighbours flake isn't paying its way.

       What works is the migration flag. The legacy pass that grants the
       pile is explicitly one-time and records that in
       elementalLegacyMigrated — so let it run, empty the earned stores,
       and reload. The flag stops it granting them again and the app
       comes up with nothing earned and nothing waiting, which is the
       state a player reaches by meeting everything.

       The loop below is bounded and self-terminating: it stops the
       moment the count says empty, and the cap only exists so a broken
       summon fails on the assertion rather than spinning. Two rounds
       are expected — the creation omen, then the one arrival. */
    await boot(page);
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      localStorage.setItem("herbanium.rolledElementalIds",
        JSON.stringify({ __type: "Set", items: [] }));
      localStorage.setItem("herbanium.wildElementals", JSON.stringify([]));
    });
    await page.reload();
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Profile", exact: true }).click();

    /* Clear the field rather than asserting it starts clear. Whether a
       banner is up on arrival is the SUBJECT of two other tests in this
       file, and it is load-sensitive here: the announce watcher seeds
       itself once the legacy migration flag lands, and under a full
       parallel run that migration can land across more than one commit
       — the ref seeds on the first and reads the rest as growth.

       Asserting absence here was therefore testing someone else's
       contract on a slower machine. What this test is about starts one
       line down. */
    const dismiss = page.getByRole("button", { name: "dismiss", exact: true });
    if (await banner(page).isVisible()) {
      await dismiss.first().click();
      await expect(banner(page)).toHaveCount(0, { timeout: 15_000 });
    }

    await page.getByRole("button", { name: /Force glimpse banner/i }).click();
    await expect(banner(page), "one arriving should announce itself")
      .toBeVisible({ timeout: 15_000 });

    // Go and meet them, the way the banner is asking you to.
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Field Notes", exact: true }).click();

    const empty = page.getByText(/no specimen waiting/i);
    const stone = page.getByTestId("lodestone-summon");
    for (let i = 0; i < 6 && !(await empty.isVisible()); i++) {
      /* Wait for the stone to become tappable rather than sleeping at
         it. The pulse — and with it the summon — is deliberately held
         for a beat after any tour on the page ends, so a glow doesn't
         arrive in the same frame the callout leaves. A fixed wait here
         would encode that delay in two places.

         force, because the crystal pulses for as long as something is
         waiting — that glow IS the affordance — and Playwright waits
         for a bounding box that stops moving, which this one never
         does. Safe: the effect is asserted after the loop. */
      await expect(stone).toBeAttached({ timeout: 15_000 });
      await stone.click({ force: true, timeout: 15_000 });
      const card = page.getByTestId("omen-dismiss").or(page.getByTestId("arrival-dismiss"));
      await card.first().click({ timeout: 15_000 });
      await page.waitForTimeout(250);
    }

    await expect(empty, "nothing should be left pending").toBeVisible({ timeout: 15_000 });

    // THE BUG. Changing tab used to re-surface the stale banner.
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.waitForTimeout(1200);
    await expect(banner(page),
      "nothing is waiting, so nothing should say it is").toHaveCount(0);
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
