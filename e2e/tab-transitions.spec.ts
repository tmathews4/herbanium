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

  test("the outgoing screen stays until the new one is ready", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CPU throttling is a CDP capability");

    /* The mechanism, stated directly rather than through its symptom.
       A transition keeps the current tree mounted while the next one
       prepares; without it, Home is unmounted the instant the tap
       lands. So: tap Profile, and Home must still be there a beat
       later, with Profile not yet arrived. */
    await bootApp(page);
    const cdp = await page.context().newCDPSession(page);
    await page.waitForTimeout(5200);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    const home = page.locator('[data-tour="home-recent"]').first();
    await expect(home).toBeVisible();

    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.waitForTimeout(60);
    const held = await home.isVisible().catch(() => false);
    const logo = await fallbackLogo(page).count();

    await expect(page.getByTestId("stat-elementals"),
      "and it does eventually arrive").toBeVisible({ timeout: 30_000 });

    expect(logo, "no fallback should have mounted in that window").toBe(0);
    expect(held, "the screen you are leaving should still be there mid-navigation")
      .toBe(true);
  });
});
