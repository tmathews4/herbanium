// e2e/confirm-sheet.spec.ts — the app asks in its own voice.
//
// Four flows called `window.confirm`: deleting a journal entry,
// deleting a blend, cancelling a steep, and reloading after an import.
// That drops an OS dialog carrying the page's URL into a fully
// art-directed app — and it BLOCKS THE PAGE THREAD while open, which
// is how it was found: a timer stopped.
//
// The sheet it should have been already existed, written inline inside
// BrewCornerButton, where it asks "Brew this cup?". It is the only
// confirmation in Herbanium that looks like Herbanium. It moved out
// into components/ConfirmSheet unchanged and the four call sites were
// converted one at a time — `window.confirm` answers where it is
// called, so `if (!ok) return;` had to become `onConfirm`, which is a
// different shape at every site and not a swap.
//
// The load-bearing assertion here is the DIALOG LISTENER. A styled
// sheet appearing proves the sheet renders; it does not prove the OS
// dialog is gone, and during the conversion both could have been true
// at once. Playwright auto-dismisses dialogs when nothing is listening,
// so without this the old behavior would have passed silently.
import { test, expect, type Page } from "@playwright/test";
import { bootApp as boot } from "./helpers/brew";

test.beforeEach(() => test.slow());

/** Write one reflection so there is something to delete. */
async function writeAnEntry(page: Page, text: string) {
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Reflections", exact: true }).click();
  await page.getByTestId("write-dock-toggle").click();
  await page.locator("textarea").first().fill(text);
  await page.getByTestId("journal-save").click();
  await page.getByTestId("journal-save-commit").click();
  await expect(page.getByText(text).first(),
    "the entry should land in the timeline").toBeVisible({ timeout: 30_000 });
}

test.describe("confirming something irreversible", () => {
  test("uses the app's own sheet, and raises no OS dialog", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss(); });

    const text = "A test entry, to be removed.";
    await boot(page);
    await writeAnEntry(page, text);
    await page.getByText(text).first().click();

    const del = page.locator('[title="delete entry"]').first();
    await expect(del, "the entry page should offer a delete")
      .toBeVisible({ timeout: 30_000 });
    await del.click();

    const sheet = page.getByTestId("entry-delete-confirm");
    await expect(sheet, "the styled sheet should ask").toBeVisible({ timeout: 15_000 });
    await expect(sheet).toContainText(/remove this entry/i);

    // Cancel keeps it. Asserted before the confirm path, because a
    // sheet whose cancel deletes anyway would still pass the delete
    // assertion below.
    await page.getByTestId("entry-delete-confirm-cancel").click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(text).first(),
      "declining should leave the entry alone").toBeVisible();

    await del.click();
    await page.getByTestId("entry-delete-confirm-go").click();
    await expect(page.getByText(text),
      "confirming should remove it").toHaveCount(0, { timeout: 15_000 });

    expect(dialogs, `an OS dialog was raised: ${dialogs.join(" | ")}`).toEqual([]);
  });

  test("no source file calls window.confirm any more", async () => {
    /* The other three sites are reachable only through states this spec
       cannot cheaply build — a steep in progress being swapped, a blend
       the seed does not mark deletable, an import file. A grep is a
       weaker check than driving them, and it is the one that would
       actually catch the regression: somebody adding a fifth
       `window.confirm` rather than one of these four coming back. */
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.(jsx?|tsx?)$/.test(name)) continue;
        /* BLOCK COMMENTS ARE TRACKED, not pattern-matched. The first
           cut skipped lines starting with // or * and reported three
           false hits — this repo's block comments run to continuation
           lines that start with ordinary prose, and every one of those
           three was a comment EXPLAINING the removal. A check that
           cries wolf on its own documentation gets deleted. */
        let inBlock = false;
        readFileSync(p, "utf8").split("\n").forEach((line, i) => {
          const code = (() => {
            let out = "", rest = line;
            while (rest.length) {
              if (inBlock) {
                const end = rest.indexOf("*/");
                if (end === -1) return out;
                inBlock = false; rest = rest.slice(end + 2); continue;
              }
              const line2 = rest.indexOf("//");
              const block = rest.indexOf("/*");
              if (block !== -1 && (line2 === -1 || block < line2)) {
                out += rest.slice(0, block); inBlock = true; rest = rest.slice(block + 2); continue;
              }
              if (line2 !== -1) return out + rest.slice(0, line2);
              return out + rest;
            }
            return out;
          })();
          if (code.includes("window.confirm")) hits.push(`${p}:${i + 1}`);
        });
      }
    };
    walk("src");
    expect(hits, `these still raise an OS dialog: ${hits.join(", ")}`).toEqual([]);
  });
});
