// e2e/lodestone.spec.ts — the lodestone's charge fill.
//
// The stone IS the meter: it fills from the base as charge rises. The
// fill is drawn as a wash over the UNCHARGED portion, translated up as
// charge grows, so the charged part stays the true crystal. None of
// that is visible to a screenshot diff in any stable way (the crystal's
// color and pattern are computed from session data and change between
// loads), so the geometry is asserted directly.
import { test, expect, type Page } from "@playwright/test";
import { CURRENT_SCHEMA } from "../src/data/schemaVersion";

// Seed a mood profile straight into sessions. computeMoodCrystal reads
// currentMoods/targetMoods/actual off recent sessions, so a handful of
// same-mood cups is enough to pin the crystal's primary family — and
// therefore its color — deterministically.
function sessionsFor(moods: string[], count = 6) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `sess-${i}`,
    who: "you",
    blendId: "chamomile-dream",
    brewedAt: now - (i + 1) * 3600_000,
    ts: now - (i + 1) * 3600_000,
    actual: moods.join(", "),
    currentMoods: moods,
    targetMoods: moods,
    landed: {},
    extra: [],
    taste: 4,
  }));
}

async function openFieldNotes(page: Page, charge: number, moods: string[] | null = null) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(([c, schema]) => {
    localStorage.setItem("herbanium.schemaVersion", schema as string);
    localStorage.setItem("herbanium.toursEnabled", "false");
    localStorage.setItem("herbanium.toursSeen", JSON.stringify({
      home: true, blend: true, herbanium: true, recipes: true, reflections: true, fieldnotes: true,
    }));
    localStorage.setItem("herbanium.lodestoneCharge", JSON.stringify(c));
    // A plain seeded profile, NOT ?dev. The dev seed re-applies its own
    // sessions on every load, which silently overwrites the mood
    // profile these tests set — every crystal came out identical until
    // that turned up.
    localStorage.setItem("herbanium.profile", JSON.stringify({ name: "Test Brewer", onboarded: true }));
  }, [charge, CURRENT_SCHEMA] as const);
  if (moods) {
    await page.addInitScript((s) => {
      localStorage.setItem("herbanium.sessions", s as string);
    }, JSON.stringify(sessionsFor(moods)));
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.locator('[data-tour="subtabs"]')
    .getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.locator('[data-tour="fieldnotes-lodestone"]')).toBeVisible();
}

// How far the wash has been lifted off the stone, in SVG units. 0 means
// the whole crystal is washed (empty); 74 would be fully lifted.
const washLift = (page: Page) => page.evaluate(() => {
  const stone = document.querySelector('[data-tour="fieldnotes-lodestone"]')!;
  // BY NAME, not by shape. This used to take the first clipped rect in
  // the svg, which stopped meaning "the wash" once the gleam added a
  // clipped rect of its own — and the test started reporting a full
  // stone as washed.
  const rect = stone.querySelector('[data-crystal-layer="charge-wash"] rect') as SVGRectElement | null;
  if (!rect) return null;
  const m = /translateY\((-?[\d.]+)px\)/.exec(rect.style.transform || "");
  return m ? Math.abs(parseFloat(m[1])) : 0;
});

