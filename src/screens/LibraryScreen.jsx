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
  ChipRows, SectionLabel,
} from "../components/layout";
import { INGREDIENTS } from "../data/ingredients";
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

export const LibraryScreen = ({ go, pantryIds, togglePantry, pantryHintShown, dismissPantryHint, forcePantryOnly = false, defaultPantryOnly = false, hideHeader = false, hidePantryToggle = false }) => {
  const [shelfSearch, setShelfSearch] = useState("");
  const [shelfCategory, setShelfCategory] = useState("all");
  const [pantryOnly, setPantryOnly] = useState(forcePantryOnly || defaultPantryOnly);
  const [caffeineFilter, setCaffeineFilter] = useState("any"); // any | free | has
  const [effectFilter, setEffectFilter] = useState("any");
  const [teaSubcategory, setTeaSubcategory] = useState("all");

  // Force pantryOnly from parent when this view is hosted inside the
  // Shelf · Pantry sub-tab, where the toggle would be redundant.
  React.useEffect(() => {
    if (forcePantryOnly) setPantryOnly(true);
  }, [forcePantryOnly]);

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
        {/* Search input */}
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

          {/* Caffeine — labeled row, three pills span full width */}
          <div style={{ marginBottom: 8 }}>
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

          {/* Effect filter — labeled row, spread pills */}
          <div style={{ marginBottom: 10 }}>
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
              {shelfItems.length} <span style={{ opacity: 0.55 }}>of {Object.keys(INGREDIENTS).length}</span>
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
                    {/* Pantry toggle — clean circular tap target in
                        the top-right. Empty state uses a soft outline
                        ring (no dashed edge) so it reads as a quiet
                        affordance rather than an unfinished button. */}
                    {togglePantry && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); togglePantry(id); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePantry(id);
                          }
                        }}
                        title={inPantry ? "in cabinet — tap to remove" : "tap to add to cabinet"}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 22, height: 22, borderRadius: "50%",
                          background: inPantry ? theme.sage : "transparent",
                          border: `1px solid ${inPantry ? theme.sage : theme.ruleSoft}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: inPantry ? theme.cream : theme.ash,
                          fontSize: 13, fontWeight: 600, lineHeight: 1,
                          cursor: "pointer",
                          transition: "background 0.15s ease, border-color 0.15s ease",
                        }}
                      >{inPantry ? "✓" : "+"}</div>
                    )}
                    {/* Header row — type icon (with optional CAF pill
                        beside it) on the left; subcategory eyebrow on
                        the right. Both anchor in the same baseline so
                        the row reads as a unit. */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingRight: togglePantry ? 28 : 0, marginBottom: 4,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
                      <span style={{
                        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
                        textTransform: "uppercase", color: theme.ash,
                      }}>
                        {ing.subcategory || ing.category}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                      lineHeight: 1.2, marginTop: 4,
                    }}>
                      {ing.name}
                    </div>
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                      color: theme.ash, marginTop: 2, lineHeight: 1.3,
                    }}>
                      {ing.latin}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {/* Pantry-bottom CTA — when the user's looking at their pantry
              (pantryOnly = true) and the toggle isn't forced on, drop a
              clear button at the end of the list that flips the filter
              off so the full ingredient library appears with + buttons. */}
          {pantryOnly && !forcePantryOnly && (
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
            >Add ingredients?</button>
          )}
      </>
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
      <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{b.name}</span>
        {caffeineDisplay > 0 && (
          <span title={`~${caffeineDisplay}mg caffeine per cup`} style={{
            fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.08em",
            textTransform: "uppercase", fontWeight: "bold",
            padding: "1px 6px", borderRadius: 999,
            background: theme.terra, color: theme.cream,
          }}>caf</span>
        )}
        {author && <span style={{ fontStyle: "italic", fontSize: 12, color: theme.ash }}>· {author}</span>}
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
