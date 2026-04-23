/* ──────────────────────────────────────────────────────────────
   components/DemoHint.jsx — small banner hints on demo surfaces

   Used at the bottom of the app shell (currently) to point out
   things that might not be obvious in the mock. Short label on the
   left (uppercase, terra), italic detail on the right. Designed
   to be unobtrusive — a nudge rather than an instruction.

   Currently surfaces one hint at a time about dev features
   ("Flip seed mode" → "Profile → Dev → try 'new user'"). Will
   likely be removed or reshaped when the app moves past the
   demo/portfolio phase.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const DemoHint = ({ label, detail }) => (
  <div style={{
    padding: "8px 14px",
    background: "rgba(250,244,228,0.5)",
    border: `1px solid ${theme.rule}`,
    borderRadius: 999,
    fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ color: theme.terra, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 9.5 }}>{label}</span>
    <span style={{ color: theme.rule }}>·</span>
    <span style={{ fontFamily: ff.serif, fontStyle: "italic", color: theme.ash }}>{detail}</span>
  </div>
);
