/* ──────────────────────────────────────────────────────────────
   screens/LibraryScreen.jsx — Apothecary tab: ingredient catalog only.
   Saved blends and Journal/check-ins moved to Compose > Shelf.
   Also exports LibraryList and BlendListRow used by ComposeScreen.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import {
  Flower, Leaf, Sprig,
} from "../components/icons";
import {
  ChipRows, EmptyState, SectionLabel,
} from "../components/layout";;
import { INGREDIENTS } from "../data/ingredients";
import {
  ff, theme,
} from "../theme";
import { mmss } from "../helpers/misc";
import {
  formatTempShort, useUnit,
} from "../units/units";

export const LibraryScreen = ({ go, pantryIds }) => {
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfCategory, setShelfCategory] = useState("all");
  const [pantryOnly, setPantryOnly] = useState(false);

  // All ingredients, filtered by search / category / pantry-toggle, then
  // sorted alphabetically by display name so the catalog is browsable.
  const shelfItems = Object.entries(INGREDIENTS)
    .filter(([id, ing]) => {
      if (pantryOnly && !pantryIds.has(id)) return false;
      if (shelfCategory !== "all" && ing.category !== shelfCategory) return false;
      if (shelfSearch.trim()) {
        const q = shelfSearch.trim().toLowerCase();
        const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      <div style={{ marginBottom: 14 }}>
        <SectionLabel n="i">The Apothecary</SectionLabel>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.ash, marginTop: 4, lineHeight: 1.5,
        }}>
          Every leaf, flower, root, and bark Herbanium tracks. Tap any to read its profile.
        </div>
      </div>

      <>
        {/* Search input */}
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            marginBottom: 10,
          }}>
            <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
            <input
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              placeholder="search the apothecary…"
              style={{
                flex: 1, background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: shelfSearch ? "normal" : "italic",
                fontSize: 14, color: theme.ink, outline: "none",
              }}
            />
            {shelfSearch && (
              <button onClick={() => setShelfSearch("")} style={{
                background: "transparent", border: "none", color: theme.ash,
                fontSize: 12, cursor: "pointer",
              }}>×</button>
            )}
          </div>

          {/* Category filter pills */}
          <div style={{ marginBottom: 10 }}>
            <ChipRows
              items={[
                ["all",       "all"],
                ["true tea",  "teas"],
                ["herbal",    "herbals"],
                ["flower",    "flowers"],
                ["spice",     "spices"],
                ["adaptogen", "adaptogens"],
              ]}
              gap={4}
              rowGap={4}
              renderItem={([key, label]) => (
                <button key={key} onClick={() => setShelfCategory(key)} style={{
                  fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                  padding: "3px 9px", borderRadius: 999,
                  border: `1px solid ${shelfCategory === key ? theme.ink : theme.ruleSoft}`,
                  background: shelfCategory === key ? theme.ink : "transparent",
                  color: shelfCategory === key ? theme.cream : theme.ash,
                  cursor: "pointer",
                }}>{label}</button>
              )}
            />
          </div>

          {/* Pantry-only toggle + count */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, padding: "2px 0",
          }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: ff.sans, fontSize: 11.5, color: theme.inkSoft, cursor: "pointer",
            }}>
              <span style={{
                width: 28, height: 16, borderRadius: 999,
                background: pantryOnly ? theme.sageDeep : theme.rule,
                position: "relative", transition: "background .2s",
                flexShrink: 0,
              }} onClick={() => setPantryOnly(!pantryOnly)}>
                <span style={{
                  position: "absolute", top: 2, left: pantryOnly ? 14 : 2,
                  width: 12, height: 12, borderRadius: "50%", background: theme.cream,
                  transition: "left .2s",
                }} />
              </span>
              <span onClick={() => setPantryOnly(!pantryOnly)}>only what's in my pantry</span>
            </label>
            <span style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
            }}>
              {shelfItems.length} of {Object.keys(INGREDIENTS).length}
            </span>
          </div>

          {/* The catalog grid */}
          {shelfItems.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.ash, padding: "18px 0", textAlign: "center",
            }}>
              no ingredients match your filters.
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            }}>
              {shelfItems.map(([id, ing]) => {
                const inPantry = pantryIds.has(id);
                return (
                  <button key={id} onClick={() => go("ingredient", id)} style={{
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                    borderRadius: 10, padding: "12px 12px", textAlign: "left", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: inPantry ? 1 : 0.6,
                    position: "relative",
                  }}>
                    {/* Pantry badge — only shown for items you own */}
                    {inPantry && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: "50%",
                        background: theme.sage,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: theme.cream, fontSize: 10, fontWeight: "bold",
                      }}>✓</div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: inPantry ? 22 : 0 }}>
                      {ing.category === "flower" && <Flower size={18} c={theme.ochre} />}
                      {ing.category === "herbal" && <Sprig size={18} c={theme.sage} />}
                      {ing.category === "true tea" && <Leaf size={18} c={theme.sageDeep} />}
                      {ing.category === "spice" && <Flower size={18} c={theme.terra} />}
                      {ing.category === "adaptogen" && <Sprig size={18} c={theme.plum} />}
                      <span style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>
                        {ing.subcategory || ing.category}
                      </span>
                    </div>
                    <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink, marginTop: 6 }}>
                      {ing.name}
                    </div>
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash }}>
                      {ing.latin}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Saved-blends list (used by Compose > Shelf)
   ────────────────────────────────────────────────────────────── */

