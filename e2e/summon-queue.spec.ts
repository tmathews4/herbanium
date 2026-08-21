// e2e/summon-queue.spec.ts — the lodestone has ONE queue, and the
// creation elemental is in it.
//
// It used to reach the user through a parallel flow: its own kind of
// summon target, its own dismissal, its own count. Nothing kept the two
// paths in step and they drifted in the half nobody was looking at —
// the creation elemental never entered the seen set, so the arrivals
// log read one higher than Profile's count, always.
//
// These walk the queue rather than restating it. Nothing here names
// which elemental comes first or how the count is computed; it asks the
// app what is waiting, takes the head, and checks the number went down
// by one — so reordering the queue or adding a source doesn't need an
// edit here.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

/* Seed straight into storage. No ?dev — the dev seed re-applies its own
   elemental state on every load and would overwrite this.

   `lastElementalRollAt` is set an hour into the future deliberately:
   every action site rolls Math.random for a chance arrival, and a stray
   roll landing mid-test is the documented cause of this file's
   neighbours flaking. Holding the cooldown shut keeps the queue equal
   to what was seeded. Not `animisBanished`, which would switch off the
   subject. */
async function boot(page: Page, opts: {
  title?: string | null;
  rolled?: string[];
  seen?: string[];
  omenShown?: boolean;
} = {}) {
  const { title = null, rolled = [], seen = [], omenShown = false } = opts;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(([schema, t, r, s, omen]) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true,
      recipes: true, reflections: true, fieldnotes: true,
    }));
    localStorage.setItem("herbanium.profile", JSON.stringify({
      name: "Test Brewer", onboarded: true,
      ...(t ? { title: t } : {}),
    }));
    localStorage.setItem("herbanium.omenShown", JSON.stringify(omen));
    localStorage.setItem("herbanium.rolledElementalIds",
      JSON.stringify({ __type: "Set", items: r }));
    localStorage.setItem("herbanium.seenAnimiIds",
      JSON.stringify({ __type: "Set", items: s }));
    localStorage.setItem("herbanium.lastElementalRollAt",
      JSON.stringify(Date.now() + 3600_000));
  }, [CURRENT_SCHEMA, title, rolled, seen, omenShown] as const);
  await page.goto("/");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.locator('[data-tour="fieldnotes-lodestone"]')).toBeVisible();
}

const stone = (page: Page) => page.getByTestId("lodestone-summon");
const badge = (page: Page) => page.getByTestId("lodestone-pending-badge");
// The badge is absent at zero rather than showing "0".
const waiting = async (page: Page) =>
  (await badge(page).count()) === 0 ? 0 : Number((await badge(page).innerText()).trim());

// Whatever card is up, dismissed the way the user dismisses it.
const openCard = (page: Page) =>
  page.getByTestId("omen-dismiss").or(page.getByTestId("arrival-dismiss"));

test.describe("the lodestone's summon queue", () => {
  test("every waiting elemental comes through the same tap and the same count", async ({ page }) => {
    // Two waiting: the creation elemental, and one earned arrival.
    await boot(page, { title: "The Twilight Pearl Hare", rolled: ["first-brew"] });

    let left = await waiting(page);
    expect(left, "two should be waiting before anything is tapped").toBe(2);

    // Walk the whole queue down. Each pass: tap the stone, meet
    // whatever it hands over, dismiss it, and expect one fewer waiting.
    while (left > 0) {
      await expect(stone(page), `the stone should still offer a summon at ${left}`)
        .toBeVisible({ timeout: 15_000 });
      await stone(page).click({ force: true });

      await expect(openCard(page), `a card should arrive at ${left}`)
        .toBeVisible({ timeout: 15_000 });
      // The count reads the REST of the queue while a card is up. It
      // used to be hardcoded to zero on the creation path, because the
      // creation elemental wasn't a queue entry to subtract.
      expect(await waiting(page), `the open card shouldn't be counted at ${left}`)
        .toBe(left - 1);

      await openCard(page).click();
      await expect(openCard(page)).toHaveCount(0, { timeout: 15_000 });
      left -= 1;
      expect(await waiting(page), "dismissing should retire exactly one").toBe(left);
    }

    await expect(stone(page), "an empty queue offers no summon").toHaveCount(0);
    await expect(page.getByText(/no specimen waiting/i)).toBeVisible();
  });

  test("a profile with no stored title still gets its own card", async ({ page }) => {
    /* The creation elemental's name is generated when none was
       persisted, and the grid tile has always shown the generated one.
       The omen card read `profile.title` instead, so on such a profile
       the stone offered a summon, took the tap, and rendered nothing —
       a dead control that looked live. */
    await boot(page, { title: null });

    await expect(stone(page)).toBeVisible({ timeout: 15_000 });
    await stone(page).click({ force: true });
    await expect(page.getByTestId("omen-dismiss"), "the tap must open a card")
      .toBeVisible({ timeout: 15_000 });
  });
});
