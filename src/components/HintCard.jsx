/* ──────────────────────────────────────────────────────────────
   components/HintCard.jsx — generic first-visit tutorial card.

   Used at the top of main surfaces (Compose, Profile, the Journal
   sub-tab) the first time the user lands there. Dismissible to a
   persisted flag so it never reappears.

   Surface-specific copy lives at the call site — this component
   just provides the consistent visual treatment: cream card, small
   icon at the top-left, serif title, italic body, × in the corner.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const HintCard = ({ icon, title, body, onDismiss }) => (
  <div style={{
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 12,
    background: theme.cream,
    border: `1px solid ${theme.ruleSoft}`,
    position: "relative",
  }}>
    <button
      onClick={onDismiss}
      aria-label="dismiss"
      style={{
        position: "absolute", top: 6, right: 10,
        background: "transparent", border: "none", cursor: "pointer",
        color: theme.ash, fontSize: 18, lineHeight: 1, padding: 4,
      }}
    >×</button>

    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      {icon && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div style={{
          fontFamily: ff.serif, fontSize: 15.5, color: theme.ink,
          lineHeight: 1.25, marginBottom: 4,
        }}>{title}</div>
        <div style={{
          fontFamily: ff.sans, fontSize: 13,
          color: theme.inkSoft, lineHeight: 1.5,
        }}>{body}</div>
      </div>
    </div>
  </div>
);
