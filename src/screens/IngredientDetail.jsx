/* ──────────────────────────────────────────────────────────────
   screens/IngredientDetail.jsx — full-screen ingredient detail (Overview/Brewing/Pairings tabs).
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { EffectBar } from "../components/EffectBar";
import { FactsCard } from "../components/FactsCard";
import {
  ExtractionExplorer, hasExtractionProfile,
} from "../components/ExtractionExplorer";
import {
  Flower, Leaf, Sprig,
} from "../components/icons";
import {
  SectionLabel, StatCard, VocabInfoCard,
} from "../components/layout";
import { HintCard } from "../components/HintCard";
import { padTempRange, padTimeRange } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { iconBtn, mmss } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import {
  formatTempRange, formatTempShort, useUnit,
} from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: INGREDIENT DETAIL
   ────────────────────────────────────────────────────────────── */

export const IngredientDetail = ({ id, onClose, pantryIds, togglePantry, onOpenIngredient, ingredientHintShown, dismissIngredientHint }) => {
  const { unit, weightUnit } = useUnit();
  const ing = INGREDIENTS[id] || INGREDIENTS.chamomile;
  const [tab, setTab] = useState("overview");
  // Click-to-expand description cards. null = closed; clicking the same
  // term again closes; clicking a different term swaps the card.
  const [openEffect, setOpenEffect] = useState(null);
  const [openFlavor, setOpenFlavor] = useState(null);
  const [openIntent, setOpenIntent] = useState(null);
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

            <div style={{ margin: "22px 0 14px" }}><SectionLabel n="i">Effect</SectionLabel></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ing.effects.map(([tag, n]) => {
                const known = !!EFFECT_DESCRIPTIONS[tag];
                const active = openEffect === tag;
                return (
                  <div
                    key={tag}
                    role={known ? "button" : undefined}
                    tabIndex={known ? 0 : undefined}
                    onClick={known ? () => setOpenEffect(prev => prev === tag ? null : tag) : undefined}
                    onKeyDown={known ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenEffect(prev => prev === tag ? null : tag);
                      }
                    } : undefined}
                    style={{
                      padding: "4px 6px", borderRadius: 6,
                      background: active ? "rgba(98, 124, 92, 0.10)" : "transparent",
                      cursor: known ? "pointer" : "default",
                      outline: "none",
                    }}
                  >
                    <EffectBar label={tag} value={n} color={theme.sage} />
                  </div>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ing.flavors.map(f => {
                const known = !!FLAVOR_DESCRIPTIONS[f];
                const active = openFlavor === f;
                return (
                  <button
                    key={f}
                    onClick={() => known && setOpenFlavor(prev => prev === f ? null : f)}
                    disabled={!known}
                    style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                      color: active ? theme.cream : theme.terra,
                      padding: "4px 10px", borderRadius: 999,
                      background: active ? theme.terra : theme.cream,
                      border: `1px solid ${active ? theme.terra : theme.rule}`,
                      cursor: known ? "pointer" : "default",
                    }}
                  >{f}</button>
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
            {/* Interactive explorer — only for ingredients with mock data yet */}
            {hasExtractionProfile(id) && (
              <ExtractionExplorer
                ingredientId={id}
                tempCRange={padTempRange(ing.tempC)}
                timeSRange={padTimeRange(ing.timeS)}
              />
            )}

            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <StatCard label="Water" value={formatTempRange(ing.tempC[0], ing.tempC[1], unit)} />
              <StatCard label="Steep" value={`${Math.round(ing.timeS[0]/60)}–${Math.round(ing.timeS[1]/60)} min`} />
              <StatCard label="Caffeine" value={ing.caffeine > 0 ? `${ing.caffeine} mg` : "none"} />
            </div>

            <SectionLabel n="i">Brew for a different effect</SectionLabel>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {(ing.variants || [
                { intent: "calm",       tempC: ing.tempC[0], timeS: ing.timeS[0], note: "Light steep for a softer cup." },
                { intent: "everyday",   tempC: ing.tempC[1], timeS: Math.round((ing.timeS[0]+ing.timeS[1])/2), note: "Balanced standard." },
                { intent: "full",       tempC: ing.tempC[1], timeS: ing.timeS[1], note: "Fuller effect, slightly more bitter." },
              ]).map((v, i) => {
                const known = !!EFFECT_DESCRIPTIONS[v.intent];
                return (
                  <div key={i} style={{
                    padding: 14, borderRadius: 10,
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
                        for{" "}
                        {known ? (
                          <button
                            onClick={() => setOpenIntent(prev => prev === v.intent ? null : v.intent)}
                            style={{
                              background: openIntent === v.intent ? "rgba(176, 84, 47, 0.10)" : "transparent",
                              border: "none", padding: "0 4px", borderRadius: 4,
                              fontFamily: ff.serif, fontSize: 17, fontStyle: "italic",
                              color: theme.terra, cursor: "pointer",
                            }}
                          >{v.intent}</button>
                        ) : (
                          <em style={{ color: theme.terra }}>{v.intent}</em>
                        )}
                      </div>
                      <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.ash }}>
                        {formatTempShort(v.tempC, v.tempC, unit)} · {mmss(v.timeS)}
                      </div>
                    </div>
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.inkSoft, marginTop: 4 }}>
                      {v.note}
                    </div>
                  </div>
                );
              })}
            </div>
            {openIntent && EFFECT_DESCRIPTIONS[openIntent] && (
              <VocabInfoCard
                term={openIntent}
                summary={EFFECT_DESCRIPTIONS[openIntent].summary}
                body={EFFECT_DESCRIPTIONS[openIntent].body}
                tone="terra"
                onClose={() => setOpenIntent(null)}
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
