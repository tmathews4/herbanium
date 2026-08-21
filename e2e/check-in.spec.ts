// e2e/check-in.spec.ts — what happens after a brew, and the deferral.
//
// There used to be a post-brew notice here, and this file used to be
// mostly about it. It closed a real gap — nothing told the user a
// check-in was coming, so the card thirty minutes later arrived
// unannounced — and it was carefully NOT the review itself, because at
// brew time the tea is ready but not drunk and the only honest answer
// to "how did it land?" is "later".
//
// It has been removed in stages, each one for a reason worth keeping:
// its timing chips went because somebody who has just finished brewing
// is the last person who wants to schedule a nudge, and then the notice
// itself went because the reminder had become visible without it. An
// unreviewed cup now reads "pending review" on its Home row and carries
// a "review →" cue where its rating would go — so the notice was
// announcing something already on the screen behind it.
//
// What is left is the pair worth holding: finishing a brew is silent
// and still logs the cup, and closing the review defers it without
// dropping the cup.
import { test, expect, type Page } from "@playwright/test";
import { brewFromDetail } from "./helpers/brew";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";
import { MAX_SNOOZES } from "../src/data/followUp";


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

test.describe("finishing a brew", () => {
  /* THIS BLOCK USED TO HOLD THE POST-BREW NOTICE, and it is worth
     recording what it went through rather than just deleting it.

     It began as a QUESTION and was made a notice, because at brew time
     the tea is ready but not drunk — "how did it land?" has no answer
     yet, and a prompt whose only honest response is "later" teaches
     people to dismiss it, including later when it matters. Then its
     timing chips went, because somebody who has just finished brewing
     is the last person who wants to schedule a nudge. What was left
     announced a reminder.

     By then the reminder was already visible without it: an unreviewed
     cup reads "pending review" on its Home row and carries a "review →"
     cue where its rating would go. The notice was telling you about
     something on the screen behind it.

     The scheduled notification still runs on its default half hour, so
     what remains asserted here is that finishing a brew is SILENT on
     screen and still logs the cup. */
  async function brewACup(page: Page) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((schema) => {
      localStorage.setItem("herbanium.schemaVersion", schema as string);
      localStorage.setItem("herbanium.toursEnabled", "false");
    }, CURRENT_SCHEMA);
    await page.goto("/?dev");
    await page.getByRole("button", { name: "Journal", exact: true }).click();
    await page.locator('[data-tour="recipes-row"]').first().click();
    await brewFromDetail(page);
    await page.getByRole("button", { name: /done early|log this cup/i }).first().click();
  }

  test("says nothing, and logs the cup anyway", async ({ page }) => {
    await brewACup(page);

    for (const gone of [/landed in a little while/i, /we'll ask/i, /ask me/i]) {
      await expect(page.getByText(gone),
        `finishing a brew should raise nothing on screen, found ${gone}`)
        .toHaveCount(0);
    }

    /* The half that matters more: silence must not mean the brew was
       dropped. A notice removal that also lost the cup would pass every
       assertion above. */
    const logged = await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem("herbanium.sessions") || "[]");
      return all.filter((s: any) => s.who === "you" && s.moodsPending).length;
    });
    expect(logged, "the finished cup should be logged and pending review")
      .toBeGreaterThan(0);
  });
});

test.describe("follow-up snooze", () => {
  /* THE CARD MOVED, SO THESE FOLLOW IT. Both of these used to seed a
     due cup and find the follow-up card on Home. That card is gone from
     Home — it was a second copy of a form the cup already owns, shown
     to somebody who had opened the app to do something else. The snooze
     it carried is not gone: it rides the cup's own panel now.

     Which changed what deferring has to do. On Home the card vanished
     because that surface only showed a cup while it was DUE. The cup's
     panel is gated on whether a score exists — you are there because
     you opened it — so deferring without folding the form would leave
     the user looking at the thing they just deferred.

     AND THE CONTROL ITSELF CHANGED. There were two, a "not yet" pill
     and an ×, and the × was broken: it cleared moodsPending, which
     this panel does not read, so the form stayed on screen and the
     tap looked like nothing. One × now, and it does what the pill
     did. */
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
        targetMoods: ["calm"], currentMoods: [], landed: {}, extra: [],
      }]));
    }, [CURRENT_SCHEMA, snoozes] as const);
    await page.goto("/");
  }

  /** Home lists the cup; the review lives one tap in. */
  async function openTheCup(page: Page) {
    await page.waitForTimeout(5200);            // the greeting choreography
    await page.locator('[data-testid="recent-brew-row"]').first().click();
    const panel = page.getByTestId("cup-review-panel");
    await expect(panel, "an unreviewed cup opens with its review showing")
      .toBeVisible({ timeout: 30_000 });
    return panel;
  }

  /** Read the seeded cup back out of storage. */
  async function storedCup(page: Page) {
    return page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("herbanium.sessions") || "[]");
      return {
        moodsPending: raw[0]?.moodsPending,
        snoozes: raw[0]?.followUpSnoozes,
      };
    });
  }

  test("closing the review defers the ask instead of dropping the cup", async ({ page }) => {
    await cupDueNow(page);
    const panel = await openTheCup(page);

    /* ONE WAY OUT, not two. The pill is gone, so a second control
       coming back — or the × being restored alongside it — fails
       here rather than in whichever of the two happens to be wired
       wrong that day. */
    await expect(panel.getByRole("button", { name: /not yet/i }),
      "the × is the only way to put the form away").toHaveCount(0);

    await panel.getByTestId("review-close").click();
    await expect(panel, "closing should fold the form away").toBeHidden();

    // Crucially the cup is still pending, not dismissed — it comes back.
    const pending = await storedCup(page);
    expect(pending.moodsPending, "the cup must stay pending after a snooze").toBe(true);
    expect(pending.snoozes, "the snooze should be counted").toBe(1);
  });

  test("past the snooze ceiling, closing drops the ask instead of deferring", async ({ page }) => {
    /* The ceiling exists so nobody can push the ask past the window the
       card stays askable in — snooze forever and the cup would age out
       mid-conversation rather than being answered or dismissed.

       This used to assert that the control DISAPPEARED once the
       allowance was spent, which was right while the × sat beside it.
       With one control it would leave the panel with no way out, so a
       spent allowance falls through to dismissing instead: nothing
       left to defer, so closing means the cup goes unanswered and its
       check-in is cancelled. The cup can still be answered — the
       submit button is untouched by any of this. */
    await cupDueNow(page, MAX_SNOOZES);
    const panel = await openTheCup(page);

    await expect(panel.getByTestId("review-close"),
      "the way out must survive a spent allowance").toBeVisible();
    await panel.getByTestId("review-close").click();
    await expect(panel, "closing should still fold the form away").toBeHidden();

    const closed = await storedCup(page);
    expect(closed.moodsPending, "with no snooze left, closing drops the ask").toBe(false);
    expect(closed.snoozes, "and it must not push past the ceiling").toBe(MAX_SNOOZES);
  });
});
