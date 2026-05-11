/* ──────────────────────────────────────────────────────────────
   screens/IngredientDetail.jsx — full-screen ingredient detail (Overview/Brewing/Pairings tabs).
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { EffectBar } from "../components/EffectBar";
import { FactsCard } from "../components/FactsCard";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import { hasExtractionProfile } from "../components/ExtractionExplorer";
import {
  FAMILY_BY_FLAVOR, FAMILY_COLORS,
  FAMILY_BY_EFFECT, EFFECT_FAMILY_COLORS,
} from "../components/FlavorMap";
import {
  Flower, Leaf, Sprig,
} from "../components/icons";
import {
  Button, SectionLabel, VocabInfoCard,
} from "../components/layout";
import { HintCard } from "../components/HintCard";
import { INGREDIENTS } from "../data/ingredients";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import {
  ff, theme,
} from "../theme";

/* ──────────────────────────────────────────────────────────────
   SolidBar — static row mimicking the Brewing-tab strip's band
   shape. Label on the left (right-aligned, fixed-width), single
   solid colored bar on the right filled to value/5. No 5-segment
   blocks, no gradient — just the strip's row architecture
   without the gradient story. Used on the Overview tab so static
   readouts visually match the dynamic strip.
   ────────────────────────────────────────────────────────────── */

const TRACK_H   = 14;
const LABEL_W   = 64;

