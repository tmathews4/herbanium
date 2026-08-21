// e2e/tour-contract.spec.ts — every step gets what it asked for.
//
// WHAT THIS IS FOR. A tour step declares demo state — `openControls`,
// `axisMode`, `demo` — and something several components away is supposed
// to honor it. Nothing checked that it did. The declaration and the
// behavior were connected by a prop chain four levels deep and by a
// list of step names kept in a different file, and both drifted.
//
// The bill, from one change to one default:
//
//   Six steps declared no `openControls` and silently inherited the
//   screen's default. Flipping that default folded the row under steps
//   that needed it open, and the tour went on pointing at a slider that
//   was no longer rendered.
//
//   ComposeScreen held its own list of which steps run the steep-time
//   demo. That list still named the prediction and effects steps after
//   the row started folding on them, so the tour drove a control that
//   was not on screen — the bars swung and the folded row's clock ran
//   7:47 to 3:24 with nothing visible causing it.
//
// Twelve tests failed across four files and not one of them said "a step
// didn't get its state". They said the callout moved, a slider was
// missing, a dock was 37px. The cause was one thing wearing twelve
// faces, which is what an unchecked contract does.
//
// WHY THIS ISN'T A SECOND COPY OF THE TRUTH — the thing worth not
// getting wrong. The expectations here are DERIVED from SCREEN_TOURS,
// the same data the app renders. Nothing below restates which steps open
// the row or which one demos. Add a step, change a flag, reorder them,
// and this walks whatever is there and holds the app to it. A table
// written out by hand would be one more thing to drift, which is the
// failure it is supposed to catch.
import { test, expect, type Page } from "@playwright/test";
import { SCREEN_TOURS } from "../src/data/tours";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

// Walking a whole tour and settling at every step is slow, legitimately.
test.beforeEach(() => test.slow());

const BLEND = SCREEN_TOURS.blend;

async function armBlendTour(page: Page) {
  // NOT reduced motion. The steep demo honours it, so emulating it would
  // switch off half of what this spec checks — a contract test that
  // disables the behavior under contract passes for nothing.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript((schema) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "true");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, herbanium: true, recipes: true, reflections: true, fieldnotes: true,
    }));
  }, CURRENT_SCHEMA);
  await page.goto("/?dev");
  await page.getByRole("button", { name: "Apothecary", exact: true }).click();
}

const rowState = (page: Page) =>
  page.locator('[data-tour="blend-controls"]').first().getAttribute("aria-expanded");

// The brew clock, which the row shows folded OR open. It is the honest
// readout of whether the steep time is moving, precisely because it does
// not depend on the sliders being on screen — the case that went wrong.
const clock = (page: Page) => page.locator('[data-tour="blend-controls"]').first()
  .innerText().then(t => (t.match(/\d+:\d{2}/) || ["none"])[0]);

