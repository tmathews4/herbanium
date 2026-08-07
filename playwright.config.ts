// Playwright configuration — https://playwright.dev/docs/test-configuration
//
// The big idea: `npx playwright test` reads this file, boots the app
// (webServer), then runs every *.spec.js under testDir against it,
// across each browser "project" below.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where test files live. Kept separate from tests/ (the node .mjs
  // data-integrity suite) so the two runners never pick up each
  // other's files.
  testDir: "./e2e",

  // Each test gets this long before it's marked failed. Generous
  // because cold Vite dev-server compiles on WSL can be slow.
  /* 30s. It was briefly raised to 60 on the theory that the local
     one-failure-per-run was a slow machine, and the raise disproved
     itself: the next failure was the same hook timing out at 180s
     (60 x test.slow()) instead of 90. A budget a failure scales with
     is not a budget problem.

     What actually happens is a click waiting on a locator that never
     matches — see the note on brewAndMinimize in smoke.spec.ts. A bare
     .click() has no timeout of its own, so it consumes whatever the
     test has and reports "timeout in beforeEach", which names the hook
     and not the thing that was missing. The fix is to make that
     failure legible, not to make the wait longer. */
  timeout: 30_000,

  // `expect(...)` polls until the assertion passes or this elapses.
  // This auto-waiting is Playwright's core anti-flake mechanism — you
  // almost never write manual sleeps.
  expect: { timeout: 10_000 },

  // Run test files (and tests within them) in parallel workers.
  fullyParallel: true,

  // In CI: fail if someone committed test.only, and retry flaky
  // failures twice before declaring them real.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* WORKERS STAY AT PLAYWRIGHT'S DEFAULT LOCALLY — measured, not
     assumed. The local suite fails about one test per full run, a
     different one each time and every one passing alone, which looks
     exactly like worker contention. Capping the workers is the obvious
     fix and it does not work: at 3 workers the run failed TWO tests in
     11.7 minutes where 4 workers failed one in 10.2. Slower and no
     steadier.

     Contention was the wrong theory anyway — the failures are a click
     hanging on a locator that never appears, not tests going slowly.
     Left at the default because nothing measured says otherwise, and
     the CI pin below stays for reproducibility across machines. */
  workers: process.env.CI ? 2 : undefined,

  // "html" writes an interactive report to playwright-report/ —
  // open with `npx playwright show-report`.
  reporter: "html",

  use: {
    // Every page.goto("/") resolves against this.
    baseURL: "http://localhost:5173",

    // Debuggability defaults:
    //  - trace "retain-on-failure": record a full trace (DOM snapshots +
    //    network + console per step) but keep it only for tests that
    //    FAIL — open with `npx playwright show-trace` or from the HTML
    //    report and time-travel the failure. Always-on traces don't
    //    scale across a wide device matrix (a zip per test per device),
    //    so we keep them where they matter and use `--trace on` ad hoc
    //    when actively debugging a passing test.
    trace: "retain-on-failure",
    //  - screenshot only when a test fails.
    screenshot: "only-on-failure",
  },

  // Device matrix — broad on purpose (infrastructure early, so device-
  // specific breakage surfaces before detailed tests pile up). Grouped by
  // engine, since a device preset implies its engine (Pixel/Galaxy ->
  // chromium, iPhone/iPad -> webkit). Chromium + WebKit presets run in
  // true mobile emulation (mobile viewport, DPR, touch, UA). Firefox has
  // no mobile emulation in Playwright, so it runs Gecko at fixed phone-
  // and desktop-width viewports to still catch engine-specific rendering.
  // Foldable (Galaxy Z Fold 7 Cover = folded/narrow, main = unfolded/wide)
  // and the tablet/desktop widths exercise the app's foldable wide-mode.
  projects: [
    // — Chromium engine (Android + desktop Chrome) —
    { name: "pixel-9", use: { ...devices["Pixel 9"] } },
    { name: "pixel-fold-cover", use: { ...devices["Galaxy Z Fold 7 Cover"] } },
    { name: "pixel-fold-open", use: { ...devices["Galaxy Z Fold 7"] } },
    { name: "galaxy-s9", use: { ...devices["Galaxy S9+"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    // — WebKit engine (iOS + iPadOS + desktop Safari) —
    { name: "iphone-15", use: { ...devices["iPhone 15"] } },
    { name: "iphone-se", use: { ...devices["iPhone SE (3rd gen)"] } },
    { name: "ipad-pro", use: { ...devices["iPad Pro 11"] } },
    // — Firefox engine (no mobile emulation; fixed viewports) —
    { name: "firefox-phone", use: { ...devices["Desktop Firefox"], viewport: { width: 412, height: 915 } } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
  ],

  // Playwright manages the server itself: builds the app, serves the
  // production bundle with `vite preview`, waits until it responds, runs
  // the tests, then shuts it down. We test the BUILT app (not the dev
  // server) on purpose — static files have no on-the-fly compilation, so
  // they stay stable under parallel workers (the dev server buckled under
  // that on WSL) and they're closer to what actually ships. The timeout
  // is generous to cover the one-time build. reuseExistingServer lets a
  // local run piggyback on an already-running server on :5173.
  webServer: {
    command: "npm run build && npm run preview -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
