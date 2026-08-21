// e2e/check-in.spec.ts — the post-brew notice and the follow-up snooze.
//
// The notice exists to close a discoverability gap: nothing used to
// tell the user a check-in was coming, so the card 30 minutes later
// arrived unannounced. It is deliberately NOT the review itself — at
// brew time the tea is ready but not drunk, so the only honest answer
// to "how did it land?" would be "later", and a prompt whose right
// answer is fixed teaches people to dismiss it.
import { test, expect, type Page } from "@playwright/test";
import { brewFromDetail } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

const notice = (page: Page) => page.getByTestId("check-in-notice");

async function brewACup(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="recipes-row"]').first().click();
  await brewFromDetail(page);
  // "done early" finishes the steep without waiting out a real timer.
  await page.getByRole("button", { name: /done early|log this cup/i }).first().click();
}

test.describe("post-brew check-in notice", () => {
  test("finishing a brew says the ask is coming, without asking", async ({ page }) => {
    await brewACup(page);
    await expect(notice(page), "a notice should appear after brewing").toBeVisible();
    await expect(notice(page)).toContainText(/landed in a little while/i);

    // The distinction that matters: the notice must NOT be the review.
    // If it ever starts asking, the "remind me later" trap is back —
    // a prompt whose only honest answer is "later".
    //
    // Scoped to the notice, not the page: an older cup can legitimately
    // be due for its own review at the same moment, and that card is a
    // different thing about a different cup.
    await expect(notice(page)).not.toContainText(/how did it land/i);
    await expect(notice(page).getByRole("button", { name: /^[1-5]$/ }),
      "no rating controls belong in a notice").toHaveCount(0);
  });

  test("offers no scheduling decision, only the acknowledgement", async ({ page }) => {
    /* This used to assert the opposite: three timing chips ("in half an
       hour", "in an hour", "tonight"), that tapping one reflected the
       selection back, and that the notice then dismissed itself.

       The chips are gone. They asked a person to schedule a nudge about
       a cup of tea at the one moment they had just finished brewing and
       cared least — and followUp.js had already argued the case in its
       own header, "Defaults beat choices for something this small",
       while the notice asked anyway.

       What made it safe to remove is that the reminder stopped
       depending on the ask: an unreviewed cup reads "pending review" on
       its Home row and opens with its review panel showing, so the
       in-app path is visible whether or not a timer fires. The
       scheduled notification still runs, on the default half hour.

       So the claim now is that the notice TELLS and does not ASK. The ×
       is the only control it carries. */
    await brewACup(page);
    await expect(notice(page)).toBeVisible();

    for (const label of [/in an hour/i, /half an hour/i, /tonight/i, /ask me/i]) {
      await expect(notice(page).getByText(label),
        `the notice should offer no timing choice, found ${label}`).toHaveCount(0);
    }
    const buttons = notice(page).getByRole("button");
    await expect(buttons, "dismiss is the only control a notice needs")
      .toHaveCount(1);
    await expect(buttons.first()).toHaveAttribute("aria-label", "dismiss");
  });

  test("the notice can be dismissed and stays gone", async ({ page }) => {
    await brewACup(page);
    await notice(page).getByRole("button", { name: "dismiss" }).click();
    await expect(notice(page)).toBeHidden();
    await page.getByRole("button", { name: "Apothecary", exact: true }).click();
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await expect(notice(page), "a dismissed notice should not come back").toBeHidden();
  });
});

test.describe("follow-up snooze", () => {
  // Seed a cup that's already due so the card is up without waiting.
  async function cupDueNow(page: Page, snoozes = 0) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(([schema, used]) => {
      localStorage.setItem("herbanium.schemaVersion", schema as string);
      localStorage.setItem("herbanium.toursEnabled", "false");
      localStorage.setItem("herbanium.profile", JSON.stringify({ name: "Test Brewer", onboarded: true }));
      const brewedAt = Date.now() - 45 * 60 * 1000;
      localStorage.setItem("herbanium.sessions", JSON.stringify([{
        id: "sess-due", who: "you", blendId: "chai",
        brewedAt, ts: brewedAt,
        followUpAt: brewedAt + 30 * 60 * 1000,
        followUpSnoozes: used,
        moodsPending: true, actual: "brewed",
        targetMoods: ["calm"], currentMoods: [], landed: {}, extra: [], taste: 4,
      }]));
    }, [CURRENT_SCHEMA, snoozes] as const);
    await page.goto("/");
  }

  test('"not yet" defers the ask instead of dropping the cup', async ({ page }) => {
    await cupDueNow(page);
    const card = page.getByText("How did it land?", { exact: false }).first();
    await expect(card, "a due cup should be asked about").toBeVisible();

    await page.getByRole("button", { name: /not yet/i }).click();
    await expect(card, "snoozing should put the card away for now").toBeHidden();

    // Crucially the cup is still pending, not dismissed — it comes back.
    const pending = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("herbanium.sessions") || "[]");
      return { moodsPending: raw[0]?.moodsPending, snoozes: raw[0]?.followUpSnoozes };
    });
    expect(pending.moodsPending, "the cup must stay pending after a snooze").toBe(true);
    expect(pending.snoozes, "the snooze should be counted").toBe(1);
  });

  test("the snooze control disappears once the allowance is spent", async ({ page }) => {
    await cupDueNow(page, 3);
    await expect(page.getByText("How did it land?", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /not yet/i }),
      "a spent allowance should hide the control, not offer a dead button").toHaveCount(0);
  });
});
