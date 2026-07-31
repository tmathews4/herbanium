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

  // Leave worker count to Playwright locally (≈ half your cores); pin
  // to a stable number in CI so runs are reproducible across machines.
  workers: process.env.CI ? 2 : undefined,

  // "html" writes an interactive report to playwright-report/ —
  // open with `npx playwright show-report`.
  reporter: "html",

  use: {
    // Every page.goto("/") resolves against this.
    baseURL: "http://localhost:5173",

    // Debuggability defaults, set up now so we never backfill them:
    //  - trace "on": record a full trace (DOM snapshots + network +
    //    console per step) for EVERY test, pass or fail. Open with
    //    `npx playwright show-trace` (or from the HTML report) and
    //    time-travel through the run. For a large mature suite you'd
    //    switch this to "on-first-retry"/"retain-on-failure" to save
    //    space; while the suite is small, always-on is the best
    //    learning/debugging tool.
    trace: "on",
    //  - screenshot only when a test fails (cheap, and enough for
    //    "what did the screen look like when it broke").
    screenshot: "only-on-failure",
  },

  // Browser matrix. Chromium + WebKit run in true mobile-emulation
  // (touch + mobile viewport) since the app is phone-first. Firefox
  // does NOT support Playwright's mobile emulation (isMobile), so it
  // runs desktop-engine at a narrow phone-width viewport instead — the
  // app's responsive layout still renders its phone UI there.
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], viewport: { width: 412, height: 915 } },
    },
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