const SolidBar = ({ label, value, color, selected, onClick }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const fill = v / 5;
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      } : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "2px 0",
        cursor: interactive ? "pointer" : "default",
        outline: "none",
      }}
    >
      <div style={{
        flex: "0 0 auto",
        minWidth: LABEL_W,
        textAlign: "right",
        fontFamily: ff.sans, fontSize: 10,
        color: selected ? theme.ink : theme.inkSoft,
        fontWeight: selected ? 500 : 400,
        textDecoration: selected ? "underline" : "none",
        textDecorationColor: color,
        textDecorationThickness: 1,
        textUnderlineOffset: 2,
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        position: "relative",
        height: TRACK_H,
        borderRadius: 3,
        background: theme.ruleSoft,
        boxShadow: selected
          ? `inset 0 0 0 1.5px ${color}`
          : `inset 0 0 0 1px ${theme.ruleSoft}`,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${fill * 100}%`,
          background: color,
          opacity: 0.85,
          borderRadius: 3,
        }} />
      </div>
      <div style={{
        flex: "0 0 auto",
        fontFamily: ff.mono, fontSize: 9, color: theme.ash,
        minWidth: 18, textAlign: "right",
      }}>
        {v.toFixed(1)}
      </div>
    </div>
  );
};

// Two-column row used in the Overview tab's spec stack — small
// uppercase label on the left, italic-serif value on the right,
// the pair separated so the user can scan rapidly. Used for
// Origin / Form / Shelf life. Kept here rather than in a shared
// component file because IngredientDetail is currently the only
// surface that uses this exact shape.
const SpecRow = ({ label, value }) => (
  <div style={{
    display: "flex", alignItems: "baseline",
    gap: 12,
    minWidth: 0,
  }}>
    <div style={{
      flex: "0 0 84px",
      fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
      textTransform: "uppercase", color: theme.ash,
      lineHeight: 1.5,
    }}>
      {label}
    </div>
    <div style={{
      flex: "1 1 auto", minWidth: 0,
      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
      color: theme.ink, lineHeight: 1.45,
    }}>
      {value}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Screen: INGREDIENT DETAIL
   ────────────────────────────────────────────────────────────── */

export const IngredientDetail = ({ id, onClose, pantryIds, togglePantry, onOpenIngredient, ingredientHintShown, dismissIngredientHint }) => {
  const ing = INGREDIENTS[id] || INGREDIENTS.chamomile;
  const [tab, setTab] = useState("overview");
  // Click-to-expand description cards. null = closed; clicking the same
  // term again closes; clicking a different term swaps the card.
  const [openEffect, setOpenEffect] = useState(null);
  const [openFlavor, setOpenFlavor] = useState(null);
  // Pairing preview — id of a paired ingredient currently being shown
  // in a floating quick-look card. null = no preview open. Lets users
  // peek at a pairing's effects/flavors without leaving this ingredient.
  const [previewPairId, setPreviewPairId] = useState(null);
  const previewIng = previewPairId ? INGREDIENTS[previewPairId] : null;
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: theme.ivory, overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Sticky header row — back button + eyebrow stay pinned at
          the top of the scroll viewport so they're always reachable
          regardless of scroll depth. Opaque ivory bg so content
          scrolling underneath doesn't bleed through; hairline shadow
          fades in on scroll to read the header as a separate layer. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: theme.ivory,
        padding: "10px 22px 8px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: scrolled ? "0 1px 0 rgba(60, 50, 40, 0.08)" : "0 1px 0 rgba(60, 50, 40, 0)",
        transition: "box-shadow 0.18s ease",
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        {/* Eyebrow ('An ingredient') was visually off-center against
            the centered hero below — back button + spacer widths
            don't match — so the bar reads cleaner without it. */}
      </div>

      <div style={{ padding: "0 22px 130px" }}>

      {/* Hero — centered icon-circle + name + latin + category, on
          the same ivory ground as the rest of the screen. Reads as a
          header through typography hierarchy alone, no separate band
          needed. */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, marginTop: 6, marginBottom: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: theme.cream, border: `1px solid ${theme.rule}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {ing.category === "flower"    && <Flower size={34} c={theme.ochre} />}
          {ing.category === "herbal"    && <Sprig  size={34} c={theme.sage} />}
          {ing.category === "true tea"  && <Leaf   size={34} c={theme.sageDeep} />}
          {ing.category === "spice"     && <Flower size={34} c={theme.terra} />}
          {ing.category === "adaptogen" && <Sprig  size={34} c={theme.plum} />}
        </div>
        <div style={{ textAlign: "center", maxWidth: "100%" }}>
          <h1 style={{ fontFamily: ff.serif, fontSize: 30, fontWeight: 400, color: theme.ink, margin: 0, lineHeight: 1.1 }}>
            {ing.name}
          </h1>
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 4, lineHeight: 1.2 }}>
            {ing.latin}
          </div>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.2em",
            textTransform: "uppercase", color: theme.ash, marginTop: 8,
          }}>
            {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
          </div>
          {/* Origin / form / shelf life used to stack here in the hero
              but the column was getting visually heavy. Those fields
              now live in a labeled spec list at the top of the Overview
              tab where the user can scan them more easily without
              competing with the identity stack above. */}
        </div>
      </div>

      {/* Tabs — match the Apothecarium/Journal sub-tab dock pattern
          (sans-uppercase, terra-on-active, weight-shift on active)
          so the IngredientDetail's tabs read as part of the same
          tab system instead of a one-off serif treatment. */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 4,
        borderBottom: `1px solid ${theme.ruleSoft}`,
        marginBottom: 18,
      }}>
        {[
          ["overview", "Overview"],
          ["brewing",  "Brewing"],
          ["pairings", "Pairings"],
        ].map(([k, label]) => {
          const active = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "8px 4px 10px",
              fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: active ? 600 : 500,
              color: active ? theme.terra : theme.inkSoft,
              borderBottom: active
                ? `2px solid ${theme.terra}`
                : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.18s ease, border-color 0.18s ease",
            }}>{label}</button>
          );
        })}
      </div>

      <div>
        {!ingredientHintShown && dismissIngredientHint && (
          <HintCard
            title="Hint"
            body={<>
              Hit the <strong style={{ color: theme.terra }}>Brewing</strong> tab
              to experiment with steep and temp for this ingredient on its own.
            </>}
            onDismiss={dismissIngredientHint}
          />
        )}
        {tab === "overview" && (
          <>
            {/* Spec list — origin, form, shelf life rendered as a
                labeled definition stack above the blurb. Pulled out
                of the hero so the identity column up there stays
                compact; the practical facts the user reaches for
                ("what do I buy / where's it from / how long does
                it keep") live here as a scannable block. Each row
                renders conditionally on field presence, so true
                teas (no form) and any future entries without one
                of the fields don't show empty rows. */}
            {(ing.origin || ing.form || ing.shelfLife) && (
              <div style={{
                marginBottom: 22,
                padding: "12px 14px",
                background: theme.cream,
                border: `1px solid ${theme.ruleSoft}`,
                borderRadius: 10,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {ing.origin && (
                  <SpecRow label="Origin" value={ing.origin} />
                )}
                {ing.form && (
                  <SpecRow label="Form" value={ing.form} />
                )}
                {ing.shelfLife && (
                  <SpecRow label="Shelf life" value={ing.shelfLife} />
                )}
              </div>
            )}

            <p style={{
              fontFamily: ff.serif, fontSize: 15, color: theme.inkSoft,
              lineHeight: 1.65, margin: 0,
              textAlign: "left",
            }}>
              {ing.blurb}
            </p>

            <div style={{ margin: "22px 0 10px" }}><SectionLabel n="i">Effect</SectionLabel></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {ing.effects.map(([tag, n]) => {
                const known = !!EFFECT_DESCRIPTIONS[tag];
                const active = openEffect === tag;
                return (
                  <SolidBar
                    key={tag}
                    label={tag}
                    value={n}
                    color={EFFECT_FAMILY_COLORS[FAMILY_BY_EFFECT[tag]] || theme.sage}
                    selected={active}
                    onClick={known ? () => setOpenEffect(prev => prev === tag ? null : tag) : undefined}
                  />
                );
              })}
            </div>
            {openEffect && EFFECT_DESCRIPTIONS[openEffect] && (
              <VocabInfoCard
                term={openEffect}
                summary={EFFECT_DESCRIPTIONS[openEffect].summary}
                body={EFFECT_DESCRIPTIONS[openEffect].body}
                ladder={EFFECT_DESCRIPTIONS[openEffect].ladder}
                tone="sage"
                onClose={() => setOpenEffect(null)}
              />
            )}

            <div style={{ margin: "22px 0 10px" }}><SectionLabel n="ii">Flavor notes</SectionLabel></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {ing.flavors.map((f, i) => {
                // Position-derived strength: leading flavor at 4,
                // descending to 1 — same convention annotateFlavor-
                // Strengths uses for the standard profile.
                const strength = Math.max(1, 4 - i);
                const known = !!FLAVOR_DESCRIPTIONS[f];
                const active = openFlavor === f;
                const familyColor = FAMILY_COLORS[FAMILY_BY_FLAVOR[f]] || theme.ash;
                return (
                  <SolidBar
                    key={f}
                    label={f}
                    value={strength}
                    color={familyColor}
                    selected={active}
                    onClick={known ? () => setOpenFlavor(prev => prev === f ? null : f) : undefined}
                  />
                );
              })}
            </div>
            {openFlavor && FLAVOR_DESCRIPTIONS[openFlavor] && (
              <VocabInfoCard
                term={openFlavor}
                summary={FLAVOR_DESCRIPTIONS[openFlavor].summary}
                body={FLAVOR_DESCRIPTIONS[openFlavor].body}
                ladder={FLAVOR_DESCRIPTIONS[openFlavor].ladder}
                tone="terra"
                onClose={() => setOpenFlavor(null)}
              />
            )}

            {ing.facts && ing.facts.length > 0 && (
              <>
                <div style={{ margin: "22px 0 10px" }}><SectionLabel n="iii">Did you know</SectionLabel></div>
                <FactsCard facts={ing.facts} />
              </>
            )}

            {ing.headsUp && (
              <div style={{
                marginTop: 22,
                padding: "10px 14px",
                borderLeft: `2px solid ${theme.terra}`,
                background: "rgba(176,84,47,0.05)",
                borderRadius: "2px 8px 8px 2px",
              }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: theme.terra,
                  marginBottom: 4,
                }}>
                  Heads up
                </div>
                <div style={{
                  fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft,
                  lineHeight: 1.55,
                }}>
                  {ing.headsUp}
                </div>
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                  color: theme.ash, marginTop: 6,
                }}>
                  not medical advice
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => togglePantry && togglePantry(id)}
                style={(pantryIds && pantryIds.has(id)) ? {
                  background: "rgba(74,87,58,0.06)",
                  borderColor: theme.sageDeep,
                  color: theme.sageDeep,
                } : {}}
              >
                {pantryIds && pantryIds.has(id) ? "✓ in pantry" : "+ pantry"}
              </Button>
            </div>
          </>
        )}

        {tab === "brewing" && (
          <>
            {/* Interactive explorer — same TrackMap-style strips as
                blend pages, treated as a single-ingredient blend so
                all the engine logic transfers cleanly (per-track
                normalization, family rollup, gauge column, range
                bands, descriptions). Only renders for ingredients
                with extraction profiles; otherwise the strips would
                be empty. */}
            {hasExtractionProfile(id) && (
              <BlendExtractionExplorer
                ingredients={[{ id, g: 1.0 }]}
                defaultTempC={Math.round((ing.tempC[0] + ing.tempC[1]) / 2)}
                defaultTimeS={Math.round((ing.timeS[0] + ing.timeS[1]) / 2)}
              />
            )}

          </>
        )}

        {tab === "pairings" && (
          <>
            <SectionLabel n="i">Pairs well with</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {(ing.pairs || []).map(pid => INGREDIENTS[pid] && (
                <button key={pid} onClick={() => setPreviewPairId(pid)} style={{
                  fontFamily: ff.serif, fontSize: 14, color: theme.inkSoft,
                  padding: "8px 14px", borderRadius: 999,
                  background: theme.cream, border: `1px solid ${theme.rule}`, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {INGREDIENTS[pid].category === "flower"    && <Flower size={14} c={theme.ochre} />}
                  {INGREDIENTS[pid].category === "herbal"    && <Sprig  size={14} c={theme.sage} />}
                  {INGREDIENTS[pid].category === "true tea"  && <Leaf   size={14} c={theme.sageDeep} />}
                  {INGREDIENTS[pid].category === "spice"     && <Flower size={14} c={theme.terra} />}
                  {INGREDIENTS[pid].category === "adaptogen" && <Sprig  size={14} c={theme.plum} />}
                  {INGREDIENTS[pid].name}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 22 }}><SectionLabel n="ii">Traditional pairings</SectionLabel></div>
            <div style={{
              marginTop: 10, padding: 14,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 14, color: theme.inkSoft, lineHeight: 1.6,
            }}>
              Honey, warm milk, a thin sliver of fresh ginger. Paired most historically with lavender
              and lemon balm in European evening tisanes.
            </div>
          </>
        )}
      </div>

      {/* Pairing quick-look — a floating card with the paired
          ingredient's effects + flavor profile. Tapping the backdrop
          or the × dismisses; the user stays on the current ingredient. */}
      {previewIng && (
        <div
          onClick={() => setPreviewPairId(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(40, 30, 20, 0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.ivory,
              borderRadius: 12, maxWidth: 380, width: "100%",
              padding: "20px 22px 22px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
              position: "relative",
              fontFamily: ff.sans,
            }}
          >
            <button
              onClick={() => setPreviewPairId(null)}
              aria-label="close"
              style={{
                position: "absolute", top: 8, right: 12,
                background: "transparent", border: "none", color: theme.ash,
                fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "4px 8px",
              }}
            >×</button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              {previewIng.category === "flower"    && <Flower size={16} c={theme.ochre} />}
              {previewIng.category === "herbal"    && <Sprig  size={16} c={theme.sage} />}
              {previewIng.category === "true tea"  && <Leaf   size={16} c={theme.sageDeep} />}
              {previewIng.category === "spice"     && <Flower size={16} c={theme.terra} />}
              {previewIng.category === "adaptogen" && <Sprig  size={16} c={theme.plum} />}
              <span style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
                textTransform: "uppercase", color: theme.ash,
              }}>
                {previewIng.subcategory || previewIng.category}
              </span>
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1.2 }}>
              {previewIng.name}
            </div>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
              marginTop: 2, marginBottom: 14,
            }}>
              {previewIng.latin}
            </div>

            {(previewIng.effects && previewIng.effects.length > 0) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8,
                }}>Mood profile</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {previewIng.effects.map(([tag, str]) => (
                    <span key={tag} style={{
                      fontFamily: ff.serif, fontSize: 13,
                      padding: "4px 10px", borderRadius: 999,
                      background: theme.cream,
                      border: `1px solid ${theme.ruleSoft}`,
                      color: theme.inkSoft,
                    }}>
                      {tag}{" "}
                      <span style={{ color: theme.ash, fontFamily: ff.mono, fontSize: 11 }}>
                        {"●".repeat(str)}{"○".repeat(Math.max(0, 5 - str))}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(previewIng.flavors && previewIng.flavors.length > 0) && (
              <div>
                <div style={{
                  fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: theme.inkSoft, marginBottom: 8,
                }}>Flavor profile</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {previewIng.flavors.map(f => (
                    <span key={f} style={{
                      fontFamily: ff.serif, fontSize: 13,
                      padding: "4px 10px", borderRadius: 999,
                      background: "transparent",
                      border: `1px solid ${theme.ruleSoft}`,
                      color: theme.inkSoft,
                    }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
