// e2e/tour-lifecycle.spec.ts — how a tour STARTS, STOPS, and what it
// leaves behind.
//
// The sibling specs cover geometry: tours.spec.ts walks every tour and
// asserts the callout stays on screen, tour-visibility.spec.ts checks
// every highlighted target sits in the band the user can actually see.
// Both seed `toursEnabled: true` and drive the tour with Next, so
// between them nothing exercises the offer card, Skip, Back, or the
// state a tour hands back when it ends.
//
// That last one is not hypothetical. REPORTED: "after the tutorial you
// can't minimize the brew window." The tours drive real UI state while
// they run — they force the flavour strips into Simple, pin the brew
// row open or shut, and choose which axis the slider is bound to — and
// each of those is an override sitting ON TOP of the user's own
// preference. Nothing cleared them, so the blend tour's last step left
// the row pinned open for the rest of the session: not a broken button,
// a button whose state was being overruled by a tour that had ended.
// It was fixed and hand-verified; this is the regression net.
//
// The tour is the first thing a new user meets, so the failures here
// are first-run failures — the expensive kind.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const ALL_SCREENS = ["home", "blend", "herbanium", "recipes", "reflections", "fieldnotes"];

// The offer card and the first tour of a session both wait for Home's
// arrival sequence (GREETING_ARRIVAL_MS = 4400) before they appear —
// which is most of Playwright's 5s default expect window. Every
// first-appearance assertion gets its own generous timeout rather than
// living on that edge and flaking on a slow CI machine.
const ARRIVAL = 15_000;
// How long to wait before asserting something did NOT appear. toBeHidden
// passes instantly against an element that simply hasn't rendered yet,
// so a "nothing fires" claim has to outlast the window in which it could
// have fired.
const PAST_ARRIVAL = 5_200;

type Seed = { enabled: boolean | null; seen: string[] };

// enabled: null leaves `herbanium.toursEnabled` UNSET, which is the
// state a genuinely fresh profile is in — the app reads that as "not
// asked yet" and shows the offer card. Writing `false` is a different
// thing entirely (asked, declined), and conflating the two is how you
// end up testing a path no new user ever takes.
async function boot(page: Page, { enabled, seen }: Seed) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ([schema, on, seenList]) => {
      // Seed ONCE, not once per navigation. addInitScript re-runs on
      // every load including reload(), and several tests below prove the
      // app REMEMBERED something across a relaunch — an unguarded seed
      // would rewrite the answer before the assertion could read it.
      if (localStorage.getItem("e2e.seeded")) return;
      localStorage.setItem("e2e.seeded", "1");
      localStorage.setItem("herbanium.schemaVersion", schema as string);
      if (on !== null) localStorage.setItem("herbanium.toursEnabled", JSON.stringify(on));
      const map: Record<string, boolean> = {};
      for (const s of seenList as string[]) map[s] = true;
      localStorage.setItem("herbanium.toursSeen", JSON.stringify(map));
    },
    [CURRENT_SCHEMA, enabled, seen] as const,
  );
  await page.goto("/?dev");
}

// Fire exactly one tour: mark every other screen seen.
const armOnly = (target: string): Seed =>
  ({ enabled: true, seen: ALL_SCREENS.filter(s => s !== target) });

const openTab = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();

const callout = (page: Page) => page.getByTestId("tour-callout");
const btn = (page: Page, name: string) =>
  callout(page).getByRole("button", { name, exact: true });

// Click Next until the callout contains `text`. Keyed to content rather
// than a step index, so a tour that gains or loses a step doesn't
// silently retarget these tests at the wrong one. Usually a step title;
// body text where two steps share a title, as the two pill steps do.
async function advanceTo(page: Page, text: string) {
  await expect(callout(page), "the tour should start").toBeVisible({ timeout: ARRIVAL });
  for (let guard = 0; guard < 20; guard++) {
    if ((await callout(page).innerText()).includes(text)) return;
    await btn(page, "Next").click();
  }
  throw new Error(`the tour never reached the "${text}" step`);
}

// Walk to the last step and press Done — the ordinary way a tour ends.
async function finishTour(page: Page) {
  await expect(callout(page), "the tour should start").toBeVisible({ timeout: ARRIVAL });
  for (let guard = 0; guard < 30; guard++) {
    const done = btn(page, "Done");
    if (await done.count()) {
      await done.click();
      return;
    }
    await btn(page, "Next").click();
  }
  throw new Error("the tour never reached its last step");
}

/* ──────────────────────────────────────────────────────────────
   Offered, not imposed.
   ────────────────────────────────────────────────────────────── */
