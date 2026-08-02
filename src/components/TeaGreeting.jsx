/* ──────────────────────────────────────────────────────────────
   components/TeaGreeting.jsx — the "What's the tea, ___?" masthead.

   The app's one slogan, so it gets set like a masthead rather than
   printed like a greeting. Three things carry that:

   1. Framing above and below — a letterspaced small-caps kicker for
      the time of day, and the poem card's own ornament flourish
      underneath. The card opens with that flourish and the greeting
      closes with it, so the pair brackets the top of the screen.
   2. No self-shrinking. The old line used FitText to squeeze long
      names into one line, and a headline that resizes per user reads
      as unfinished. This one wraps if it must.
   3. Italic on the NAME, not on the frame. Italic across a whole
      phrase stops being emphasis; moving it onto the name lets the
      slogan hold still while the personal part leans.

   Deliberately smaller than the line it replaces (28px → 24px): the
   kicker and rule do the work the size was doing, and restraint is
   most of what separates a wordmark from a salutation.

   One component, both call sites (empty state + returning user), so
   the app's slogan can't drift into two slightly different versions.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { OrnamentRule } from "./OrnamentRule";
import { ff, theme } from "../theme";

/* `arriving` comes from HomeScreen, which decides once per app session
   whether this is a first view — so the greeting and the poem card's
   flourish above it agree, and both animate or neither does. */
// How long Home's opening sequence runs, end to end: the slogan starts
// at SLOGAN_AT and takes 1.6s. Exported so anything that needs to wait
// for the arrival — the guided tour, notably — waits on one number
// rather than a duplicated guess that drifts when the timings move.
export const GREETING_ARRIVAL_MS = 4400;

export const TeaGreeting = ({ name, kicker = null, arriving = false }) => {
  // The slogan is the finale, so it goes LAST — after the poem has
  // finished arriving and both flourishes have drawn. Its kicker leads
  // it in by a beat; everything else on Home is already settled by
  // then, which is what lets a single sliding line carry the ending.
  // Timings sit well above the textbook numbers, on purpose. NN/g puts
  // the useful range at 200–500ms and calls 1s the limit of a user's
  // flow of thought; Material's longest duration token is 1000ms. This
  // sequence runs ~4.3s end to end. The justification is narrow but
  // real: it fires once per session, on a leisure app, over content
  // nobody is trying to get past — none of which would excuse these
  // numbers on an interaction the user repeats.
  //
  // The hard ceiling is WCAG 2.2.2: moving content that runs past five
  // seconds needs a pause control. An earlier cut of this ran 4.7s.
  // Nothing here should grow without checking that number again.
  //
  // The kicker and the slogan are one unit — an eyebrow and its line —
  // so they arrive 0.2s apart rather than as two separate events, and
  // both flourishes start drawing on the kicker's beat (see
  // ORN_DRAW_DELAY in OrnamentRule, which must match KICKER_AT). The
  // poem has already settled by then; the masthead assembles as one.
  const KICKER_AT = 2.5;
  const SLOGAN_AT = 2.7;   // KICKER_AT + 0.2
  const fadeIn = (delay) => (arriving
    ? { animation: `greetIn 1.1s cubic-bezier(0.33, 0, 0.2, 1) ${delay}s both` }
    : undefined);
  // The slogan is the one element allowed past the usual ceiling: it's
  // the finale, it's a single line, and nothing waits behind it. A
  // sideways slide was tried here and cut — it was the loudest thing
  // in a block that only needed to settle.
  const slowFade = (delay) => (arriving
    ? { animation: `greetIn 1.6s cubic-bezier(0.33, 0, 0.2, 1) ${delay}s both` }
    : undefined);

  return (
  <div
    data-arriving={arriving ? "1" : "0"}
    style={{ textAlign: "center", marginBottom: 18, marginTop: 8 }}
  >
    <style>{`
      /* Opacity only — no travel on any axis. The block had three
         motion vocabularies at once (text rising, a line sliding
         sideways, a stroke drawing) and reading three at once is what
         made it feel busy. Now there's one gesture in the whole
         sequence, the flourish's draw, and everything else simply
         resolves. A pure fade can also afford to be slower than a
         moving one before it starts to feel sluggish. */
      @keyframes greetIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        /* Nothing to strip any more — the text arrival is already a
           plain fade, which is what the reduced-motion path wanted in
           the first place. The flourish still drops its draw below. */
      }
    `}</style>

    {/* The kicker is skipped where the card above already names the
        time of day — printing "Afternoon." and then AFTERNOON two
        lines later is its own kind of amateur. */}
    {kicker && (
      <div style={{
        ...fadeIn(KICKER_AT),
        fontFamily: ff.sans, fontSize: 9.5, fontWeight: 500,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: theme.ash, marginBottom: 10,
      }}>
        {kicker}
      </div>
    )}

    {/* One line: frame in serif roman, name in italic terra. The split
        is italic-vs-roman rather than line-one-vs-line-two, so the
        phrase still reads as one spoken question.

        No FitText here on purpose. The old line shrank itself to fit
        long names, and a headline that resizes per user reads as
        unfinished; this one wraps instead, which is what type is
        supposed to do. */}
    <div style={{
      ...slowFade(SLOGAN_AT),
      fontFamily: ff.serif, fontSize: 24, fontWeight: 400,
      color: theme.ink, lineHeight: 1.2,
      letterSpacing: "-0.005em",
      textWrap: "balance",
      overflowWrap: "anywhere",
    }}>
      What's the tea,{" "}
      <span style={{
        fontStyle: "italic", fontWeight: 500, color: theme.terra,
      }}>{name}?</span>
    </div>

    {/* The poem card above opens with this flourish; the greeting
        closes with it. Same ornament, same width, same ochre — so the
        two read as a matched pair bracketing the top of the screen
        rather than two unrelated blocks that happen to be stacked.
        A plain hairline here was doing the same structural job with
        none of the rhyme. */}
    <OrnamentRule drawing={arriving} style={{ marginTop: 12 }} />
  </div>
  );
};
