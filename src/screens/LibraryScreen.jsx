/* ──────────────────────────────────────────────────────────────
   screens/LibraryScreen.jsx — Apothecary tab: ingredient catalog only.
   Saved blends and Journal/check-ins moved to Compose > Shelf.
   Also exports LibraryList and BlendListRow used by ComposeScreen.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import {
  Flower, Leaf, Sprig, MOOD_ICONS,
} from "../components/icons";
import {
  ChipRows, SectionLabel,
} from "../components/layout";
import { INGREDIENTS } from "../data/ingredients";
import { FLAVOR_FAMILY_CHIPS } from "../data/blends";
import { FAMILY_BY_FLAVOR } from "../components/FlavorMap";
import {
  ff, theme,
} from "../theme";
import { mmss } from "../helpers/misc";
import { PantryHintCard } from "../components/PantryHintCard";
import {
  formatTempShort, useUnit,
} from "../units/units";

// Tea sub-styles, used for the conditional sub-pill row when category=teas.
// Subcategory keys must match the values stored on each ingredient
// (see src/data/ingredients.js) — the filter compares strings exactly.
const TEA_SUBCATEGORIES = ["green", "black", "white", "oolong", "pu-erh"];

// Effects offered as filter chips. Subset of MOODS; matches an ingredient
// when it lists the effect at strength ≥ 3.
const EFFECT_FILTERS = [
  "calm", "focus", "energy", "sleepy", "comfort",
  "soothing", "warming", "cooling", "digestive",
];

// Category color — anchors each ingredient card with a left-edge
// strip in its family's hue. Mirrors the icon color so the card
// reads as one visual unit. Falls back to ash for unknown categories.
const categoryColor = (cat, theme) => {
  switch (cat) {
    case "flower":    return theme.ochre;
    case "herbal":    return theme.sage;
    case "true tea":  return theme.sageDeep;
    case "spice":     return theme.terra;
    case "adaptogen": return theme.plum;
    default:          return theme.ash;
  }
};

export const LibraryScreen = ({ go, pantryIds, togglePantry, pantryHintShown, dismissPantryHint, defaultPantryOnly = false, hideHeader = false, hidePantryToggle = false }) => {
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfCategory, setShelfCategory] = useState("all");
  const [pantryOnly, setPantryOnly] = useState(defaultPantryOnly);
  const [caffeineFilter, setCaffeineFilter] = useState("any"); // any | free | has
  const [effectFilter, setEffectFilter] = useState("any");
  const [teaSubcategory, setTeaSubcategory] = useState("all");
  // Flavor sub-filter — multi-select families. Empty = no constraint;
  // any selection narrows to ingredients whose flavors map to one of
  // the selected family keys via FAMILY_BY_FLAVOR. Same chip set as
  // the Recipes screen so the two surfaces share filter vocabulary.
  const [flavorFamilies, setFlavorFamilies] = useState([]);
  // "More filters" disclosure — applied on both Cabinet and Herbanium
  // surfaces. The default at-rest layout (search + category chips)
  // covers the most common browse intent; caffeine, effect, and flavor
  // narrow further only when the user wants to dig in.
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const toggleFlavorFamily = (fam) =>
    setFlavorFamilies(prev => prev.includes(fam)
      ? prev.filter(x => x !== fam)
      : [...prev, fam]);
  // Remove-from-cabinet confirmation. When pantryOnly is on the toggle
  // reads as "remove" rather than "add" (the X icon replaces the check),
  // and pulling something out of the cabinet by accident means walking
  // back to the full herbanium to find it again. The "are you sure?"
  // gate keeps a stray tap from costing the user that trip.
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // All ingredients, filtered then sorted alphabetically by display name.
  const shelfItems = Object.entries(INGREDIENTS)
    .filter(([id, ing]) => {
      if (pantryOnly && !pantryIds.has(id)) return false;
      // "fruit" is a virtual category — collects everything fruit-
      // adjacent regardless of where it lives in the data: cranberry
      // and dried-apple (herbal/fruit), the citrus peels (herbal/peel),
      // and hibiscus (botanically a calyx, classified as flower but
      // tastes and pairs as a fruit). Keeps the data model stable
      // while giving the user one filter for "anything fruity."
      if (shelfCategory === "fruit") {
        const isFruit = ing.subcategory === "fruit"
          || ing.subcategory === "peel"
          || id === "hibiscus";
        if (!isFruit) return false;
      } else if (shelfCategory !== "all" && ing.category !== shelfCategory) {
        return false;
      }
      if (shelfCategory === "true tea" && teaSubcategory !== "all"
          && ing.subcategory !== teaSubcategory) return false;
      if (caffeineFilter === "free" && (ing.caffeine || 0) > 0) return false;
      if (caffeineFilter === "has"  && (ing.caffeine || 0) === 0) return false;
      if (effectFilter !== "any") {
        const eff = (ing.effects || []).find(([t]) => t === effectFilter);
        if (!eff || eff[1] < 3) return false;
      }
      if (flavorFamilies.length > 0) {
        const fams = new Set(flavorFamilies);
        const ingFlavors = ing.flavors || [];
        const hit = ingFlavors.some(fl => {
          const fam = FAMILY_BY_FLAVOR[fl] || fl;
          return fams.has(fam) || fams.has(fl);
        });
        if (!hit) return false;
      }
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
      {!hideHeader && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel n="i">The Apothecary</SectionLabel>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
            color: theme.ash, marginTop: 4, lineHeight: 1.5,
          }}>
            Every leaf, flower, root, and bark Herbanium tracks. Tap any to read its profile.
          </div>
        </div>
      )}

      <>
        {/* Search input — placeholder reflects whether the user is
            browsing the full herbanium or filtering down to their own
            cabinet via the toggle below. */}
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 12px", borderRadius: 10,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            boxShadow: "0 1px 2px rgba(30,24,18,0.04)",
            marginBottom: 12,
          }}>
            <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
            <input
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              placeholder={pantryOnly ? "search your cabinet…" : "search the herbanium…"}
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

          {/* Category filter pills — spread to edges */}
          <div style={{ marginBottom: 8 }}>
            <ChipRows
              items={[
                ["all",       "all"],
                ["true tea",  "teas"],
                ["herbal",    "herbals"],
                ["flower",    "flowers"],
                ["fruit",     "fruits"],
                ["spice",     "spices"],
                ["adaptogen", "adaptogens"],
              ]}
              gap={4}
              rowGap={4}
              maxPerRow={6}
              align="spread"
              renderItem={([key, label]) => {
                const active = shelfCategory === key;
                return (
                  <button key={key} onClick={() => setShelfCategory(key)} style={{
                    fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                    padding: "4px 10px", borderRadius: 999,
                    border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                    background: active ? theme.ink : "transparent",
                    color: active ? theme.cream : theme.ash,
                    cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                    boxShadow: active ? "0 2px 6px -1px rgba(30,24,18,0.20)" : "0 1px 2px rgba(30,24,18,0.05)",
                    transition: "all 0.18s ease",
                  }}>{label}</button>
                );
              }}
            />
          </div>

          {/* Tea sub-style pills — only when teas selected */}
          {shelfCategory === "true tea" && (
            <div style={{ marginBottom: 8 }}>
              <ChipRows
                items={["all", ...TEA_SUBCATEGORIES]}
                gap={4}
                rowGap={4}
                maxPerRow={6}
                align="spread"
                renderItem={(key) => {
                  const active = teaSubcategory === key;
                  return (
                    <button key={key} onClick={() => setTeaSubcategory(key)} style={{
                      fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.02em",
                      padding: "3px 10px", borderRadius: 999,
                      border: `1px solid ${active ? theme.terra : theme.ruleSoft}`,
                      background: active ? theme.terra : "transparent",
                      color: active ? theme.cream : theme.ash,
                      cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                      boxShadow: active ? "0 2px 6px -1px rgba(176,84,47,0.28)" : "0 1px 2px rgba(30,24,18,0.05)",
                      transition: "all 0.18s ease",
                    }}>{key}</button>
                  );
                }}
              />
            </div>
          )}

          {/* Sub-filter rows (caffeine / effect / flavor). On the
              Cabinet (pantryOnly) view these collapse behind
              a "more filters" disclosure to match the Recipes page;
              on the Herbanium they stay flat because browsing the
              full reference benefits from seeing every axis at rest. */}
          {(() => {
            const caffeineRow = (
              <div key="caffeine" style={{ marginBottom: 8 }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 6,
                }}>caffeine</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["any", "any"], ["free", "caffeine-free"], ["has", "caffeinated"]].map(([key, label]) => {
                    const active = caffeineFilter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCaffeineFilter(key)}
                        style={{
                          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                          padding: "5px 10px", borderRadius: 999,
                          border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                          background: active ? theme.ink : "transparent",
                          color: active ? theme.cream : theme.ash,
                          cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                          boxShadow: active ? "0 2px 6px -1px rgba(30,24,18,0.20)" : "0 1px 2px rgba(30,24,18,0.05)",
                          transition: "all 0.18s ease",
                        }}
                      >{label}</button>
                    );
                  })}
                </div>
              </div>
            );

            const effectRow = (
              <div key="effect" style={{ marginBottom: 8 }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 6,
                }}>effect</div>
                <ChipRows
                  items={["any", ...EFFECT_FILTERS]}
                  gap={4}
                  rowGap={4}
                  maxPerRow={5}
                  align="spread"
                  renderItem={(key) => {
                    const active = effectFilter === key;
                    return (
                      <button key={key} onClick={() => setEffectFilter(key)} style={{
                        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                        padding: "4px 10px", borderRadius: 999,
                        border: `1px solid ${active ? theme.sageDeep : theme.ruleSoft}`,
                        background: active ? theme.sageDeep : "transparent",
                        color: active ? theme.cream : theme.ash,
                        cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                        boxShadow: active ? "0 2px 6px -1px rgba(74,87,58,0.30)" : "0 1px 2px rgba(30,24,18,0.05)",
                        transition: "all 0.18s ease",
                      }}>{key === "any" ? "any" : key}</button>
                    );
                  }}
                />
              </div>
            );

            const flavorRow = (
              <div key="flavor" style={{ marginBottom: 10 }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 6,
                }}>flavor</div>
                <ChipRows
                  items={FLAVOR_FAMILY_CHIPS.map(c => [c.family, c.label])}
                  gap={4}
                  rowGap={4}
                  maxPerRow={5}
                  align="spread"
                  renderItem={([key, label]) => {
                    const active = flavorFamilies.includes(key);
                    return (
                      <button key={key} onClick={() => toggleFlavorFamily(key)} style={{
                        fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                        padding: "4px 10px", borderRadius: 999,
                        border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                        background: active ? theme.ink : "transparent",
                        color: active ? theme.cream : theme.ash,
                        cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                        boxShadow: active ? "0 2px 6px -1px rgba(30,24,18,0.20)" : "0 1px 2px rgba(30,24,18,0.05)",
                        transition: "all 0.18s ease",
                      }}>{label.toLowerCase()}</button>
                    );
                  }}
                />
              </div>
            );

            const subFilterRows = [caffeineRow, effectRow, flavorRow];

            // Disclosure applies on both Cabinet and Herbanium so the
            // filter strip lands compact at rest on either surface.
            const activeCount =
              (caffeineFilter !== "any" ? 1 : 0)
              + (effectFilter !== "any" ? 1 : 0)
              + (flavorFamilies.length > 0 ? 1 : 0);
            return (
              <>
                <button
                  onClick={() => setFiltersExpanded(v => !v)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    marginTop: 2, marginBottom: filtersExpanded ? 8 : 4,
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                    color: theme.inkSoft, background: "transparent",
                    border: "none", padding: "4px 0", cursor: "pointer",
                  }}
                >
                  {filtersExpanded ? "less" : "more filters"}
                  {activeCount > 0 && !filtersExpanded && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 16, height: 16, padding: "0 5px",
                      borderRadius: 999, background: theme.terra, color: theme.cream,
                      fontFamily: ff.sans, fontSize: 9, fontWeight: 600,
                    }}>{activeCount}</span>
                  )}
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden
                       style={{
                         transition: "transform 0.18s ease",
                         transform: filtersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                       }}>
                    <path d="M1.5 3 L4.5 6 L7.5 3" stroke={theme.inkSoft}
                          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
                {filtersExpanded && subFilterRows}
              </>
            );
          })()}

          {/* Pantry-only toggle + count. Sits in a quiet meta band
              with a hairline above it so the filters above feel
              wrapped, and the grid below gets a clean header to
              start under. Toggle hidden when the parent surface
              (Shelf · Pantry) already implies pantry-only — the
              toggle would be redundant and misleading. */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 14, marginBottom: 14,
            paddingTop: 10,
            borderTop: `1px solid ${theme.ruleSoft}`,
          }}>
            {hidePantryToggle ? <span /> : (
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
                <span onClick={() => setPantryOnly(!pantryOnly)}>only what's in my cabinet</span>
              </label>
            )}
            <span style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
              textTransform: "uppercase", color: theme.ash,
            }}>
              {pantryOnly
                ? `${shelfItems.length} in cabinet`
                : (<>{shelfItems.length} <span style={{ opacity: 0.55 }}>of {Object.keys(INGREDIENTS).length}</span></>)
              }
            </span>
          </div>

          {/* The catalog grid */}
          {shelfItems.length === 0 ? (
            pantryOnly && pantryIds.size === 0 ? (
              <div style={{
                marginTop: 8, padding: "24px 18px", borderRadius: 12,
                border: `1px dashed ${theme.ruleSoft}`,
                background: theme.cream,
                fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
                lineHeight: 1.55, textAlign: "center",
              }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: theme.ash, marginBottom: 8,
                }}>your cabinet is empty</div>
                <div style={{ fontStyle: "italic", color: theme.ash, marginBottom: 14 }}>
                  Mark what you keep at home so the apothecarium knows what
                  you can actually brew right now.
                </div>
                <button
                  onClick={() => go("apothecary", { mode: "compendium" })}
                  style={{
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "8px 18px", borderRadius: 999,
                    border: `1px solid ${theme.sageDeep}`, background: theme.sageDeep,
                    color: theme.cream, cursor: "pointer",
                  }}
                >open the herbanium</button>
              </div>
            ) : (
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                color: theme.ash, padding: "18px 0", textAlign: "center",
              }}>
                no ingredients match your filters.
              </div>
            )
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              {shelfItems.map(([id, ing]) => {
                const inPantry = pantryIds.has(id);
                const hasCaffeine = (ing.caffeine || 0) > 0;
                const accent = categoryColor(ing.category, theme);
                return (
                  <button key={id} onClick={() => go("ingredient", id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(30,24,18,0.09), 0 1px 2px rgba(30,24,18,0.05)";
                    e.currentTarget.style.borderColor = theme.rule;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(30,24,18,0.04)";
                    e.currentTarget.style.borderColor = theme.ruleSoft;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  style={{
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                    borderRadius: 12, padding: "14px 14px 12px 16px",
                    textAlign: "left", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: 2,
                    position: "relative", overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(30,24,18,0.04)",
                    transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.12s ease",
                  }}>
                    {/* Category-color accent strip on the left edge.
                        Anchors the card to its family at a glance and
                        gives the grid visual variety without adding
                        heavy backgrounds. */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: 3, background: accent, opacity: 0.85,
                    }} />
                    {/* Pantry toggle — three visual states:
                        • Not in pantry (any surface): ghost circle + plus.
                        • In pantry, browsing the Herbanium: sage-filled
                          check (the affirmative "yes, in cabinet" badge).
                        • In pantry, on the Cabinet surface: terra-outline
                          X (the action here is "remove"; reads as a
                          delete affordance, not a status badge).
                        Cabinet remove is gated behind a confirm prompt
                        because adding back costs a trip to the Herbanium. */}
                    {togglePantry && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pantryOnly && inPantry) {
                            setConfirmRemoveId(id);
                          } else {
                            togglePantry(id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            if (pantryOnly && inPantry) {
                              setConfirmRemoveId(id);
                            } else {
                              togglePantry(id);
                            }
                          }
                        }}
                        title={
                          pantryOnly && inPantry
                            ? "remove from cabinet"
                            : inPantry
                              ? "in cabinet — tap to remove"
                              : "tap to add to cabinet"
                        }
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 24, height: 24, borderRadius: "50%",
                          background: pantryOnly && inPantry
                            ? "transparent"
                            : inPantry
                              ? theme.sage
                              : "transparent",
                          border: `1px solid ${
                            pantryOnly && inPantry
                              ? theme.terra
                              : inPantry
                                ? theme.sage
                                : theme.ruleSoft
                          }`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          transition: "background 0.18s ease, border-color 0.18s ease, transform 0.12s ease",
                        }}
                      >
                        {pantryOnly && inPantry ? (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path
                              d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
                              stroke={theme.terra}
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : inPantry ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path
                              d="M2.5 6.2 L5 8.5 L9.5 3.7"
                              stroke={theme.cream}
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path
                              d="M6 2.5 L6 9.5 M2.5 6 L9.5 6"
                              stroke={theme.ash}
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    {/* Header row — just the type icon (and optional
                        CAF pill). Subcategory moved out so the row
                        breathes; it lands bottom-right under the
                        latin name as a quieter footer label. */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 7,
                      paddingRight: togglePantry ? 28 : 0, marginBottom: 4,
                    }}>
                      {ing.category === "flower"    && <Flower size={20} c={accent} />}
                      {ing.category === "herbal"    && <Sprig  size={20} c={accent} />}
                      {ing.category === "true tea"  && <Leaf   size={20} c={accent} />}
                      {ing.category === "spice"     && <Flower size={20} c={accent} />}
                      {ing.category === "adaptogen" && <Sprig  size={20} c={accent} />}
                      {hasCaffeine && (
                        <div title={`caffeine ~${ing.caffeine}mg per cup`} style={{
                          padding: "1px 7px", borderRadius: 999,
                          background: theme.terra, color: theme.cream,
                          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.10em",
                          textTransform: "uppercase", fontWeight: 700,
                        }}>caf</div>
                      )}
                    </div>
                    <div style={{
                      fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                      lineHeight: 1.2, marginTop: 4,
                    }}>
                      {ing.name}
                    </div>
                    {/* Footer row — latin name on the left, subcategory
                        eyebrow tucked to the bottom-right so the type
                        label lands as the card's last visual beat. */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      gap: 8, marginTop: 2,
                    }}>
                      <div style={{
                        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                        color: theme.ash, lineHeight: 1.3, minWidth: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ing.latin}
                      </div>
                      <span style={{
                        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
                        textTransform: "uppercase", color: theme.ash, flexShrink: 0,
                      }}>
                        {ing.subcategory || ing.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {/* Pantry-bottom CTA — when the user's filtered down to their
              cabinet, drop a clear button at the end of the list that
              flips the filter off so the full herbanium appears with
              the plus button on each card to add new ingredients. */}
          {pantryOnly && (
            <button
              onClick={() => setPantryOnly(false)}
              style={{
                marginTop: 16, width: "100%",
                padding: "12px 14px",
                fontFamily: ff.serif, fontSize: 14,
                color: theme.terra,
                background: "transparent",
                border: `1px dashed ${theme.terra}`,
                borderRadius: 10, cursor: "pointer",
              }}
            >Browse the herbanium to add</button>
          )}
      </>

      {/* Cabinet remove confirmation — only fires from the Cabinet
          surface, where adding back means walking to the Herbanium.
          Modal is centered, dim-overlay backed; Cancel is the
          default-weighted action (outline) and Remove is terra-filled
          to read as the destructive choice without screaming. */}
      {confirmRemoveId && (() => {
        const ing = INGREDIENTS[confirmRemoveId];
        const ingName = ing?.name || "this ingredient";
        const close = () => setConfirmRemoveId(null);
        const confirm = () => {
          if (togglePantry) togglePantry(confirmRemoveId);
          setConfirmRemoveId(null);
        };
        return (
          <div
            onClick={close}
            style={{
              position: "fixed", inset: 0, zIndex: 220,
              background: "rgba(30,24,18,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 24px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 380, width: "100%",
                background: theme.cream,
                border: `1px solid ${theme.ruleSoft}`,
                borderRadius: 14, padding: "20px 22px 18px",
                boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.terra, marginBottom: 8,
              }}>remove from cabinet</div>
              <div style={{
                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                lineHeight: 1.45, marginBottom: 6,
              }}>
                Remove <em style={{ color: theme.terra, fontStyle: "normal" }}>{ingName}</em> from your cabinet?
              </div>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                color: theme.ash, lineHeight: 1.5, marginBottom: 16,
              }}>
                You can add it back from the Herbanium reference any time.
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={close}
                  style={{
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "8px 16px", borderRadius: 999,
                    background: "transparent",
                    border: `1px solid ${theme.ruleSoft}`,
                    color: theme.inkSoft, cursor: "pointer",
                  }}
                >cancel</button>
                <button
                  onClick={confirm}
                  style={{
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "8px 16px", borderRadius: 999,
                    background: theme.terra, border: `1px solid ${theme.terra}`,
                    color: theme.cream, cursor: "pointer",
                    boxShadow: "0 2px 6px -1px rgba(176,84,47,0.32)",
                  }}
                >remove</button>
              </div>
            </div>
          </div>
        );
      })()}
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
  // Caffeine summary — total estimated mg in the cup, weighted by gram amount.
  // Used to render a small "caf ~Xmg" badge alongside the blend name when > 0.
  const caffeineMg = (b.ingredients || []).reduce((sum, ing) => {
    const meta = INGREDIENTS[ing.id];
    if (!meta || !meta.caffeine) return sum;
    return sum + meta.caffeine * (ing.g || 0);
  }, 0);
  const caffeineDisplay = caffeineMg > 0 ? Math.round(caffeineMg) : 0;
  return (
  <button
    onClick={handleTap}
    onMouseEnter={(e) => {
      if (highlighted) return;
      e.currentTarget.style.background = "rgba(var(--hi-rgb),0.04)";
    }}
    onMouseLeave={(e) => {
      if (highlighted) return;
      e.currentTarget.style.background = "transparent";
    }}
    style={{
      width: "100%", textAlign: "left",
      background: highlighted ? "rgba(181,130,89,0.08)" : "transparent",
      border: "none",
      borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      borderLeft: highlighted ? `3px solid ${theme.terra}` : "3px solid transparent",
      padding: "14px 14px",
      cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 6,
      transition: "background 0.18s ease",
    }}>
      {/* Eyebrow — author / collection tier (Traditional, Herbanium
          house, your composition, etc.). Quiet ash caps so it reads
          as the cup's lineage without competing with the name. */}
      {author && (
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>{author}</div>
      )}

      {/* Title — main-impact mood sigil + blend name. The sigil
          carries the cup's primary register (calm waves, focus rings,
          warming flame...) as a visual anchor. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, minWidth: 0,
      }}>
        {(() => {
          const Sigil = b.mood && MOOD_ICONS[b.mood];
          if (!Sigil) return null;
          return (
            <span title={`primary impact: ${b.mood}`} style={{ flexShrink: 0, display: "inline-flex" }}>
              <Sigil size={20} c={theme.terra} />
            </span>
          );
        })()}
        <span style={{
          flex: 1, minWidth: 0,
          fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2,
        }}>
          {b.name}
        </span>
      </div>

      {/* Subtitle — italic ash, the curator's quick framing. */}
      {b.subtitle && (
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.ash, lineHeight: 1.4,
        }}>
          {b.subtitle}
        </div>
      )}

      {/* Ingredient chips — minimal: a category-colored dot followed
          by the ingredient name. No bg or border so they read as
          "what's in this cup" rather than as buttons competing for
          tap weight. Each name still routes to its detail page. */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        rowGap: 5, columnGap: 12,
        marginTop: 2,
      }}>
        {b.ingredients.map(ing => INGREDIENTS[ing.id] && (
          <span
            key={ing.id}
            onClick={(e) => {
              e.stopPropagation();
              go("ingredient", ing.id);
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
              cursor: "pointer",
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: categoryColor(INGREDIENTS[ing.id].category, theme),
              flexShrink: 0,
            }} />
            {INGREDIENTS[ing.id].name}
          </span>
        ))}
      </div>

      {/* Bottom meta strip — caffeine on the left, brew params on
          the right, separated by a hairline rule above so the strip
          reads as a labeled band rather than text floating after
          the chips. Mono font keeps the numeric values aligned. */}
      <div style={{
        marginTop: 6, paddingTop: 8,
        borderTop: `1px solid ${theme.ruleSoft}`,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        fontFamily: ff.mono, fontSize: 11, color: theme.ash, letterSpacing: "0.04em",
      }}>
        <span>
          {caffeineDisplay > 0
            ? `caf ~${caffeineDisplay}mg`
            : <span style={{ color: theme.rule }}>caffeine-free</span>}
        </span>
        <span style={{ color: theme.inkSoft }}>
          {formatTempShort(b.tempC, b.tempC, unit)}
          <span style={{ color: theme.rule, margin: "0 6px" }}>·</span>
          {mmss(b.timeS)}
        </span>
      </div>
  </button>
  );
};