test.describe("the tour is offered before it runs", () => {
  test("a fresh profile is asked first, and yes starts the tour", async ({ page }) => {
    await boot(page, { enabled: null, seen: [] });

    const offer = page.getByTestId("tour-offer");
    await expect(offer, "a fresh profile should be offered a tour")
      .toBeVisible({ timeout: ARRIVAL });
    await expect(callout(page), "and nothing should spotlight before it's answered")
      .toBeHidden();

    await page.getByTestId("tour-offer-yes").click();
    await expect(callout(page), "accepting should start the Home tour")
      .toBeVisible({ timeout: ARRIVAL });
    await expect(offer, "and the card should get out of the way").toBeHidden();
  });

  test("declining is quiet, covers every screen, and survives a relaunch", async ({ page }) => {
    await boot(page, { enabled: null, seen: [] });
    await expect(page.getByTestId("tour-offer")).toBeVisible({ timeout: ARRIVAL });

    await page.getByTestId("tour-offer-no").click();
    await expect(page.getByTestId("tour-offer")).toBeHidden();
    await expect(callout(page), "declining shouldn't start anything").toBeHidden();

    // Declining is one answer for the whole system, not for Home. A user
    // who said no and then walked to the apothecary must not be met with
    // the blend tour — which is unseen, and would otherwise fire.
    await openTab(page, "Apothecary");
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(callout(page), "no means no on every screen, not just the one it was asked on")
      .toBeHidden();

    // And it's recorded as a decision. The distinction that matters:
    // `false` is "asked, declined"; leaving it unset would read as "not
    // asked yet" and the card would come back on the next launch.
    await page.reload();
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(page.getByTestId("tour-offer"), "a declined offer shouldn't be asked again")
      .toBeHidden();
    await expect(callout(page)).toBeHidden();
  });
});

/* ──────────────────────────────────────────────────────────────
   Getting out, and going back.
   ────────────────────────────────────────────────────────────── */
test.describe("leaving a tour", () => {
  test("Skip ends it, and it stays ended", async ({ page }) => {
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");
    await advanceTo(page, "Set the parts");

    await btn(page, "Skip").click();
    await expect(callout(page), "Skip should close the tour").toBeHidden();

    // Leaving the screen and coming back must not restart it — a tour
    // that won't take no for an answer is worse than no tour.
    //
    // Two mechanisms hold this: toursSeen (React state, written by
    // closeActiveTour) and closedToursRef (a ref, belt and braces for a
    // timing case a Firefox CI run caught, where the state write and the
    // auto-start effect raced and the Field Notes tour reopened itself).
    // Measured: on Chromium the state path alone is enough, so removing
    // the ref guard does NOT fail this test here. It's the Firefox
    // projects in CI that exercise the guard. Said plainly because a
    // green run on pixel-9 shouldn't be read as covering both.
    await openTab(page, "Home");
    await openTab(page, "Apothecary");
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(callout(page), "a skipped tour shouldn't reopen on the next visit")
      .toBeHidden();

    // Skipping counts as seen — suppressing it for the session only
    // would bring it back tomorrow.
    await page.reload();
    await openTab(page, "Apothecary");
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(callout(page), "Skip should mark the tour seen, not just hide it")
      .toBeHidden();
  });

  test("Back restores the state the step before it was driving", async ({ page }) => {
    // Back isn't just a text rewind on the blend tour. Steps drive real
    // UI — this pair opens and shuts the brew row — so walking backwards
    // has to re-apply the earlier step's override, or the user reads
    // "tap here to fold them away" over a row that's sitting open.
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");
    const row = page.locator('[data-tour="blend-controls"]');

    await advanceTo(page, "The brew row");
    await expect(row, "the brew-row step shows the row folded")
      .toHaveAttribute("aria-expanded", "false");

    await advanceTo(page, "Time or temperature");
    await expect(row, "the pills step re-opens it — the pills don't exist while it's shut")
      .toHaveAttribute("aria-expanded", "true");

    await btn(page, "Back").click();
    await expect(callout(page)).toContainText("The brew row");
    await expect(row, "stepping Back should bring that step's state back with it")
      .toHaveAttribute("aria-expanded", "false");
  });
});

/* ──────────────────────────────────────────────────────────────
   The reported bug: what the tour leaves behind.

   Each of these drives a control the user owns. The failure shape is
   the same every time and it's a nasty one — the control is on screen,
   looks live, and ignores taps, because a tour that ended is still
   overruling it.
   ────────────────────────────────────────────────────────────── */
