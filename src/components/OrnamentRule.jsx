/* ──────────────────────────────────────────────────────────────
   components/OrnamentRule.jsx — the flourish, optionally drawing
   itself in.

   Home shows this mark twice: opening the poem card at the top of the
   screen, and closing the greeting below it. They're a matched pair,
   so they draw as a pair — same delay, same duration, both strokes
   travelling at once. Animating one and not the other would break the
   symmetry the layout is built on.

   `drawing` is passed down from HomeScreen rather than decided here,
   so every flourish on the screen agrees about whether this is an
   arrival. See homeArrival in HomeScreen.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { Ornament } from "./icons";
import { theme } from "../theme";

// Shared timing, and deliberately matched to the greeting: the draw
// starts on the same beat as the kicker (KICKER_AT in TeaGreeting) and
// the slogan follows 0.2s later, so the flourishes and the words read
// as one arrival instead of the frame turning up early and waiting.
// Keep this value and KICKER_AT in step if either moves.
//
// The flourish is also the ONE thing here allowed to be slow — it's
// decoration, so a long draw delays nothing the user came to read.
// NN/g's guidance on animated text is to keep motion off primary
// content and put it on supporting elements; this is the supporting
// element, so it carries the unhurried feeling and the poem doesn't.
export const ORN_DRAW_DELAY = 1.5;
export const ORN_DRAW_DUR   = 1.6;
export const ORN_DOT_DELAY  = 3.0;

export const OrnamentRule = ({ w = 80, c = theme.ochre, drawing = false, style }) => (
  <div
    className={`greet-orn${drawing ? " greet-orn-anim" : ""}`}
    style={{ display: "flex", justifyContent: "center", ...style }}
  >
    <style>{`
      /* 120 comfortably exceeds each path's length, so the dash starts
         fully retracted and pays out left to right. */
      @keyframes ornDraw {
        from { stroke-dashoffset: 120; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes ornDot {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .greet-orn path { stroke-dasharray: 120; }
      .greet-orn-anim path {
        animation: ornDraw ${ORN_DRAW_DUR}s ease-out ${ORN_DRAW_DELAY}s both;
      }
      .greet-orn-anim circle {
        animation: ornDot 0.5s ease-out ${ORN_DOT_DELAY}s both;
      }
      @media (prefers-reduced-motion: reduce) {
        /* Keep the arrival, drop the travel — fade the whole mark in
           rather than drawing it. The dot has to come forward with the
           strokes here: its 1.85s cue exists to land after a stroke
           the user isn't watching, so leaving it there would just be a
           dot that shows up late for no reason. */
        .greet-orn-anim path {
          animation: ornDot 0.8s ease-out 0.6s both;
          stroke-dashoffset: 0;
        }
        .greet-orn-anim circle {
          animation: ornDot 0.8s ease-out 0.6s both;
        }
      }
    `}</style>
    <Ornament w={w} c={c} />
  </div>
);
