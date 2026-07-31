// e2e/smoke.spec.js — boot-level sanity checks.
//
// A "smoke test" answers one question: does the app even start?
// It runs in a real browser against the real Vite build, so it
// catches whole classes of failure the node data tests can't —
// broken imports, a render crash, a blank white screen.
import { test, expect } from "@playwright/test";

test.describe("app boot", () => {
  test("fresh visitor lands on onboarding", async ({ page }) => {
    // baseURL comes from playwright.config.js, so "/" is enough.
    await page.goto("/");

    // getByText auto-waits: it polls until the element appears or the
    // expect timeout elapses. No manual sleeps, ever.
    await expect(page.getByText("Welcome to Herbanium.")).toBeVisible();

    // The primary CTA to advance onboarding. getByRole is the
    // preferred locator — it reads the accessibility tree, so the
    // test survives styling/markup churn as long as a button with
    // this name exists.
    await expect(page.getByRole("button", { name: /next/ })).toBeVisible();
  });

  test("onboarding advances to the name step", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /next/ }).click();

    // Step 1 asks for a name — proves state updates + re-render work,
    // i.e. React itself is alive, not just the initial paint.
    await expect(page.getByText("What should we call you?")).toBeVisible();
  });

  test("no console errors on boot", async ({ page }) => {
    // Collect page console errors during load. A page can look fine
    // while logging red — this catches the "works but bleeding" state.
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByText("Welcome to Herbanium.")).toBeVisible();

    expect(errors).toEqual([]);
  });
});
