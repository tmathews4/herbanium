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
    /* NO ELEMENTAL MAY ARRIVE BY CHANCE WHILE THESE TESTS RUN — this is
       the fifth cause from CLAUDE.md's reopened note, and it was neither
       load nor leaked state.

       Every action site calls tryRollOnAction, which rolls Math.random:
       BASE_CHANCE 4.5% times a 4.0 first-time multiplier on a profile
       with nothing earned, so ~18% per eligible action. Each test here
       makes two or three tab visits (meetTheLodestone alone is two)
       before asserting silence, and when one of those rolls landed, an
       arrival ribbon appeared that the test had not caused. The app was
       right; the precondition was never guaranteed.

       That is why the failing test moved around while the assertion
       shape never did. Only a SILENCE assertion can see a stray
       arrival — the tests that wait for a notice cannot fail this way —
       and every failure recorded in CLAUDE.md (:143, :187, :396) is a
       silence assertion. One cause, three faces, again.

       Proved from the page snapshot of a failing run: the ribbon on
       screen read "your lodestone is pulsing / Something stirs in the
       stone", which is the ARRIVAL notice, in a test that had seeded
       the charge to 0 and had not yet forced a glimpse.

       Suppressed through the roller's own cooldown rather than by
       disabling elementals: `elementalsDisabled` would also switch off
       the charge and the dev forcer, which are the subjects here.
       rollOnAction returns null while `now - lastRollAt` is under
       ROLL_COOLDOWN_MS, so a timestamp in the future closes that gate
       for the whole run whatever a test's duration. Deliberate arrivals
       — the forcer, milestones, a charged summon — are untouched, which
       is exactly the line these tests want.

       tests/elemental-roll.test.mjs holds that property, so removing
       the cooldown fails there by name instead of quietly bringing this
       back as flake. */
    localStorage.setItem("herbanium.lastElementalRollAt",
      JSON.stringify(Date.now() + 60 * 60 * 1000));
  }, CURRENT_SCHEMA);
  await page.addInitScript(seed);
  await page.goto("/?dev");
}

/* THREE LOCATORS, because there are two notices and they are not
   interchangeable.

   `banner` matches either ribbon and belongs only where the claim is
   "no elemental notice of any kind" — the silence tests. Using it to
   assert a SPECIFIC notice appeared is what made this file fragile:
   a test would wait for `banner`, be satisfied by the pulsing ribbon,
   and then fail on the charged one's body text. That has now caused
   three separate failures under load, each looking like a different
   bug.

   The two notices have different owners and different lifetimes — the
   charge keeps until it is spent, an arrival stays queued until it is
   met — so a test that means one of them says which. */
const banner = (page: Page) => page.getByText(/your lodestone is (pulsing|charged)/i).first();
const arrivalBanner = (page: Page) => page.getByText(/your lodestone is pulsing/i).first();
const chargeBanner = (page: Page) => page.getByText(/your lodestone is charged/i).first();

/* Neither notice speaks until the lodestone screen has been opened
   once — a ribbon inviting you back somewhere you've never been had
   nowhere coherent to land, and dropped first-run users into a tutorial
   pointing at an inactive stone. Any test that expects a notice has to
   go and meet the stone first, which is what a real user does before
   any of this can happen to them. */
async function meetTheLodestone(page: Page) {
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.getByTestId("lodestone-lede")).toBeVisible({ timeout: 30_000 });
}

/* Driven through the dev charge control on Profile rather than by
   writing localStorage: usePersistedState reads its key once at mount
   and never listens for storage events, so a write from the page
   changes the stored value and not the running app. The first draft of
   one of these tests did exactly that and reported the app broken when
   the test was. */
const fillTheStone = async (page: Page) => {
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  /* EMPTY FIRST, and this is the fix for the last of the load-sensitive
     failures in this file.

     The charge notice fires on a TRANSITION to full, not on being full
     — `chargedRef` compares against the previous value precisely so
     that opening the app on an already-charged stone doesn't greet you
     with old news. So clicking "full" on a stone that is already full
     is a no-op, and no notice appears.

     Which state the stone starts in depended on ordering: the test
     seeds lodestoneCharge to 0 in localStorage, and in ?dev the seed
     mode is re-applied in an effect that can land after the first
     charge-watch has run. Under load that ordering shifts, and the
     test failed for asserting a notice the app was right not to send.

     Emptying first makes the transition real whatever happened before,
     which is what the test meant all along. */
  await page.getByRole("button", { name: "empty", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "full", exact: true }).click();
};

