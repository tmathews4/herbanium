// e2e/onboarding.spec.ts — the first screen a new user ever sees.
//
// Reached by having NO profile and not passing ?dev, which is why this
// spec boots differently from every other one in the suite: the rest
// seed a populated profile precisely to skip this.
//
// The Return key is the subject. Typing your name and pressing Return is
// the obvious move, and it used to do nothing — the user had to dismiss
// the keyboard, find "next →" underneath where the keyboard had been,
// and tap it. Three actions for the one they'd already made.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Schema only. A profile is exactly what must NOT exist, and `?dev`
  // is deliberately absent — both would send us past the screen under
  // test.
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
  }, CURRENT_SCHEMA);
  await page.goto("/");
}

const nameField = (page: Page) => page.getByPlaceholder("your name");
const nextButton = (page: Page) => page.getByRole("button", { name: /next/i });

// Welcome → Name.
async function reachTheNameStep(page: Page) {
  await expect(nextButton(page), "onboarding should start on the welcome step")
    .toBeVisible({ timeout: 15_000 });
  await nextButton(page).click();
  await expect(page.getByText("What should we call you?")).toBeVisible();
}

test.describe("onboarding — the name step", () => {
  test("Return moves on, without touching the button", async ({ page }) => {
    await boot(page);
    await reachTheNameStep(page);

    await nameField(page).fill("Tom");
    await nameField(page).press("Enter");

    /* The step after the name used to be "When do you reach for tea?".
       That question is gone — nothing consumed the answer, so it cost a
       first-run screen and implied a personalisation that never
       happened. What follows the name is the mood step now. */
    await expect(page.getByText("What pulls you to a cup?"),
      "Return should advance to the next step")
      .toBeVisible();
    await expect(page.getByText("What should we call you?"),
      "and leave the name step behind").toBeHidden();
  });

  test("Return respects the same guard as the button", async ({ page }) => {
    // Next is grayed out until the name has a non-whitespace character.
    // Return goes through the identical check rather than round it —
    // the bug that would exist if Enter were wired to its own handler.
    await boot(page);
    await reachTheNameStep(page);

    await expect(nextButton(page), "an empty name shouldn't be advanceable")
      .toBeDisabled();

    await nameField(page).fill("   ");
    await nameField(page).press("Enter");
    await expect(page.getByText("What should we call you?"),
      "whitespace alone shouldn't get past the name step").toBeVisible();

    // And once it's real, the same key works.
    await nameField(page).fill("Tom");
    await expect(nextButton(page)).toBeEnabled();
    await nameField(page).press("Enter");
    await expect(page.getByText("What pulls you to a cup?")).toBeVisible();
  });

  test("the field asks the on-screen keyboard for a Next key", async ({ page }) => {
    // The half of this that a desktop browser can't show: on a phone the
    // Return key is whatever the field says it should be. Without a hint
    // it offers a newline, which a single-line input has no use for.
    await boot(page);
    await reachTheNameStep(page);
    await expect(nameField(page)).toHaveAttribute("enterKeyHint", "next");
  });
});
