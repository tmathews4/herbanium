/* The example pot the Blend tour drops into an empty composer.
 *
 * ONE PLACE, because it is one decision made of two literals. The ids
 * and the parts used to sit as separate object literals inside the
 * effect that seeds them; nothing held them together, so adding an
 * ingredient to one and forgetting the other would have seeded a pot
 * with a part-less leaf. Same shape as every other cluster CLAUDE.md
 * names — every copy correct, nothing keeping them so.
 *
 * WHY THIS BLEND, and it is not arbitrary. The tour teaches with it, so
 * the constraints come from the teaching:
 *
 *   TWO ingredients, at 2:1. The prediction bars and the brew sliders
 *   both have to fit on a phone screen beside the tour callout, and the
 *   uneven parts are what make it read as blending rather than mixing.
 *
 *   THE BARS HAVE TO MOVE — AND THE BIG ONES ESPECIALLY. The tour
 *   oscillates the steep time (see `demo` in tours.js) and the whole
 *   lesson is that the brew drives the graph. A pair whose curves are
 *   flat teaches the opposite of what the step is saying.
 *
 *   A BAR PINNED AT MAX IS A FLAT BAR, and this is the one that got
 *   missed. The first pick was tulsi 2 : peppermint 1, chosen with a
 *   metric that summed swing across every flavour — so `minty`, sitting
 *   at 5.0 from 240s of a 180-420s window, contributed zero and the
 *   total still read as healthy. On screen it was the largest thing in
 *   the strip and it never moved for four fifths of the tour. Reported
 *   as "peppermint is marking menthol max the entire tutorial".
 *   `spiced` did the same by 300s, so both headline bars were frozen.
 *   Score the PROMINENT bars, not the sum.
 *
 *   MIND AND BODY BOTH SAY SOMETHING. A step introduces each strip by
 *   name; one of them empty makes that step describe a blank.
 *
 *   NO WARNING ON ARRIVAL. This one is why the blend changed. The tour
 *   seeded chamomile 2 : peppermint 1, which resolves to `sleepy` 5 and
 *   trips the sedative ceiling — so the tutorial opened on "this stack
 *   of sedatives is at the ceiling, don't drive after". A first cup is
 *   the wrong place to meet a safety warning, and it was teaching the
 *   app's caution before it had taught the app.
 *
 * Elderflower and tulsi clear all five. No `sleepy`, no warnings, four
 * effects on each strip, 360s of slider travel — double the nearest
 * rival — and NOTHING REACHES 5.0 AT ALL, so every bar has somewhere to
 * go in both directions. `floral` rises 2.8 to 3.4 and falls back to
 * 2.6, which is a curve rather than a ramp, and `muscatel`, `peppery`
 * and `clove` arrive from 420s: bars that DROP IN as the steep runs
 * long, which is the lesson happening in front of the reader rather
 * than being described to them.
 *
 * `tests/tour-blend.test.mjs` holds every one of those properties —
 * including the saturation check the first pick slipped past — so this
 * can be re-picked freely and the guard says whether the new choice
 * still teaches.
 *
 * SEPARATE, AND NOT FIXED HERE: peppermint's own numbers are worth a
 * look. Its profile declares `minty` 3 at 90C and 4 at 98C, and a cup
 * brewed at 95C reads 5.0 — the perception layer, not the research,
 * is what puts it at the ceiling. That may be right (peppermint really
 * does dominate a pot) or it may be the model shouting. It affects
 * every blend containing mint, so it is a data question with its own
 * evidence, not something to settle by changing the tutorial.
 */
export const TOUR_BLEND = {
  ids: ["elderflower", "tulsi"],
  parts: { elderflower: 2, tulsi: 1 },
};
