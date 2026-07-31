// Playwright configuration — https://playwright.dev/docs/test-configuration
//
// The big idea: `npx playwright test` reads this file, boots the app
// (webServer), then runs every *.spec.js under testDir against it.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where test files live. Kept separate from tests/ (the node .mjs
  // data-integrity suite) so the two runners never pick up each
  // other's files.
  testDir: "./e2e",

  // Each test gets this long before it's marked as failed. Generous
  // because cold Vite dev-server compiles on WSL can be slow.
  timeout: 30_000,

  // `expect(...)` polls until the assertion passes or this elapses.
  // This auto-waiting is Playwright's core anti-flake mechanism — you
  // almost never write manual sleeps.
  expect: { timeout: 10_000 },

  // Run test files in parallel workers (one browser each). A single
  // smoke test won't notice, but it matters as the suite grows.
  fullyParallel: true,

  // In CI: fail if someone committed test.only, and retry flaky
  // failures twice before declaring them real.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // "html" writes an interactive report to playwright-report/ —
  // open with `npx playwright show-report`.
  reporter: "html",

  use: {
    // Every page.goto("/") resolves against this.
    baseURL: "http://localhost:5173",
    // Record a trace (DOM snapshots + network + console per step) on
    // first retry of a failing test — view with `npx playwright show-trace`.
    trace: "on-first-retry",
  },

  // The app is phone-first (fixed-width frame), so test in a mobile
  // viewport by default. devices["Pixel 7"] presets viewport, touch,
  // user-agent, and devicePixelRatio in one line.
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // Playwright manages the dev server itself: starts `npm run dev`,
  // waits until the URL responds, runs tests, and shuts it down.
  // reuseExistingServer lets it piggyback on an already-running Vite
  // during local dev (like the one serving manual QA right now).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
