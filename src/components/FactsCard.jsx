/* ──────────────────────────────────────────────────────────────
   components/FactsCard.jsx — tap-to-advance fact reader

   A single-fact-at-a-time card used on ingredient Overview tabs in
   the "Did you know" section. Tap the card to advance to the next
   fact, cycling back to the first after the last. No auto-advance —
   facts are read at the user's pace, unlike the Steep screen's wait
   cards which rotate on a timer.

   Expects an array of fact strings. Gracefully handles 0 and 1 fact
   cases (caller should avoid rendering for empty arrays, but the
   component itself won't break).
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";

export const FactsCard = ({ facts }) => {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const advance = () => {
    if (facts.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setIdx(i => (i + 1) % facts.length);
      setFading(false);
    }, 180);
  };

  return (
    <div
      onClick={advance}
      style={{
        // Tighter bottom padding (10 instead of 14) so the index +
        // 'next' row sits closer to the bottom border. Combined
        // with the flex layout below, this stops the navigation
        // labels from floating mid-card on short facts.
        padding: "14px 16px 10px",
        border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
        minHeight: 90,
        cursor: facts.length > 1 ? "pointer" : "default",
        position: "relative",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic",
        fontSize: 14, color: theme.ink, lineHeight: 1.55,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.18s ease",
        flex: 1,
      }}>
        {facts[idx]}
      </div>
      {facts.length > 1 && (
        <div style={{
          // marginTop:auto pushes the nav row to the bottom of the
          // flex column even when the fact above it is short. Pair
          // with a small fixed top gap so it never crashes into the
          // text on long facts.
          marginTop: "auto", paddingTop: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash,
          }}>
            {idx + 1} of {facts.length}
          </div>
          {/* Triangle advance button — same affordance as Steep wait cards */}
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.12em",
            textTransform: "uppercase", color: theme.ash,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>next</span>
            <span style={{ color: theme.terra, fontSize: 11 }}>▸</span>
          </div>
        </div>
      )}
    </div>
  );
};
