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
  SectionLabel, VocabInfoCard,
} from "../components/layout";
import { HintCard } from "../components/HintCard";
import { INGREDIENTS } from "../data/ingredients";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { iconBtn } from "../helpers/misc";
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

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 18px",
        borderBottom: `1px solid ${theme.rule}`,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            flexShrink: 0,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: theme.ivory, border: `1px solid ${theme.rule}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {ing.category === "flower"    && <Flower size={34} c={theme.ochre} />}
              {ing.category === "herbal"    && <Sprig  size={34} c={theme.sage} />}
              {ing.category === "true tea"  && <Leaf   size={34} c={theme.sageDeep} />}
              {ing.category === "spice"     && <Flower size={34} c={theme.terra} />}
              {ing.category === "adaptogen" && <Sprig  size={34} c={theme.plum} />}
            </div>
            <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash, textAlign: "center" }}>
              {ing.category}{ing.subcategory && ` · ${ing.subcategory}`}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1 style={{ fontFamily: ff.serif, fontSize: 32, fontWeight: 400, color: theme.ink, margin: 0, lineHeight: 1.05 }}>
              {ing.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 4, lineHeight: 1.15 }}>
              {ing.latin}
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 16, marginTop: 18, borderBottom: `1px solid ${theme.ruleSoft}` }}>
          {[
            ["overview", "Overview"],
            ["brewing",  "Brewing"],
            ["pairings", "Pairings"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: "transparent", border: "none",
              fontFamily: ff.serif, fontSize: 14, color: tab === k ? theme.ink : theme.ash,
              padding: "6px 0 10px", cursor: "pointer",
              borderBottom: tab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 22px 130px" }}>
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
            <p style={{
              fontFamily: ff.serif, fontSize: 15.5, color: theme.inkSoft,
              lineHeight: 1.6, margin: 0,
              textAlign: "left", textIndent: "1.4em",
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
                marginTop: 22, padding: 12, borderRadius: 10,
                background: "rgba(176, 84, 47, 0.07)",
                border: `1px solid rgba(176, 84, 47, 0.2)`,
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: theme.terra, color: theme.cream,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: ff.serif, fontSize: 12, fontStyle: "italic", flexShrink: 0,
                }}>!</div>
                <div>
                  <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.terra }}>
                    Heads up
                  </div>
                  <div style={{ fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft, marginTop: 3, lineHeight: 1.5 }}>
                    {ing.headsUp}
                  </div>
                  <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginTop: 4 }}>
                    (not medical advice)
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <button
                onClick={() => togglePantry && togglePantry(id)}
                style={{
                  ...iconBtn(),
                  width: "100%",
                  background: pantryIds && pantryIds.has(id) ? theme.cream : "transparent",
                  borderColor: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.rule,
                  color: pantryIds && pantryIds.has(id) ? theme.sageDeep : theme.inkSoft,
                }}
              >
                {pantryIds && pantryIds.has(id) ? "✓ in pantry" : "+ pantry"}
              </button>
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
  );
};