test.describe("the blend tour gets the state each step declares", () => {
  test("every step's declared demo state is the state on screen", async ({ page }) => {
    await armBlendTour(page);
    const callout = page.getByTestId("tour-callout");
    await expect(callout, "the blend tour should start").toBeVisible({ timeout: 30_000 });

    const problems: string[] = [];

    for (let i = 0; i < BLEND.length; i++) {
      const step = BLEND[i];
      const where = `step ${i + 1}/${BLEND.length} (${step.target} — "${step.title}")`;

      // Let the step settle: the row animates open and shut.
      await page.waitForTimeout(500);

      /* THE BREW ROW.
         A step that declares `openControls` must get exactly that. A
         step that declares nothing inherits the user's own state, and
         on this walk — a fresh boot, no taps, the overlay swallowing
         them anyway — that is folded. Asserting the inherited case
         matters as much as the declared one: it is the case the six
         silent steps were in when the default moved under them. */
      const expected = step.openControls != null ? String(step.openControls) : "false";
      const actual = await rowState(page);
      if (actual !== expected) {
        problems.push(`${where}: brew row is ${actual}, step ${
          step.openControls != null
            ? `declares openControls: ${step.openControls}`
            : "declares nothing so should inherit the user's state (folded)"}`);
      }

      /* THE AXIS. Only checkable while the row is open — the pills live
         inside it — which is itself part of the contract: a step can't
         meaningfully force an axis on a folded row, and one that tried
         is the bug this spec was written after. */
      if (step.axisMode && actual === "true") {
        const pressed = await page.getByTestId(`brew-axis-${step.axisMode}`)
          .getAttribute("aria-pressed");
        if (pressed !== "true") {
          problems.push(`${where}: declares axisMode ${step.axisMode}, but that pill reads aria-pressed=${pressed}`);
        }
      }
      if (step.axisMode && actual !== "true") {
        problems.push(`${where}: declares axisMode ${step.axisMode} on a folded row — nothing to force`);
      }

      /* THE DEMO. Declared steps must visibly move the brew; undeclared
         steps must sit still. Both directions, because the fix for
         "it moves where it shouldn't" is one line away from "it never
         moves anywhere". */
      const before = await clock(page);
      await page.waitForTimeout(1200);   // ~20 ticks of the 60ms demo
      const after = await clock(page);
      const moved = before !== after;
      if (step.demo && !moved) {
        problems.push(`${where}: declares demo, but the brew sat at ${before}`);
      }
      if (!step.demo && moved) {
        problems.push(`${where}: declares no demo, but the brew ran ${before} -> ${after}`);
      }

      const next = callout.getByRole("button", { name: "Next", exact: true });
      if (await next.count()) await next.click();
    }

    expect(problems, `steps did not get the state they declared:\n  ${problems.join("\n  ")}`)
      .toEqual([]);
  });

  test("a step that forces an axis also opens the row the pills live in", async ({ page }) => {
    /* Data-only, and deliberately kept separate from the walk: this
       fails before a browser starts and without the step needing to be
       reachable. The walk proves the app honours a declaration; this
       proves the declaration is a sane thing to honor.

       THE RULE IS ABOUT `axisMode`, NOT `demo`, and that distinction is
       the correction of a wrong turn worth not repeating. The rule here
       was briefly "a step that demos must open the row", on the
       reasoning that oscillating the brew while its control is put away
       is motion with an off-screen cause. It isn't: the folded row is
       condensed, not hidden — it still reads the temperature and the
       time, and that clock ticks with the bars. Enforcing it drove the
       movement off the two steps where the strips are the LIT subject,
       leaving it only on the slider step where they change dimmed
       behind the cutout. Every test stayed green and the tour got
       worse, which is the failure mode a contract is supposed to
       prevent rather than cause.

       The pills are the real case: they are rendered INSIDE the row, so
       a step forcing an axis on a folded row is forcing nothing. */
    const offenders = BLEND
      .filter(s => s.axisMode && s.openControls !== true)
      .map(s => `${s.target} ("${s.title}") declares axisMode ${s.axisMode} without openControls: true`);
    expect(offenders,
      `the axis pills live inside the brew row — a step can't bind an axis while it's folded:\n  ${offenders.join("\n  ")}`)
      .toEqual([]);
  });

  test("the tour teaches the fold in both directions", async ({ page }) => {
    /* Also data-only. The row must be shut at some point and open at
       another, or the tour has stopped demonstrating one of them —
       which is exactly what "just make every step open it" would have
       done, quietly, while every other test went green. */
    const declared = BLEND.map(s => s.openControls).filter(v => v != null);
    expect(declared.includes(true),
      "no step opens the brew row — the sliders are never demonstrated").toBe(true);
    expect(declared.includes(false),
      "no step folds the brew row — the fold is never demonstrated").toBe(true);

    const last = [...BLEND].reverse().find(s => s.openControls != null);
    expect(last?.openControls,
      `the tour ends on ${last?.target} with the row open — it should hand the screen `
      + `back the way the user will keep it, and the closing demonstration is the last `
      + `thing it teaches`).toBe(false);
  });
});
