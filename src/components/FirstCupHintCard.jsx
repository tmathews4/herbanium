/* ──────────────────────────────────────────────────────────────
   components/FirstCupHintCard.jsx — first-visit tutorial card.

   Anchored above the tab bar at the bottom of the screen on
   first load. Explains the two main destinations (Apothecary,
   Shelf) and dismisses with a single OK button on the right —
   thumb-friendly tap target. Persisted dismiss flag so it
   doesn't return.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";
import { Kettle } from "./icons";

export const FirstCupHintCard = ({ onDismiss }) => (
  <div style={{
    flexShrink: 0,
    background: theme.cream,
    borderTop: `1px solid ${theme.ruleSoft}`,
    padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={{ flexShrink: 0 }}>
      <Kettle size={18} c={theme.terra} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: ff.serif, fontSize: 14, color: theme.ink,
        lineHeight: 1.25, marginBottom: 2,
      }}>Welcome.</div>
      <div style={{
        fontFamily: ff.sans, fontSize: 12,
        color: theme.inkSoft, lineHeight: 1.45,
      }}>
        <strong style={{ color: theme.terra, fontWeight: 600 }}>Apothecary</strong> to brew ·{" "}
        <strong style={{ color: theme.terra, fontWeight: 600 }}>Shelf</strong> to journal.
      </div>
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
