/* ──────────────────────────────────────────────────────────────
   screens/BadgesPanel.jsx — attribute grid for Compose > Shelf > Badges.

   Renders the full attribute set (lifetime + recent), earned tinted by
   rarity, locked dimmed. Tap any tile to expand a detail card with
   rarity, window, and the why-you-earned-it description.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { ATTRIBUTE_GLYPHS } from "../components/icons";
import { ff, theme } from "../theme";
import { buildAttributeContext, evaluateAttributes } from "../data/attributes";

const RARITY = {
  common:    { label: "common",    color: theme.ash,      weight: 1 },
  uncommon:  { label: "uncommon",  color: theme.sageDeep, weight: 2 },
  rare:      { label: "rare",      color: theme.ochre,    weight: 3 },
  legendary: { label: "legendary", color: theme.terra,    weight: 4 },
  mythic:    { label: "mythic",    color: theme.plum,     weight: 5 },
};

const TINT_TO_THEME = {
  sage: theme.sage, sageDeep: theme.sageDeep,
  ochre: theme.ochre, terra: theme.terra,
  plum: theme.plum, sky: theme.sky || theme.sageDeep,
  ash: theme.ash,
};

// Frame styles for the icon container.
function frameStyle(frame, color, earned) {
  const base = {
    width: 44, height: 44,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: earned ? `${color}14` : "transparent",
    border: `1.5px solid ${earned ? color : theme.ruleSoft}`,
    transition: "all 0.15s ease",
  };
  if (frame === "circle")  return { ...base, borderRadius: "50%" };
  if (frame === "square")  return { ...base, borderRadius: 6 };
  if (frame === "hex")     return { ...base, borderRadius: 6, transform: "rotate(0deg)", clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" };
  if (frame === "diamond") return { ...base, borderRadius: 4, transform: "rotate(45deg)" };
  return { ...base, borderRadius: 6 };
}

// Accent corner mark for extra distinction. Returns a small absolute element.
function AccentMark({ accent, color }) {
  if (!accent || accent === "none") return null;
  const baseStyle = {
    position: "absolute", top: -2, right: -2,
    width: 10, height: 10, fontSize: 9, lineHeight: "10px",
    textAlign: "center", color, fontWeight: "bold",
    pointerEvents: "none",
  };
  if (accent === "dot")      return <span style={{ ...baseStyle, background: color, borderRadius: "50%" }} />;
  if (accent === "star")     return <span style={baseStyle}>★</span>;
  if (accent === "crescent") return <span style={baseStyle}>☾</span>;
  if (accent === "rays")     return <span style={{ ...baseStyle, fontSize: 12 }}>✦</span>;
  return null;
}

export const BadgesPanel = ({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds }) => {
  const ctx = buildAttributeContext({ sessions, savedBlendIds, favoriteBlendIds, generatedBlends, pantryIds });
  const all = evaluateAttributes(ctx);
  // Sort: earned first, then by rarity weight descending, then alphabetical.
  const sorted = [...all].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    const ra = RARITY[a.rarity]?.weight || 0;
    const rb = RARITY[b.rarity]?.weight || 0;
    if (ra !== rb) return rb - ra;
    return a.name.localeCompare(b.name);
  });
  const earnedCount = all.filter(a => a.earned).length;

  const [open, setOpen] = useState(null);
  const detail = open ? all.find(a => a.id === open) : null;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
        color: theme.ash, lineHeight: 1.55, marginBottom: 6,
      }}>
        Markers of how you tend the cup. Tap any to read its origin.
      </div>
      <div style={{
        fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
        textTransform: "uppercase", color: theme.ash, marginBottom: 12,
      }}>
        {earnedCount} of {all.length} discovered
      </div>

      {/* Detail card — sits inline above the grid when open. */}
      {detail && (
        <div style={{
          marginBottom: 14, padding: "12px 14px", borderRadius: 10,
          background: detail.earned ? `${TINT_TO_THEME[detail.tint] || theme.ash}10` : theme.cream,
          border: `1.5px solid ${detail.earned ? (TINT_TO_THEME[detail.tint] || theme.ash) : theme.ruleSoft}`,
          position: "relative",
        }}>
          <button onClick={() => setOpen(null)} aria-label="close" style={{
            position: "absolute", top: 4, right: 8,
            background: "transparent", border: "none", cursor: "pointer",
            color: theme.ash, fontSize: 18, lineHeight: 1, padding: 4,
          }}>×</button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
              {detail.name}
            </span>
            <span style={{
              fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: RARITY[detail.rarity]?.color || theme.ash,
            }}>
              {RARITY[detail.rarity]?.label || detail.rarity}
            </span>
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            }}>
              · {detail.window === "recent" ? "last 20 cups" : "lifetime"}
            </span>
          </div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft,
            lineHeight: 1.5, marginRight: 18,
          }}>
            {detail.desc}
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.12em",
            textTransform: "uppercase", marginTop: 6,
            color: detail.earned ? theme.terra : theme.ash,
          }}>
            {detail.earned ? "earned" : "not yet"}
          </div>
        </div>
      )}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
        gap: 10,
      }}>
        {sorted.map(a => {
          const color = TINT_TO_THEME[a.tint] || theme.ash;
          const Glyph = ATTRIBUTE_GLYPHS[a.glyph] || ATTRIBUTE_GLYPHS.flower;
          const isOpen = open === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setOpen(prev => prev === a.id ? null : a.id)}
              title={a.earned ? a.name : "—"}
              style={{
                background: "transparent", border: "none", padding: 0, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                opacity: a.earned ? 1 : 0.4,
                position: "relative",
                outline: isOpen ? `2px solid ${color}` : "none", outlineOffset: 2,
                borderRadius: 6,
              }}
            >
              <div style={{ position: "relative" }}>
                <div style={frameStyle(a.frame, color, a.earned)}>
                  {/* Counter-rotate inner glyph for diamond frame so it stays upright */}
                  <div style={{ transform: a.frame === "diamond" ? "rotate(-45deg)" : "none" }}>
                    <Glyph size={22} c={a.earned ? color : theme.ash} />
                  </div>
                </div>
                <AccentMark accent={a.accent} color={color} />
              </div>
              {a.earned && (
                <span style={{
                  fontFamily: ff.sans, fontSize: 7.5, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: RARITY[a.rarity]?.color || theme.ash,
                  textAlign: "center", lineHeight: 1, maxWidth: 60,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {a.name.replace(/^The /, "")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
