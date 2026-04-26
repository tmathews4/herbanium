/* ──────────────────────────────────────────────────────────────
   components/FirstCupHintCard.jsx — first-visit tutorial card.

   Replaces the old animi-omen popup at the top of Home for new
   users. Points at the two ways to make a first cup — Compose
   (build your own blend) or Apothecary (browse a tradition).
   Dismisses to a persisted flag so it doesn't reappear.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";
import { Kettle } from "./icons";

export const FirstCupHintCard = ({ onCompose, onApothecary, onDismiss }) => (
  <div style={{
    marginBottom: 20, padding: "16px 18px", borderRadius: 12,
    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
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
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <Kettle size={18} c={theme.terra} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: ff.serif, fontSize: 16, color: theme.ink,
          lineHeight: 1.25, marginBottom: 4,
        }}>The kettle is yours.</div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.inkSoft, lineHeight: 1.5, marginBottom: 12,
        }}>
          Build a custom blend in <em>Compose</em>, or browse traditional
          preparations in the <em>Apothecary</em>. Every cup brewed becomes
          part of your journal.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={onCompose}
            style={{
              fontFamily: ff.serif, fontSize: 14,
              padding: "8px 16px", borderRadius: 999,
              background: theme.terra, color: theme.cream,
              border: "none", cursor: "pointer",
            }}
          >open compose</button>
          <button
            onClick={onApothecary}
            style={{
              fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.06em",
              color: theme.terra,
              background: "transparent",
              border: `1px solid ${theme.terra}`, borderRadius: 999,
              padding: "8px 14px", cursor: "pointer",
            }}
          >browse apothecary</button>
        </div>
      </div>
    </div>
  </div>
);
