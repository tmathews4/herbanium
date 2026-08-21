// e2e/tab-transitions.spec.ts — switching tabs must not flash the
// loading logo.
//
// REPORTED: "going to profile shows the herbanium logo for a moment
// behind screen then load profile page", and before that "there's a bit
// of lag almost so things load in a bit roughly".
//
// Every screen but Home is `lazy`, so switching tabs suspends. A
// suspending update inside a Suspense boundary tears the current screen
// down and shows ScreenFallback — which is the logo. That fallback
// already waits 0.12s before fading in, precisely so a warm navigation
// never sees it; Profile cold measured ~400ms, so it was seen every
// time. Marking the tab change as a transition lets the old screen stay
// until the new one is ready. The wait is not shorter; it stops being a
// flash of nothing.
//
// Measured before and after, cold, three runs each:
//
//   Profile     394 / 398 / 399 ms, logo every time
//               159 / 184 / 213 ms, logo never
//   Apothecary  191 / 282 / 230 ms, logo every time
//               276 / 386 / 275 ms, logo never
//
// THE CPU THROTTLE IS THE POINT OF THIS FILE. Without it the fallback's
// own 0.12s delay hides the defect on a fast machine — the test would
// pass against the broken build and prove nothing, which is a trap this
// suite has fallen into three times in one day. Throttled, the wait is
// long enough that a torn-down screen is unmistakable.
import { test, expect, type Page } from "@playwright/test";
import { bootApp } from "./helpers/brew";

test.beforeEach(() => test.slow());

const fallbackLogo = (page: Page) =>
  page.locator('img[src*="herbanium-logo-icon"]');

/** Walk to a tab and watch for the fallback the whole way there. */
async function switchTo(page: Page, name: string, anchor: string) {
  const started = Date.now();
  await page.getByRole("button", { name, exact: true }).click();
  let sawLogo = false;
  const target = page.locator(anchor).first();
  for (;;) {
    if (await fallbackLogo(page).count() > 0) sawLogo = true;
    if (await target.isVisible().catch(() => false)) break;
    if (Date.now() - started > 30_000) break;
  }
  return { sawLogo, ms: Date.now() - started };
}

test.describe("moving between main tabs", () => {
  test("never falls back to the loading logo", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CPU throttling is a CDP capability");

    await bootApp(page);
    /* Throttle AFTER boot so the first paint isn't what we're measuring
       — the claim is about navigation, not about cold start. */
    const cdp = await page.context().newCDPSession(page);
    await page.waitForTimeout(5200);              // the greeting choreography
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    /* FIRST visit to each tab, which is the only time the chunk can be
       cold and therefore the only time this can go wrong. */
    const walk: Array<[string, string]> = [
      ["Apothecary", '[data-tour="subtabs"]'],
      ["Journal",    '[data-tour="subtabs"]'],
      ["Profile",    '[data-testid="stat-elementals"]'],
      ["Home",       '[data-tour="home-recent"]'],
    ];

    const flashed: string[] = [];
    for (const [name, anchor] of walk) {
      const { sawLogo, ms } = await switchTo(page, name, anchor);
      console.log(`  ${name.padEnd(11)} ${String(ms).padStart(5)}ms  logo=${sawLogo}`);
      if (sawLogo) flashed.push(`${name} (${ms}ms)`);
    }

    expect(flashed,
      `these tabs tore their screen down to the loading logo: ${flashed.join(", ")}`)
      .toEqual([]);
  });

  test("never shows neither screen", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CPU throttling is a CDP capability");

    /* THE MECHANISM, AS AN INVARIANT RATHER THAN A SAMPLED STATE, and
       the first version of this test is why. It slept 60ms after the
       tap and asserted the old screen was still up — which assumes
       there IS a visible in-between, and there often is not: with the
       chunk already evaluated by the idle preloader the swap can
       complete in well under that. The assertion measured a window
       that need not exist, so it failed on a build that was working.
       Under the full suite it failed on both viewports; alone it
       failed too, which is what ruled out load.

       What is actually true at every instant, transition or not, is
       that ONE of the two screens is on it. Without the transition the
       outgoing screen is torn down before the incoming one is ready
       and the gap is filled by the fallback — so there are samples
       where neither is present. That holds however fast the machine
       is: a swap too quick to observe simply never produces a bad
       sample, and a slow one produces many. */
    await bootApp(page);
    const cdp = await page.context().newCDPSession(page);
    await page.waitForTimeout(5200);              // the greeting choreography
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    const home = page.locator('[data-tour="home-recent"]').first();
    const profile = page.getByTestId("stat-elementals");
    await expect(home).toBeVisible();

    await page.getByRole("button", { name: "Profile", exact: true }).click();

    const started = Date.now();
    let empties = 0, samples = 0, sawFallback = false;
    for (;;) {
      const [onHome, onProfile, fb] = await Promise.all([
        home.isVisible().catch(() => false),
        profile.isVisible().catch(() => false),
        fallbackLogo(page).count(),
      ]);
      samples++;
      if (fb > 0) sawFallback = true;
      if (!onHome && !onProfile) empties++;
      if (onProfile) break;
      if (Date.now() - started > 30_000) break;
    }

    await expect(profile, "and it does arrive").toBeVisible({ timeout: 30_000 });
    expect(sawFallback, "no fallback should have mounted on the way").toBe(false);
    expect(empties,
      `${empties} of ${samples} samples showed neither the screen being left ` +
      `nor the one being opened — that gap is what the loading logo fills`)
      .toBe(0);
  });
});
