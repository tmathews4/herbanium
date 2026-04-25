/* ──────────────────────────────────────────────────────────────
   components/EffectBar.jsx — horizontal 5-segment bar for effect strength

   Used on ingredient pages and blend detail to visualize how strongly
   an effect (calm, focus, sleepy, etc.) registers on a 0-5 scale.
   Label on the left, segments in the middle, numeric value on the right.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

// Fractional values fill the corresponding segment partially: 2.5
// fills two full + half of the third. The right-hand numeric label
// shows one decimal so the cup's actual strength is honest, not
// rounded misleadingly to 0 when the value is something like 0.6.
export const EffectBar = ({ label, value, color = theme.sage }) => {
  const v = Number(value) || 0;
  const display = Math.round(v * 10) / 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: ff.sans }}>
      <div style={{ fontSize: 11.5, color: theme.inkSoft, width: 72, letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {[1,2,3,4,5].map(i => {
          // Partial fill for the boundary segment so 2.5 reads as
          // two-and-a-half rather than three.
          const fill = Math.max(0, Math.min(1, v - (i - 1)));
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
      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink, width: 28, textAlign: "right" }}>
        {Number.isInteger(display) ? display : display.toFixed(1)}
      </div>
    </div>
  );
};