export const LibraryList = ({ blends, compact, go, startBrew, openBlend, highlightId }) => {
  if (!blends || blends.length === 0) {
    return (
      <EmptyState
        icon={<Leaf size={24} c={theme.sage} />}
        title="No saved blends yet"
        body="The blends you save or adopt from friends will live here."
        cta={{ label: "compose your first cup →", onClick: () => go("compose") }}
      />
    );
  }
  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      {!compact && <SectionLabel n="i">Your saved blends</SectionLabel>}
      <div style={{ marginTop: compact ? 0 : 10 }}>
        {blends.map((b, i) => (
          <BlendListRow
            key={b.id} b={b} first={i === 0}
            highlighted={highlightId === b.id}
            go={go} startBrew={startBrew} openBlend={openBlend}
          />
        ))}
      </div>
    </div>
  );
};

export const BlendListRow = ({ b, first, author, go, openBlend, highlighted }) => {
  const { unit, weightUnit } = useUnit();
  // Primary tap → open the blend detail page. openBlend is required; callers
  // that forget to pass it will see a runtime error on tap, which is what
  // we want — silent fallbacks hide bugs. (We learned this from the
  // traditional-rows-auto-brewing incident: a missing prop quietly routed
  // to startBrew and the wrong behavior shipped.)
  const handleTap = () => openBlend(b.id);
  return (
  <button onClick={handleTap} style={{
    width: "100%", textAlign: "left",
    background: highlighted ? "rgba(181,130,89,0.08)" : "transparent",
    border: "none",
    borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
    borderLeft: highlighted ? `3px solid ${theme.terra}` : "3px solid transparent",
    padding: "14px 12px 14px 9px", cursor: "pointer",
    display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
  }}>
    <div>
      <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2 }}>
        {b.name}
        {author && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash, marginLeft: 6 }}>· {author}</span>}
      </div>
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.ash, marginTop: 2 }}>
        {b.subtitle}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {b.ingredients.map(ing => INGREDIENTS[ing.id] && (
          <span
            key={ing.id}
            onClick={(e) => {
              e.stopPropagation();
              go("ingredient", ing.id);
            }}
            style={{
              fontFamily: ff.sans, fontSize: 10.5, color: theme.inkSoft, letterSpacing: "0.02em",
              padding: "2px 7px", background: theme.cream, borderRadius: 999, border: `1px solid ${theme.ruleSoft}`,
              cursor: "pointer",
            }}
          >{INGREDIENTS[ing.id].name}</span>
        ))}
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.ink }}>{formatTempShort(b.tempC, b.tempC, unit)}</div>
      <div style={{ fontFamily: ff.mono, fontSize: 10.5, color: theme.ash }}>{mmss(b.timeS)}</div>
    </div>
  </button>
  );
};
