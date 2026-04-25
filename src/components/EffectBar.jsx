/* ──────────────────────────────────────────────────────────────
   components/EffectBar.jsx — horizontal 5-segment bar for effect strength

   Used on ingredient pages and blend detail to visualize how strongly
   an effect (calm, focus, sleepy, etc.) registers on a 0-5 scale.
   Label on the left, segments in the middle, numeric value on the right.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

// Fractional values fill segments partially: 2.5 fills two full +
// half of the third. The right-hand numeric label shows the honest
// data (one decimal for fractions, integer for whole values).
//
// Visual fill applies a gentle power curve — visualV = 5 * (v/5)^0.7
// — so mild but real strengths (0.4, 1.2, 2.2) read more present
// in the bar without changing the displayed number. A "moderate"
// blend feels moderate visually instead of looking nearly empty,
// while max strength still reaches the right edge.
//
const VISUAL_GAMMA = 0.7;

const visualPosition = (v) =>
  5 * Math.pow(Math.max(0, v) / 5, VISUAL_GAMMA);

export const EffectBar = ({ label, value, color = theme.sage }) => {
  const v = Number(value) || 0;
  const visualV = visualPosition(v);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: ff.sans }}>
      <div style={{ fontSize: 11.5, color: theme.inkSoft, width: 72, letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {[1,2,3,4,5].map(i => {
          const fill = Math.max(0, Math.min(1, visualV - (i - 1)));
          return (
            <div key={i} style={{
              flex: 1, height: 5, borderRadius: 2,
              background: theme.ruleSoft,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                width: `${fill * 100}%`,
                background: color,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
