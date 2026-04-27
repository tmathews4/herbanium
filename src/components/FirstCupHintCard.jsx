/* ──────────────────────────────────────────────────────────────
   components/FirstCupHintCard.jsx — first-visit tutorial card.

   Anchored above the tab bar at the bottom of the screen on
   first load. Explains the two main destinations (Apothecary,
   Shelf) and dismisses with a single full-width OK button below
   the body. Persisted dismiss flag so it doesn't return.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

export const FirstCupHintCard = ({ onDismiss }) => (
  <div style={{
    flexShrink: 0,
    background: theme.cream,
    borderTop: `1px solid ${theme.ruleSoft}`,
    padding: "12px 16px",
    display: "flex", flexDirection: "column", gap: 10,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: ff.serif, fontSize: 14, color: theme.ink,
        lineHeight: 1.25, marginBottom: 6, textAlign: "center",
      }}>Welcome.</div>
      <div style={{
        fontFamily: ff.sans, fontSize: 12,
        color: theme.inkSoft, lineHeight: 1.45, textAlign: "left",
      }}>
        <div>
          <strong style={{ color: theme.terra, fontWeight: 600 }}>Apothecary</strong>
          <span style={{
            display: "inline-block",
            width: 6, height: 6, borderRadius: "50%",
            background: theme.terra,
            verticalAlign: "middle",
            margin: "0 8px",
          }} />
          Experiment and Discover.
        </div>
        <div>
          <strong style={{ color: theme.terra, fontWeight: 600 }}>Shelf</strong>
          <span style={{
            display: "inline-block",
            width: 6, height: 6, borderRadius: "50%",
            background: theme.terra,
            verticalAlign: "middle",
            margin: "0 8px",
          }} />
          Your Journal, Your Vibes.
        </div>
      </div>
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