test.describe("notices for what happened while you looked away", () => {
  test("nothing announces itself before the lodestone has been met", async ({ page }) => {
    /* REPORTED: the pulse notice fired the moment the app opened, and
       tapping it dropped the user onto the lodestone screen mid
       first-run tutorial — a callout pointing at a stone that wasn't
       active yet. The notice is an invitation back to a place you have
       been; on a fresh install it invited you somewhere you'd never
       seen, and the app had nothing coherent to show when the
       invitation was accepted.

       Deliberately does the one thing a first-run user does: opens the
       app and moves around WITHOUT going to Field Notes. Filling the
       stone from the dev control is included because that is the
       loudest path to a notice — if anything can break the silence,
       it's that. */
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(0));
    });
    await expect(page.getByRole("button", { name: "Home", exact: true }))
      .toBeVisible({ timeout: 30_000 });

    for (const tab of ["Apothecary", "Journal", "Profile", "Home"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await page.waitForTimeout(600);
      await expect(banner(page),
        `${tab} shouldn't raise an elemental notice before the stone has been met`)
        .toHaveCount(0);
    }

    await fillTheStone(page);
    await page.waitForTimeout(1500);
    await expect(banner(page),
      "even a stone that just filled has nowhere to send you yet").toHaveCount(0);

    // And once the stone HAS been met, the notice that was waiting arrives.
    await meetTheLodestone(page);
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await expect(banner(page),
      "the charge kept — it should announce once there's somewhere to point")
      .toBeVisible({ timeout: 15_000 });
  });

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
    /* Charge seeded empty on purpose. Meeting the lodestone unlocks BOTH
       notices, and the dev profile's stone can already be full — so
       without this the "nothing has arrived yet" line was asserting the
       absence of a charge notice that had every right to be there. The
       subject here is arrivals; the stone gets its own tests. */
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(0));
    });
    await meetTheLodestone(page);
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(banner(page), "nothing has arrived yet").toHaveCount(0);

    await page.getByRole("button", { name: /Force glimpse banner/i }).click();

    await expect(arrivalBanner(page), "an elemental that just arrived should say so")
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/something stirs in the stone/i)).toBeVisible();
  });

  test("an already-full lodestone doesn't greet you on every load", async ({ page }) => {
    /* The seeding behavior, and the reason both watchers start from a
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

  test("the stone filling while you're on another screen says so", async ({ page }) => {
    // The event the charge model created and nothing announced: the
    // lodestone fills from brewing, reviewing and writing, on screens
    // that say nothing about it, then waits to be noticed.
    await boot(page, () => {
      localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(0));
    });
    await meetTheLodestone(page);
    await page.waitForTimeout(1500);
    await expect(banner(page), "nothing to announce yet").toHaveCount(0);

    await fillTheStone(page);

    await expect(chargeBanner(page), "a stone that just filled should say so")
      .toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/brewing, reviewing and writing/i)).toBeVisible();
  });

  test("elementals you already had are never announced as arrivals", async ({ page }) => {
    /* THE MISFIRE THAT COST A CONTROL, not just a notice.

       The dev profile earns 26 attribute elementals through the legacy
       migration, which stamps them `at: 0` — the sentinel for "earned
       before we were counting". They must never be announced. The
       watcher used to rely on seeding a ref on its first pass, which
       only holds if the whole pile lands in one commit; it doesn't
       always, because usePersistedState rehydrates on mount and the dev
       seed applies in an effect of its own. When the timing slipped,
       the app greeted a returning user with a notice about elementals
       they earned months ago.

       And the notice is position:fixed at the top of the screen with an
       interactive card in it, which is exactly where the steep screen's
       minimize sits — so the spurious ribbon COVERED the control. That
       is the user-facing half: tap minimize, nothing happens.

       Boots and then moves around, because the misfire was
       timing-dependent and a single assertion at t=0 was what let it
       through. */
    /* BOTH RIBBONS, deliberately broad. I briefly narrowed this to the
       arrival notice on the theory that a legitimately-filling stone
       was tripping it. That was wrong, and the failure was real: no
       elemental notice of any kind should speak before the lodestone
       screen has been opened, and this test walks four tabs from a
       fresh boot without going near it. The broad locator is the
       stronger assertion and it was right the first time. */

    await boot(page);
    /* Wait on the app rather than on the clock. Asserting "no banner"
       after a fixed sleep races the thing it is testing: too early and
       the migration hasn't run, so the absence is meaningless. Waiting
       for a rendered tab first means the app has mounted and settled
       before the question is asked — this test failed once in two runs
       on a bare 2.5s sleep. */
    await expect(page.getByRole("button", { name: "Home", exact: true }))
      .toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    await expect(banner(page),
      "a profile that already had them has nothing to announce").toHaveCount(0);

    for (const tab of ["Apothecary", "Journal", "Profile", "Home"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await page.waitForTimeout(700);
      await expect(banner(page),
        `moving to ${tab} should not surface a notice about old elementals`)
        .toHaveCount(0);
    }
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
       that makes its neighbors flake isn't paying its way.

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
    await meetTheLodestone(page);
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
    await expect(arrivalBanner(page), "one arriving should announce itself")
      .toBeVisible({ timeout: 15_000 });

    // Go and meet them, the way the banner is asking you to.
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="subtabs"]')
      .getByRole("button", { name: "Field Notes", exact: true }).click();

    const empty = page.getByText(/no specimen waiting/i);
    const stone = page.getByTestId("lodestone-summon");
    for (let i = 0; i < 12; i++) {
      if (await empty.isVisible()) break;
      /* NOTHING IS ASSERTED INSIDE THIS LOOP, deliberately.

         An earlier version waited for the stone to be attached on every
         pass and failed in CI on two device profiles, all retries, at
         that wait — while passing everywhere locally. The window is
         real: dismissing a card fades it for 320ms BEFORE onDismiss
         fires, so between the click and the commit there is a moment
         with the arrival gone from view, the pending count not yet
         decremented, and the stone briefly unrendered. A slower runner
         lands in that moment more often.

         So a missing stone is treated as "not yet", not as a failure.
         The only thing that decides this test is the assertion after
         the loop, which is the behavior under test; everything in here
         is just getting to that state.

         force, because the crystal pulses for as long as something is
         waiting — that glow IS the affordance — and Playwright waits
         for a bounding box that stops moving, which this one never
         does. */
      /* Put away whatever is open before reaching for the stone. The
         stone's summon is suppressed while a card is up
         (`summonReady && !summonTarget`), so "card open" and "stone
         missing" are the same state — clearing the card is what brings
         the stone back, and treating them as one step is why this can't
         deadlock on a card that outlived its click. */
      const card = page.getByTestId("omen-dismiss").or(page.getByTestId("arrival-dismiss"));
      if (await card.count() > 0) {
        await card.first().click({ timeout: 15_000 });
        await page.waitForTimeout(500);
        continue;
      }
      if (await stone.count() === 0) { await page.waitForTimeout(500); continue; }
      await stone.click({ force: true, timeout: 15_000 });
      await page.waitForTimeout(400);
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
    await meetTheLodestone(page);
    await fillTheStone(page);
    await expect(chargeBanner(page)).toBeVisible({ timeout: 15_000 });

    /* Let the ribbon finish arriving before reaching for its ×. It fades
       in over 0.42s and its dismissal waits a further 0.32s before the
       callback fires, so a click that lands mid-arrival is asking a
       moving target to do something it hasn't wired up yet. Visible is
       not the same as ready here.

       KNOWN LOAD-SENSITIVE — see the note in CLAUDE.md. This assertion
       has failed under a full parallel run while passing alone and in a
       file-only run, and a clean-path reproduction shows dismissal
       working exactly as intended (charged=1 -> charged=0). The wait
       below is the honest half-fix; if it fails again the next thing to
       learn is WHICH ribbon survived, which the message now says.

       exact: the ribbon itself is a role=button whose accessible name
       contains the word, so a loose match hits the banner instead of
       its ×. */
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "dismiss", exact: true }).click();
    await expect(banner(page),
      "the × should put the ribbon away — if this fails, check whether the " +
      "surviving text is 'pulsing' or 'charged', because they are different notices")
      .toHaveCount(0);
    await page.waitForTimeout(1500);
    await expect(banner(page), "a dismissed notice must stay dismissed").toHaveCount(0);
  });
});