test.describe("the tour hands the screen back when it ends", () => {
  test("after Done the brew row answers taps again", async ({ page }) => {
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");
    const row = page.locator('[data-tour="blend-controls"]');

    await finishTour(page);
    await expect(callout(page)).toBeHidden();

    // "Released" means falling back to the user's own state, which is
    // open by default — not "the tour ends with the row shut". Those
    // read the same until the default flips, which is exactly when this
    // should catch it.
    await expect(row, "released, the row follows the user's own preference")
      .toHaveAttribute("aria-expanded", "true");

    await row.click();
    await expect(row, "and tapping it folds — the reported bug was that nothing happened")
      .toHaveAttribute("aria-expanded", "false");
    await row.click();
    await expect(row, "and unfolds again").toHaveAttribute("aria-expanded", "true");
  });

  test("abandoning the tour on a step that pins the row SHUT hands it back too", async ({ page }) => {
    // The nastier half of the same bug, and the likelier path: a real
    // user skips partway. This step forces the row closed to explain
    // that it folds, so a tour abandoned here would leave the sliders
    // unreachable rather than merely stuck open.
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");
    const row = page.locator('[data-tour="blend-controls"]');

    await advanceTo(page, "The brew row");
    await expect(row).toHaveAttribute("aria-expanded", "false");

    await btn(page, "Skip").click();
    await expect(callout(page)).toBeHidden();
    await expect(row, "the row should drop back to the user's own state, not stay pinned shut")
      .toHaveAttribute("aria-expanded", "true");

    await row.click();
    await expect(row, "and answer taps from there").toHaveAttribute("aria-expanded", "false");
  });

  /* WHY THESE TWO SKIP RATHER THAN FINISH.
     onStep rewrites all three overrides on every step, setting each to
     null when the step doesn't declare it. So walking to Done leaves
     only the ones the LAST step declares — and the last step declares
     openControls alone. Axis and familyMode are already null by then,
     which means a test that finishes the tour and then checks them
     passes whether or not closeActiveTour releases anything. It reads
     as coverage and is worth nothing; the first draft of this file had
     exactly that test and it passed with the fix reverted.
     The leak is real when the user ABANDONS the tour on a step that
     declares the override, which is also the likelier thing to do. */

  test("abandoning the tour on a pill step gives the axis back", async ({ page }) => {
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");

    // The second pill step forces the slider onto Temp to demonstrate
    // the swap. The user's own axis is Time.
    await advanceTo(page, "And Temp");
    const temp = page.getByTestId("brew-axis-tempC");
    await expect(temp, "the step should be showing Temp").toHaveAttribute("aria-pressed", "true");

    await btn(page, "Skip").click();
    await expect(callout(page)).toBeHidden();

    await expect(page.getByTestId("brew-axis-timeS"),
      "the axis should fall back to the user's own choice, not stay on the demo's")
      .toHaveAttribute("aria-pressed", "true");
  });

  test("abandoning the tour on a Simple step leaves the toggle working", async ({ page }) => {
    // NOT "the strips revert to Detailed" — they shouldn't, and asserting
    // that failed against correct behaviour. The toggle step deliberately
    // writes the persisted preference to Simple (see the comment above
    // the effect in BlendExtractionExplorer: the user is left where the
    // tour put them, holding the strips short enough that the bars and
    // the sliders share a phone screen). So the claim here is the same
    // one the brew row makes: the control answers taps again.
    //
    // That still separates released from leaked. Leaked, shownFamilyMode
    // reads the override no matter what the tap wrote, and the toggle
    // sits there looking live while refusing to move.
    await boot(page, armOnly("blend"));
    await openTab(page, "Apothecary");

    await advanceTo(page, "The recommended range");
    await expect(page.getByTestId("blend-mode-simple"),
      "the step should be holding the strips on Simple").toHaveAttribute("aria-pressed", "true");

    await btn(page, "Skip").click();
    await expect(callout(page)).toBeHidden();

    const detailed = page.getByTestId("blend-mode-detailed");
    await detailed.click();
    await expect(detailed, "the toggle should answer taps once the tour lets go of it")
      .toHaveAttribute("aria-pressed", "true");
  });
});

/* ──────────────────────────────────────────────────────────────
   Once, and on request.
   ────────────────────────────────────────────────────────────── */
test.describe("a tour fires once", () => {
  test("a completed tour doesn't run again on the next launch", async ({ page }) => {
    await boot(page, armOnly("home"));
    await finishTour(page);
    await expect(callout(page)).toBeHidden();

    await page.reload();
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(callout(page), "a tour walked to Done shouldn't greet the user again")
      .toBeHidden();
  });

  test("replay tour re-arms the tours the user has already seen", async ({ page }) => {
    // The escape hatch from both "no thanks" and "I finished it and want
    // it back". Without this the offer card's promise — "you can replay
    // it anytime from Profile" — is a claim nothing checks.
    await boot(page, { enabled: true, seen: ALL_SCREENS });
    await page.waitForTimeout(PAST_ARRIVAL);
    await expect(callout(page), "nothing should fire with every tour already seen")
      .toBeHidden();

    await openTab(page, "Profile");
    await page.getByRole("button", { name: "replay tour", exact: true }).click();

    await expect(callout(page), "replay should land on Home with the tour running")
      .toBeVisible({ timeout: ARRIVAL });
  });
});
