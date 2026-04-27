/* ──────────────────────────────────────────────────────────────
   components/PantryHintCard.jsx — one-time pantry nudge on Home

   Pantry starts empty for new users. This card explains the pantry
   feature and gives a one-tap path into Library where the user can
   mark what they have on hand. Persists until dismissed (stored as
   pantryHintShown in localStorage). Doesn't auto-dismiss — the copy
   is actionable, so we want the user to read it.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";
import { Sprig } from "./icons";

export const PantryHintCard = ({ onDismiss }) => {
  return (
    <div style={{
      marginBottom: 16,
      padding: "16px 18px",
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
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <Sprig size={18} c={theme.sageDeep} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: ff.serif, fontSize: 16, color: theme.ink,
            lineHeight: 1.25, marginBottom: 4,
          }}>
            Pantry
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 13,
            color: theme.inkSoft, lineHeight: 1.5, marginBottom: 12,
          }}>
            Tap the <strong>+</strong> on any ingredient to add it to your pantry.
            Then filter blends by what you can brew right now.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={onDismiss}
              style={{
                fontFamily: ff.serif, fontSize: 14,
                padding: "8px 18px", borderRadius: 999,
                background: theme.terra, color: theme.cream,
                border: "none", cursor: "pointer",
              }}
            >Got it</button>
          </div>
        </div>
      </div>
    </div>
  );
};
