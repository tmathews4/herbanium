/* tests/tour-blend.test.mjs — the pot the Blend tour teaches with.
 *
 * The tour seeds an example blend into an empty composer and then walks
 * the user round it for thirteen steps. That makes the blend a piece of
 * TEACHING MATERIAL, not a default, and it can fail at that job while
 * being a perfectly good cup — which is exactly what happened. It seeded
 * chamomile 2 : peppermint 1, which resolves to `sleepy` 5 and trips the
 * sedative ceiling, so the tutorial's first screen carried "this stack of
 * sedatives is at the ceiling — don't drive after". Nothing was broken.
 * The blend simply taught the app's caution before it had taught the app.
 *
 * None of that is visible from the seed line, which is why these are
 * properties rather than an assertion that the ids equal some pair: the
 * blend should be re-pickable whenever there's a better one, and what
 * has to survive the re-pick is what makes it teach.
 */
import { TOUR_BLEND } from "../src/data/tourBlend.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { EXTRACTION_PROFILES } from "../src/data/extractionProfiles.js";
import { resolveBlendAtBrew, computeBrewProfile } from "../src/algo/compose.js";
import { CATEGORY_OF_EFFECT } from "../src/data/families.js";

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; process.stdout.write("."); }
  catch (e) { fail++; failures.push(`${name}: ${e.message}`); process.stdout.write("x"); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const ings = TOUR_BLEND.ids.map(id => ({
  id,
  g: TOUR_BLEND.parts[id],
  role: id === TOUR_BLEND.ids[0] ? "lead" : "accent",
}));
const profile = computeBrewProfile(ings);
const at = t => resolveBlendAtBrew(ings, profile.tempC, t);
const effectsOf = s => s.perceivedEffects || s.effects || {};
const flavorsOf = s => s.perceivedFlavors || s.flavors || {};
const cup = at(profile.timeS);

test("every seeded ingredient exists and carries its parts", () => {
  assert(TOUR_BLEND.ids.length === 2,
    `the callout has to share the screen with the bars and the sliders — `
    + `two ingredients, got ${TOUR_BLEND.ids.length}`);
  for (const id of TOUR_BLEND.ids) {
    assert(INGREDIENTS[id], `seeded ingredient "${id}" is not in the catalog`);
    assert(TOUR_BLEND.parts[id] > 0, `seeded ingredient "${id}" has no parts`);
  }
  // The pair the seed names and the pair the parts name must be the same
  // pair. This is the drift the single constant exists to prevent.
  const partIds = Object.keys(TOUR_BLEND.parts).sort();
  assert(JSON.stringify(partIds) === JSON.stringify([...TOUR_BLEND.ids].sort()),
    `ids ${TOUR_BLEND.ids} and parts ${partIds} describe different blends`);
});

test("the parts are uneven, so it reads as blending and not mixing", () => {
  const vals = TOUR_BLEND.ids.map(id => TOUR_BLEND.parts[id]);
  assert(new Set(vals).size > 1,
    `equal parts (${vals.join(":")}) teach mixing — the lesson is balance`);
});

test("both ingredients have an extraction profile to draw", () => {
  for (const id of TOUR_BLEND.ids) {
    assert((EXTRACTION_PROFILES[id] || []).length > 0,
      `"${id}" has no extraction profile — the graph would have nothing to plot`);
  }
});

test("the tutorial does not open on a warning", () => {
  // The reason this file exists. A first cup is the wrong place to meet
  // a safety notice, and the ceiling warning is the one the old blend
  // tripped.
  const kinds = (cup.warnings || []).map(w => w.kind);
  assert(kinds.length === 0,
    `the seeded blend arrives carrying ${kinds.join(", ")} — `
    + `the tutorial would teach the app's caution before the app`);
});

test("the tutorial cup is not a sedative one", () => {
  const sleepy = effectsOf(cup).sleepy || 0;
  assert(sleepy < 1,
    `seeded blend reads sleepy ${sleepy.toFixed(1)} — a walkthrough shouldn't `
    + `be demonstrated on a cup that puts the reader to sleep`);
});

test("Mind and Body both have something to say", () => {
  // One step introduces each strip by name. An empty one makes that step
  // describe a blank.
  const e = effectsOf(cup);
  const named = cat => Object.entries(e)
    .filter(([k, v]) => CATEGORY_OF_EFFECT?.[k] === cat && v >= 1).length;
  assert(named("mind") >= 1, `nothing on the Mind strip: ${JSON.stringify(e)}`);
  assert(named("body") >= 1, `nothing on the Body strip: ${JSON.stringify(e)}`);
});

test("the bars actually move across the steep window", () => {
  /* THE LESSON, and the one property that can't be eyeballed from the
     ingredient list. The tour oscillates steep time across three steps
     so the user sees the sliders drive the graph; a pair whose curves
     are flat over the window demonstrates the opposite of what the copy
     is saying, silently and while looking fine.

     Measured as total swing summed over every bar, flavor and effect,
     which is what the eye actually reads. The threshold is a floor on
     "visibly moves", not a target. */
  const range = profile.timeSRange || profile.timeRange || [profile.timeS, profile.timeS];
  const [lo, hi] = range;
  assert(hi - lo >= 60,
    `the steep window is ${hi - lo}s wide — the slider has nowhere to travel`);

  const samples = [0, 0.25, 0.5, 0.75, 1].map(f => at(Math.round(lo + (hi - lo) * f)));
  const swing = (pick) => {
    const keys = new Set();
    samples.forEach(s => Object.keys(pick(s)).forEach(k => keys.add(k)));
    let total = 0;
    for (const k of keys) {
      const vals = samples.map(s => pick(s)[k] || 0);
      total += Math.max(...vals) - Math.min(...vals);
    }
    return total;
  };
  const flavor = swing(flavorsOf);
  const effect = swing(effectsOf);
  assert(flavor >= 5,
    `flavor bars barely move across the window (${flavor.toFixed(1)}) — `
    + `the slider steps would be teaching a graph that sits still`);
  assert(effect >= 5,
    `effect bars barely move across the window (${effect.toFixed(1)})`);
});

test("no bar sits pinned at the ceiling through the tour", () => {
  /* THE HOLE IN THE TEST ABOVE, and the reason this one exists
     separately rather than as a tighter threshold on it.

     A summed swing cannot see saturation. A bar stuck at 5.0 across the
     whole window contributes ZERO to the total, so a blend with a frozen
     headline bar scores exactly like a blend that simply lacks that
     flavor — and the sum stays healthy on the strength of the small
     bars moving underneath. The first tutorial blend went in that way:
     tulsi 2 : peppermint 1, with `minty` at 5.0 from 240s of a 180-420s
     window and `spiced` joining it at 300s. Both headline bars were
     frozen for most of the tour while the metric read fine. It was
     caught by someone watching the tutorial: "peppermint is marking
     menthol max the entire tutorial".

     So this asks the question the eye asks — is the BIGGEST thing on
     the strip moving? — rather than the question a sum answers. */
  const range = profile.timeSRange || profile.timeRange || [profile.timeS, profile.timeS];
  const [lo, hi] = range;
  const fracs = [0, 0.25, 0.5, 0.75, 1];
  const samples = fracs.map(f => at(Math.round(lo + (hi - lo) * f)));

  const pinned = (pick, what) => {
    const keys = new Set();
    samples.forEach(s => Object.keys(pick(s)).forEach(k => keys.add(k)));
    const stuck = [...keys].filter(k => {
      const vals = samples.map(s => pick(s)[k] || 0);
      // Allowed to touch the ceiling; not allowed to live there. More
      // than two of five samples maxed and the bar has stopped being a
      // reading of the cup and become a wall.
      return vals.filter(v => v >= 4.95).length > 2;
    });
    assert(stuck.length === 0,
      `${what} pinned at the ceiling for most of the steep window: ${stuck.join(", ")} — `
      + `the largest bars on the strip would sit still while the tour says "watch them move"`);
  };
  pinned(flavorsOf, "flavors");
  pinned(effectsOf, "effects");
});

test("the prominent bars are the ones that move", () => {
  // The other half of the same idea. A blend can dodge saturation and
  // still be dull if only the small bars wobble, because the reader is
  // watching the big ones. Scored on the top four of each strip.
  const range = profile.timeSRange || profile.timeRange || [profile.timeS, profile.timeS];
  const [lo, hi] = range;
  const samples = [0, 0.25, 0.5, 0.75, 1].map(f => at(Math.round(lo + (hi - lo) * f)));
  const mid = samples[2];

  const topSwing = (pick) => {
    const top = Object.entries(pick(mid)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    return top.reduce((sum, k) => {
      const vals = samples.map(s => pick(s)[k] || 0);
      return sum + (Math.max(...vals) - Math.min(...vals));
    }, 0);
  };
  const f = topSwing(flavorsOf);
  const e = topSwing(effectsOf);
  assert(f >= 4, `the four biggest flavor bars barely move (${f.toFixed(1)})`);
  assert(e >= 4, `the four biggest effect bars barely move (${e.toFixed(1)})`);
});

console.log(`\n\n  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
