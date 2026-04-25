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
// maxValue (optional) renders a thin vertical tick on the bar at
// the strongest level this blend reaches at maximum slider settings.
// Lets the user see the cup's ceiling without hunting for it.
const VISUAL_GAMMA = 0.7;

const visualPosition = (v) =>
  5 * Math.pow(Math.max(0, v) / 5, VISUAL_GAMMA);

export const EffectBar = ({ label, value, maxValue, color = theme.sage }) => {
  const v = Number(value) || 0;
  const display = Math.round(v * 10) / 10;
  const visualV = visualPosition(v);

  // Tick renders whenever the max-settings value differs meaningfully
  // from the current value — in either direction. Most of the time
  // pushing the slider to max increases the strength, but some effects
  // peak mid-range and drop at maximum (over-extraction can dampen
  // certain notes), so the tick can land behind the fill to mean
  // "the cup is already past peak on this one."
  const showTick =
    typeof maxValue === "number" &&
    maxValue > 0 &&
    Math.abs(maxValue - v) > 0.05;
  const tickV = showTick ? visualPosition(maxValue) : null;

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
        {showTick && (
          <div
            title={`Max: ${Math.round(maxValue * 10) / 10}`}
            style={{
              position: "absolute",
              left: `${(tickV / 5) * 100}%`,
              top: -2,
              transform: "translateX(-50%)",
              width: 2, height: 9,
              background: theme.inkSoft,
              borderRadius: 1,
              opacity: 0.55,
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
