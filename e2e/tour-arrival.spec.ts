// e2e/tour-arrival.spec.ts — every screen's tour arrives, none of them
// snaps on.
//
// REPORTED: "I would like the tutorial to fade in better on new tabs.
// It just appears abruptly currently."
//
// WHAT THIS FILE ACTUALLY FOUND, which is not what it set out to find.
// The overlay carries a 1.4s ease-in and the comment beside it says the
// tour should "settle over" the screen "rather than snap on". The
// suspicion was that it only ever ran once: <GuidedTour> has no key, so
// if activeTour changed from one tour straight to another React would
// reuse the instance and `tourFadeIn`, a MOUNT animation, would not
// replay.
//
// Measured, it does replay — and the reason is in App: the effect that
// starts a tour bails on `if (activeTour) return`, and closeActiveTour
// sets it to null, so activeTour always goes non-null -> null ->
// non-null and the component unmounts in between. Adding a key changed
// nothing, which this spec reported by passing with and without it. The
// key was removed rather than kept as a charm.
//
// So this is a GUARD, not the verification of a fix: every screen's
// tour does ease in today, on every tab, and this fails if that stops
// being true. Whatever reads as abrupt on arrival is something else,
// and is still open.
//
// REDUCED MOTION IS DELIBERATELY OFF HERE, and it is why this could not
// have been caught by the rest of the suite: every other spec boots
// with `reducedMotion: "reduce"`, and the component honours it by
// dropping the animation entirely. Under that setting both the broken
// and the fixed build look identical — instant — so a test written the
// usual way would pass either way.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

test.beforeEach(() => test.slow());

/** Opacity of the tour overlay right now, or null if it isn't up. */
const overlayOpacity = (page: Page) => page.evaluate(() => {
  const dim = document.querySelector('[data-testid="tour-dim"]');
  const overlay = dim?.parentElement as HTMLElement | undefined;
  if (!overlay) return null;
  return Number(getComputedStyle(overlay).opacity);
});

async function bootWithTours(page: Page) {
  /* Motion ON. The default boot reduces it, which switches the very
     thing under test off. */
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "true");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({}));
    localStorage.setItem("herbanium.profile", JSON.stringify({ name: "Test Brewer", onboarded: true }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
}

test.describe("a screen's tour", () => {
  test("fades in on every tab, not just the first", async ({ page }) => {
    await bootWithTours(page);

    /* Catch each tour in the act. Poll from the moment the overlay
       exists and keep the lowest opacity seen — a tour that fades has
       to pass through the middle, and one that snaps never will. */
    const catchArrival = async (label: string) => {
      const started = Date.now();
      let lowest = 1;
      let seen = false;
      while (Date.now() - started < 20_000) {
        const o = await overlayOpacity(page);
        if (o != null) { seen = true; lowest = Math.min(lowest, o); }
        if (seen && o != null && o >= 0.999) break;
        if (!seen && Date.now() - started > 15_000) break;
      }
      expect(seen, `${label}: no tour overlay appeared`).toBe(true);
      return lowest;
    };

    const first = await catchArrival("home");
    expect(first, `the first tour arrived at opacity ${first}`).toBeLessThan(0.95);

    /* Put the first tour away before navigating — the overlay is a
       full-viewport click-catcher, so the tab bar is unreachable while
       it is up. Skip is the same exit a user takes. */
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(page.getByTestId("tour-dim")).toHaveCount(0, { timeout: 15_000 });

    /* Leave, and land somewhere with a tour of its own. */
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    const second = await catchArrival("apothecary");
    expect(second,
      `the second screen's tour arrived at opacity ${second} — it should ` +
      `ease in the way the first one did, not snap on`)
      .toBeLessThan(0.95);
  });
});
