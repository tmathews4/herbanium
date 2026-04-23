/* ──────────────────────────────────────────────────────────────
   components/EffectBar.jsx — horizontal 5-segment bar for effect strength

   Used on ingredient pages and blend detail to visualize how strongly
   an effect (calm, focus, sleepy, etc.) registers on a 0-5 scale.
   Label on the left, segments in the middle, numeric value on the right.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const EffectBar = ({ label, value, color = theme.sage }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: ff.sans }}>
    <div style={{ fontSize: 11.5, color: theme.inkSoft, width: 72, letterSpacing: "0.04em" }}>{label}</div>
    <div style={{ display: "flex", gap: 3, flex: 1 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          flex: 1, height: 5, borderRadius: 2,
          background: i <= value ? color : theme.ruleSoft,
        }} />
      ))}
    </div>
    <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink, width: 22, textAlign: "right" }}>{value}</div>
  </div>
);
