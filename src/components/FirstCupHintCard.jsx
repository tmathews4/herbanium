/* ──────────────────────────────────────────────────────────────
   components/FirstCupHintCard.jsx — first-visit tutorial card.

   Sits at the top of Home for new users. Points at the two big
   CTAs on Home — "Brew a cup" (Apothecary) and "Note a moment"
   (Shelf · Journal) — and explains the four-tab layout briefly.
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
          textAlign: "left",
        }}>
          <div style={{ marginBottom: 6 }}>
            The <em style={{ color: theme.terra, fontStyle: "normal" }}>Apothecary</em> is where you build a cup — blend by
            ingredient, follow a vibe, or browse the compendium.
          </div>
          <div style={{ marginBottom: 6 }}>
            The <em style={{ color: theme.terra, fontStyle: "normal" }}>Shelf</em> keeps everything you've made: your
            journal, the recipe book, your pantry.
          </div>
          <div>
            Brew a cup or note a moment — both land in time.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-start" }}>
          <button
            onClick={onCompose}
            style={{
              fontFamily: ff.serif, fontSize: 14,
              padding: "8px 16px", borderRadius: 999,
              background: theme.terra, color: theme.cream,
              border: "none", cursor: "pointer",
            }}
          >open the apothecary</button>
          <button
            onClick={onApothecary}
            style={{
              fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.06em",
              color: theme.terra,
              background: "transparent",
              border: `1px solid ${theme.terra}`, borderRadius: 999,
              padding: "8px 14px", cursor: "pointer",
            }}
          >open the shelf</button>
        </div>
      </div>
    </div>
  </div>
);
