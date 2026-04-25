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
// thresholdValue (optional) renders a terra-colored tick at a
// perception-layer warning threshold (e.g. 2.5 on the bitterness
// bar — where the "bitter side is starting to dominate" warning
// fires). Lets the user see exactly when pushing further will
// trip a warning.
const VISUAL_GAMMA = 0.7;

const visualPosition = (v) =>
  5 * Math.pow(Math.max(0, v) / 5, VISUAL_GAMMA);

export const EffectBar = ({ label, value, thresholdValue, color = theme.sage }) => {
  const v = Number(value) || 0;
  const display = Math.round(v * 10) / 10;
  const visualV = visualPosition(v);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: ff.sans }}>
      <div style={{ fontSize: 11.5, color: theme.inkSoft, width: 72, letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ display: "flex", gap: 3, flex: 1, position: "relative" }}>
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
        {typeof thresholdValue === "number" && thresholdValue > 0 && thresholdValue <= 5 && (
          <div
            title={`Warning at ${thresholdValue}`}
            style={{
              position: "absolute",
              left: `${(visualPosition(thresholdValue) / 5) * 100}%`,
              top: -3,
              transform: "translateX(-50%)",
              width: 2, height: 11,
              background: theme.terra,
              borderRadius: 1,
              opacity: 0.85,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink, width: 28, textAlign: "right" }}>
        {Number.isInteger(display) ? display : display.toFixed(1)}
      </div>
    </div>
  );
};
