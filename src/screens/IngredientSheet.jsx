/* ──────────────────────────────────────────────────────────────
   screens/IngredientSheet.jsx — small mini-tile ingredient overlay.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { EffectBar } from "../components/EffectBar";
import {
  Flower, Leaf, Sprig,
} from "../components/icons";
import { INGREDIENTS } from "../data/ingredients";
import {
  ff, theme,
} from "../theme";
import { formatTempRange, useUnit } from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Component: INGREDIENT SHEET
   Bottom-sheet mini-tile showing quick-reference info about an
   ingredient, overlaid on the Steep timer. Used when a user wants
   to quickly recall what an ingredient is doing in their current
   brew without navigating away from the timer.
   ────────────────────────────────────────────────────────────── */

export const IngredientSheet = ({ id, onClose }) => {
  const { unit } = useUnit();
  const ing = INGREDIENTS[id];
  if (!ing) return null;

  return (
    <>
      {/* Backdrop — tap anywhere outside the sheet to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, zIndex: 40,
          background: "rgba(30, 24, 18, 0.35)",
          animation: "sheetFadeIn 0.2s ease-out",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
        background: theme.ivory,
        borderRadius: "20px 20px 0 0",
        padding: "16px 22px 22px",
        maxHeight: "60%", overflowY: "auto",
        boxShadow: "0 -8px 32px -12px rgba(30,24,18,0.3)",
        animation: "sheetSlideUp 0.25s ease-out",
      }}>
        {/* Grab-handle + exit row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: theme.rule, margin: "0 auto",
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            top: 8,
          }} />
          <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            a quick look
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 4px",
          }}>×</button>
        </div>

        {/* Ingredient header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: theme.cream, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {ing.category === "flower"    && <Flower size={22} c={theme.ochre} />}
            {ing.category === "herbal"    && <Sprig  size={22} c={theme.sage} />}
            {ing.category === "true tea"  && <Leaf   size={22} c={theme.sageDeep} />}
            {ing.category === "spice"     && <Flower size={22} c={theme.terra} />}
            {ing.category === "adaptogen" && <Sprig  size={22} c={theme.plum} />}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1.1, marginTop: 1 }}>
              {ing.name}
            </div>
            <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.ash, marginTop: 3 }}>
              {formatTempRange(ing.tempC[0], ing.tempC[1], unit)}
            </div>
          </div>
        </div>

        {/* Blurb — one-line essence */}
        <div style={{
          fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
          lineHeight: 1.5, marginBottom: 14,
        }}>
          {ing.blurb}
        </div>

        {/* Effects — top 3 */}
        {ing.effects && ing.effects.length > 0 && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            display: "flex", flexDirection: "column", gap: 6, marginBottom: 10,
          }}>
            {ing.effects.slice(0, 3).map(([tag, n], i) => (
              <EffectBar
                key={tag}
                label={tag}
                value={n}
                color={
                  tag === "bitterness" ? theme.terra
                  : i === 0           ? theme.sage
                  : i === 1           ? theme.ochre
                  : theme.sky
                }
              />
            ))}
          </div>
        )}

        {/* Flavor tags */}
        {ing.flavors && ing.flavors.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {ing.flavors.slice(0, 4).map(f => (
              <span key={f} style={{
                fontFamily: ff.sans, fontSize: 10, color: theme.terra, letterSpacing: "0.04em",
                padding: "2px 8px", border: `1px solid ${theme.terra}`, borderRadius: 999,
                opacity: 0.85,
              }}>{f}</span>
            ))}
          </div>
        )}

        {/* Heads-up note — only if present */}
        {ing.headsUp && (
          <div style={{
            padding: "9px 12px", borderRadius: 8, marginBottom: 12,
            background: "rgba(176, 84, 47, 0.07)",
            border: `1px solid rgba(176, 84, 47, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ color: theme.terra, fontSize: 14, lineHeight: 1.2 }}>⚠</span>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              {ing.headsUp}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes sheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