test.describe("lodestone charge fill", () => {
  test("an empty lodestone is washed over its whole height", async ({ page }) => {
    await openFieldNotes(page, 0);
    expect(await washLift(page), "nothing should be lifted at zero charge").toBe(0);
  });

  test("charge lifts the wash proportionally", async ({ page }) => {
    await openFieldNotes(page, 50);
    const lift = await washLift(page);
    expect(lift, "half charge should lift the wash about halfway").not.toBeNull();
    expect(lift!).toBeGreaterThan(30);
    expect(lift!).toBeLessThan(45);
  });

  test("a full lodestone has no wash at all — it's the true crystal", async ({ page }) => {
    await openFieldNotes(page, 100);
    // The wash element isn't rendered at full charge, rather than being
    // rendered and pushed out of view: a full stone should be exactly
    // what the crystal looks like with no charge layer involved.
    expect(await washLift(page), "no wash element should exist at full charge").toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────
   The crystal's color is computed from the user's recent moods and
   flavors — it's the visible face of the same signal that biases the
   elemental roller. Worth pinning: it's easy to break by touching the
   family maps, and nothing else in the suite would notice.

   These assert on the SVG gradient stops rather than on pixels, so
   they don't care about the pattern the crystal happens to draw
   (Threaded / Veined / Dotted all vary per profile).
   ────────────────────────────────────────────────────────────── */

// Every color the crystal's body gradient is built from.
const gradientColors = (page: Page) => page.evaluate(() => {
  const stone = document.querySelector('[data-tour="fieldnotes-lodestone"]')!;
  const stops = stone.querySelectorAll('svg defs linearGradient stop, svg defs radialGradient stop');
  return Array.from(stops)
    .map(s => (s.getAttribute("stop-color") || "").toUpperCase())
    .filter(c => c.startsWith("#"));
});

test.describe("lodestone color follows the mood profile", () => {
  // Straight from CRYSTAL_EFFECT_COLORS in data/moodCrystal.js.
  // Seeded with "calm" alone, not calm + soothing: those are separate
  // families now (see data/families.js), so the old pair was a coin
  // toss between two colors that happened to land on calm.
  const CALM = "#4DEB7E";   // neon spring-green
  const SLEEP = "#C77FFF";  // neon amethyst
  const ENERGY = "#FFC318"; // saturated amber-yellow

  // Mood words must exist in FAMILY_BY_EFFECT (components/FlavorMap) —
  // an unmapped word contributes nothing and the crystal falls back to
  // its neutral palette, which is a silently passing test waiting to
  // happen. "drowsy" and "alert" aren't in the map; "sleepy" and
  // "energy" are.
  test("a calm profile renders a calm-colored crystal", async ({ page }) => {
    await openFieldNotes(page, 0, ["calm"]);
    expect(await gradientColors(page), "calm should drive the crystal green").toContain(CALM);
  });

  test("a sleep profile renders a different color than a calm one", async ({ page }) => {
    await openFieldNotes(page, 0, ["sleepy"]);
    const colors = await gradientColors(page);
    expect(colors, "sleep should drive the crystal amethyst").toContain(SLEEP);
    expect(colors, "and must not still be reading as calm").not.toContain(CALM);
  });

  test("an energy profile is distinct again", async ({ page }) => {
    await openFieldNotes(page, 0, ["energy", "uplifting"]);
    const colors = await gradientColors(page);
    expect(colors).toContain(ENERGY);
    expect(colors).not.toContain(CALM);
  });

  test("the charge wash is a separate layer, not a tint on the palette", async ({ page }) => {
    // Checked inside ONE page load. Comparing two loads was unstable:
    // the crystal is computed from session recency, so two visits
    // produce slightly different crystals and the test was really
    // asserting determinism it never had.
    //
    // The invariant that matters is structural — the charge fill paints
    // with the card surface color in its own clipped group, and never
    // touches the body gradient. A charged stone has to stay the user's
    // own mood color, or the meter would be lying about their moods.
    await openFieldNotes(page, 50, ["calm"]);
    const layers = await page.evaluate(() => {
      const stone = document.querySelector('[data-tour="fieldnotes-lodestone"]')!;
      const wash = stone.querySelector('[data-crystal-layer="charge-wash"] rect') as SVGRectElement;
      // The crystal's OWN gradients — the body and its emit core. The
      // sweep's gradient is decoration painted in the surface color on
      // purpose, so including it would make this assert the opposite of
      // what it means.
      const stops = Array.from(
        stone.querySelectorAll("svg defs linearGradient:not([data-crystal-layer]), svg defs radialGradient:not([data-crystal-layer])"),
      ).flatMap(g => Array.from(g.querySelectorAll("stop")))
        .map(s => (s.getAttribute("stop-color") || "").toLowerCase());
      return { washFill: wash?.getAttribute("fill") || null, stops };
    });
    expect(layers.washFill, "the wash should paint with the card surface")
      .toContain("--cream");
    expect(layers.stops.some(c => c.includes("--cream")),
      "and must not appear among the crystal's own gradient stops").toBe(false);
  });

});

/* THE SUMMON ANSWERS ACROSS ITS CIRCLE, not just in the middle.

   Reported as "the clickable region to summon is much smaller than it
   used to be near the center". Measured, it was: the wrapper is 84x96
   carrying `borderRadius: 50%`, so it hit-tests as an ellipse with dead
   corners, while two box-shadow layers spread 20px+ past it and the
   aura another 22px. A shadow paints and never takes a tap, so the
   stone reads as a circle well over 120px across and answered on about
   half of it.

   ASSERTED WITH elementFromPoint rather than by clicking. A click that
   lands on the row instead of the stone still succeeds — it toggles the
   card's expand — so a click-based test passes whether or not the tap
   reached the thing it aimed at. Asking what is actually on top at a
   coordinate is the only form of this that can fail correctly. Same
   reasoning as the notice-covering-minimize bug in CLAUDE.md.

   The offsets are the ones that regressed: +-46px horizontally and 52px
   up all missed before the transparent hit layer and hit after. */
test.describe("the lodestone's summon target", () => {
  test("answers across the glow, not only at its center", async ({ page }) => {
    await openFieldNotes(page, 0);
    const stone = page.getByTestId("lodestone-summon");
    // summonReady waits out PULSE_HOLD_MS (2.2s) before the stone offers
    // itself at all — see ElementalsView. Waiting on the hook rather
    // than on a sleep so a slower machine doesn't decide the outcome.
    await expect(stone, "the stone should offer a summon on a fresh profile")
      .toBeVisible({ timeout: 30_000 });

    const reach = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="lodestone-summon"]')!;
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const at = (dx: number, dy: number) => {
        const hit = document.elementFromPoint(cx + dx, cy + dy);
        return !!hit && (hit === el || el.contains(hit));
      };
      return { center: at(0, 0), up: at(0, -52), left: at(-46, 0), right: at(46, 0) };
    });

    expect(reach.center, "the middle of the stone must take a tap").toBe(true);
    expect(reach.up, "52px above center is inside the glow and must take a tap").toBe(true);
    expect(reach.left, "46px left of center must take a tap").toBe(true);
    expect(reach.right, "46px right of center must take a tap").toBe(true);
  });
});
