/* ──────────────────────────────────────────────────────────────
   components/HintCard.jsx — generic first-visit tutorial card.

   Used at the top of main surfaces (Compose, Profile, the Journal
   sub-tab) the first time the user lands there. Dismissible to a
   persisted flag so it never reappears.

   Visual matches the FirstCupHintCard banner: a compact horizontal
   row with a small icon on the left, the title + body in the
   middle, and a single OK pill on the right. The OK button is the
   only dismiss target — no × in the corner — so the tap target is
   thumb-friendly and unambiguous.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const HintCard = ({ icon, title, body, onDismiss }) => (
  <div style={{
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: theme.cream,
    border: `1px solid ${theme.ruleSoft}`,
    display: "flex", alignItems: "center", gap: 12,
  }}>
    {icon && (
      <div style={{ flexShrink: 0 }}>{icon}</div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      {title && (
        <div style={{
          fontFamily: ff.serif, fontSize: 14, color: theme.ink,
          lineHeight: 1.25, marginBottom: 2,
        }}>{title}</div>
      )}
      <div style={{
        fontFamily: ff.sans, fontSize: 12,
        color: theme.inkSoft, lineHeight: 1.45,
      }}>{body}</div>
    </div>
    <button
      onClick={onDismiss}
      style={{
        flexShrink: 0,
        fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.10em",
        textTransform: "uppercase",
        padding: "8px 18px", borderRadius: 999,
        background: theme.terra, color: theme.cream,
        border: "none", cursor: "pointer",
      }}
    >OK</button>
  </div>
);
