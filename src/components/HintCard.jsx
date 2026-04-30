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
import { theme, ff, shadow, radius } from "../theme";
import { Button } from "./layout";

export const HintCard = ({ title, body, onDismiss }) => (
  <div style={{
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: radius.md,
    background: theme.cream,
    border: `1px solid ${theme.ruleSoft}`,
    boxShadow: shadow.card,
    display: "flex", flexDirection: "column", gap: 10,
  }}>
    <div>
      {title && (
        <div style={{
          fontFamily: ff.serif, fontSize: 14, color: theme.ink,
          lineHeight: 1.25, marginBottom: 6, textAlign: "center",
        }}>{title}</div>
      )}
      <div style={{
        fontFamily: ff.sans, fontSize: 12,
        color: theme.inkSoft, lineHeight: 1.45, textAlign: "left",
      }}>{body}</div>
    </div>
    <Button
      variant="primary" fullWidth
      onClick={onDismiss}
      style={{
        fontFamily: ff.sans, fontSize: 12, fontWeight: 500,
        letterSpacing: "0.10em", textTransform: "uppercase",
        padding: "11px 18px",
      }}
    >OK</Button>
  </div>
);
