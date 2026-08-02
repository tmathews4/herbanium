/* ──────────────────────────────────────────────────────────────
   components/PoemLines.jsx — the poem body on Home.

   Line-by-line arrival. A poem is metered — it's read one line at a
   time — so it arrives one line at a time, on the same clock as the
   rest of the masthead. That timing is what makes the card feel
   composed rather than filled in.

   Plain text with `pre-line` couldn't do it: the lines have to be
   real elements to animate separately. Splitting on newline is
   enough, since every poem in waitContent is authored with hard line
   breaks.

   Hanging quote marks were tried here and removed — oversized
   open/close glyphs in the margins. They framed the verse but
   crowded the last line on short poems, and the card already gets
   its framing from the flourishes above and below it. Two framing
   devices around one small block was one too many.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { ff, theme } from "../theme";

// The poem is primary content — the thing the card exists to show — so
// it stays the quickest part of the sequence and starts almost
// immediately. NN/g's study of animated text found users read animated
// body copy as an artificial loading delay, so whatever slowness the
// opening has should live in the flourish, not here. The 140ms stagger
// stagger is past the usual 50–200ms range, deliberately: the lines
// should land at reading pace so a scan-reader can follow the poem as
// it arrives rather than watching a block appear. That's a different
// job from the "don't make me wait for body copy" case the range is
// written for — nothing here is gating a task.
const LINE_START = 0.25;
const LINE_STAGGER = 0.26;
const LINE_DUR = 1.2;

export const PoemLines = ({ text, size = 12.5, arriving = false, attribution = null }) => {
  const lines = String(text || "").split("\n");
  // The attribution waits for the whole verse, then fades slowly and
  // on its own. It was the one part of the card simply present from
  // the first frame, which read as the poem animating around a fixed
  // label. Signing the poem after it has been read is also just the
  // right order.
  const afterLastLine = LINE_START + Math.max(0, lines.length - 1) * LINE_STAGGER + LINE_DUR;
  return (
    <div style={{ position: "relative" }}>
      <style>{`
        /* Opacity only, matching the rest of the masthead — the lines
           resolve where they already sit rather than rising into
           place. With five of them staggered, even a 5px rise added up
           to a lot of movement in a small card. */
        @keyframes poemLineIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: size,
            color: theme.inkSoft, lineHeight: 1.55,
            // Blank lines between stanzas still need to hold their
            // height, which an empty div won't do on its own.
            minHeight: line.trim() === "" ? "0.8em" : undefined,
            ...(arriving
              ? {
                  animation: `poemLineIn ${LINE_DUR}s cubic-bezier(0.33, 0, 0.2, 1) `
                    + `${LINE_START + i * LINE_STAGGER}s both`,
                }
              : null),
          }}
        >
          {line}
        </div>
      ))}

      {attribution && (
        <div style={{
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
          color: theme.ash, marginTop: 8,
          ...(arriving
            ? {
                animation: "poemLineIn 1.5s cubic-bezier(0.33, 0, 0.2, 1) "
                  + `${afterLastLine - 0.35}s both`,
              }
            : null),
        }}>
          {attribution}
        </div>
      )}
    </div>
  );
};
