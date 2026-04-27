/* ──────────────────────────────────────────────────────────────
   components/HintCard.jsx — generic first-visit tutorial card.

   Used at the top of main surfaces (Compose, Profile, the Journal
   sub-tab, the Bestiary) the first time the user lands there.
   Dismissible to a persisted flag so it never reappears.

   Layout: title + body on top, full-width OK button on its own
   row underneath. The wide button gives the body text the full
   card width on narrow phones instead of squeezing it.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const HintCard = ({ title, body, onDismiss }) => (
  <div style={{
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: theme.cream,
    border: `1px solid ${theme.ruleSoft}`,
    display: "flex", flexDirection: "column", gap: 10,
  }}>
    <div>
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
        width: "100%",
        fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.10em",
        textTransform: "uppercase",
        padding: "10px 18px", borderRadius: 999,
        background: theme.terra, color: theme.cream,
        border: "none", cursor: "pointer",
      }}
    >OK</button>
  </div>
);
