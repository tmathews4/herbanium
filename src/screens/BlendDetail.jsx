/* ──────────────────────────────────────────────────────────────
   screens/BlendDetail.jsx — full-screen blend detail page.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import {
  Flower, Kettle,
} from "../components/icons";
import {
  SectionLabel, VocabInfoCard,
} from "../components/layout";
import { INGREDIENTS } from "../data/ingredients";
import {
  EFFECT_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { getBlend } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import {
  formatAmount, formatTempRange, useUnit,
} from "../units/units";

/* ──────────────────────────────────────────────────────────────
   Screen: BLEND DETAIL (overlay)
   Opens when a session card or blend link is tapped. Shows the
   recipe, brewing params, effect prediction, and — if opened from
   a friend's session — their review in a pull-quote up top.
   ────────────────────────────────────────────────────────────── */

export const BlendDetail = ({ blendId, onClose, onOpenIngredient, onBrew, isFavorite, onToggleFavorite, sessions, go }) => {
  const { unit, weightUnit } = useUnit();
  const b = getBlend(blendId);
  const [openMood, setOpenMood] = React.useState(null);
  if (!b) return null;

  // Filter the user's sessions for this specific blend. These become
  // the "Your log with this blend" section — aggregate stats + recent notes.
  const mySessions = (sessions || []).filter(s => s.who === "you" && s.blendId === blendId);
  const brewCount = mySessions.length;
  const avgTaste = brewCount > 0
    ? Math.round((mySessions.reduce((a, s) => a + (s.taste || 0), 0) / brewCount) * 10) / 10
    : 0;

  // Find the most common "actual" outcome across your brews. For single-mood
  // actuals this is easy; for comma-joined actuals we split and tally.
  const actualTally = {};
  mySessions.forEach(s => {
    (s.actual || "").split(",").map(x => x.trim()).filter(Boolean).forEach(a => {
      actualTally[a] = (actualTally[a] || 0) + 1;
    });
  });
  const topActual = Object.entries(actualTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  const intentTally = {};
  mySessions.forEach(s => {
    if (s.intent) intentTally[s.intent] = (intentTally[s.intent] || 0) + 1;
  });
  const topIntent = Object.entries(intentTally).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
    }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.cream} 0%, ${theme.paper} 100%)`,
        padding: "22px 22px 20px",
        borderBottom: `1px solid ${theme.rule}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>← back</button>
          <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            The Blend
          </div>
          {onToggleFavorite ? (
            <button onClick={onToggleFavorite} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 6px",
              fontSize: 20, lineHeight: 1,
              color: isFavorite ? theme.ochre : theme.ash,
            }} title={isFavorite ? "remove from favorites" : "add to favorites"}>
              {isFavorite ? "★" : "☆"}
            </button>
          ) : <div style={{ width: 40 }} />}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Flower size={28} c={theme.ochre} />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {EFFECT_DESCRIPTIONS[b.mood] ? (
                <button
                  onClick={() => setOpenMood(prev => prev === b.mood ? null : b.mood)}
                  style={{
                    background: openMood === b.mood ? "rgba(98, 124, 92, 0.10)" : "transparent",
                    border: "none", padding: "2px 6px", borderRadius: 4,
                    fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: theme.ash, cursor: "pointer",
                  }}
                >
                  for {b.mood} <span style={{ fontSize: 9, color: theme.sageDeep }}>ⓘ</span>
                </button>
              ) : (
                <span style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                  for {b.mood}
                </span>
              )}
              {b.tradition && (
                <span style={{
                  fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: theme.ochre, border: `1px solid ${theme.ochre}`, borderRadius: 3,
                  padding: "1px 6px",
                }}>{b.tradition}</span>
              )}
            </div>
            <h1 style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, margin: "2px 0 0", lineHeight: 1.05 }}>
              {b.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 3 }}>
              {b.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 32px" }}>
        {openMood && EFFECT_DESCRIPTIONS[openMood] && (
          <div style={{ marginBottom: 18 }}>
            <VocabInfoCard
              term={openMood}
              summary={EFFECT_DESCRIPTIONS[openMood].summary}
              body={EFFECT_DESCRIPTIONS[openMood].body}
              tone="sage"
              onClose={() => setOpenMood(null)}
            />
          </div>
        )}

        {/* Ingredients */}
        <SectionLabel n="i">The recipe</SectionLabel>
        <div style={{
          marginTop: 10, padding: "4px 14px", borderRadius: 10,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
        }}>
          {b.ingredients.map((ing, i) => {
            const meta = INGREDIENTS[ing.id];
            if (!meta) return null;
            // Compact metadata line: temp range, top 2 flavors, top effect
            const topFlavors = (meta.flavors || []).slice(0, 2).join(", ");
            const topEffect = (meta.effects || []).filter(([t]) => t !== "bitterness")[0];
            const metaParts = [
              formatTempRange(meta.tempC[0], meta.tempC[1], unit),
              topFlavors,
              topEffect ? `${topEffect[0]} ${topEffect[1]}` : null,
            ].filter(Boolean);
            return (
              <button key={ing.id} onClick={() => onOpenIngredient(ing.id)} style={{
                width: "100%", textAlign: "left", background: "transparent",
                border: "none", borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                padding: "10px 0", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                    {meta.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                  </div>
                  <div style={{
                    fontFamily: ff.sans, fontSize: 10.5, color: theme.ash,
                    marginTop: 2, letterSpacing: "0.02em",
                  }}>
                    {metaParts.join(" · ")}
                  </div>
                </div>
                <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft, flexShrink: 0, marginLeft: 12 }}>
                  {formatAmount(ing.g, meta.category, weightUnit)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Brewing — interactive explorer */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="ii">Brewing</SectionLabel>
        </div>
        <BlendExtractionExplorer
          ingredients={b.ingredients}
          defaultTempC={b.tempC}
          defaultTimeS={b.timeS}
        />
        {b.ml && (
          <div style={{
            marginTop: 8,
            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.1em",
            textTransform: "uppercase", color: theme.ash, textAlign: "right",
          }}>
            Volume · {b.ml} ml
          </div>
        )}

        {/* Your log with this blend — aggregates + recent sessions */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="iii">Your log with this blend</SectionLabel>
        </div>
        {brewCount === 0 ? (
          <div style={{
            padding: "16px 18px", borderRadius: 10,
            background: theme.cream, border: `1px dashed ${theme.ruleSoft}`,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, textAlign: "center",
          }}>
            No log for this blend yet.<br />
            Brew it and your notes will live here.
          </div>
        ) : (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          }}>
            {/* Aggregate stats — one quiet line */}
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
              color: theme.inkSoft, lineHeight: 1.5,
              paddingBottom: brewCount > 1 ? 10 : 0,
              borderBottom: brewCount > 1 ? `1px solid ${theme.ruleSoft}` : "none",
              marginBottom: brewCount > 1 ? 10 : 0,
            }}>
              {brewCount === 1 ? (
                <>Brewed once.</>
              ) : (
                <>
                  Brewed {brewCount} times · average{" "}
                  <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                    {"●".repeat(Math.round(avgTaste))}
                    <span style={{ color: theme.rule }}>{"●".repeat(5 - Math.round(avgTaste))}</span>
                  </span>
                  {topIntent && topActual && (
                    <>
                      {" "}· usually lands <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{topActual}</span>
                      {" "}after <span style={{ color: theme.plum, fontStyle: "normal" }}>"{topIntent}"</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Recent sessions — up to 3 most recent */}
            <div>
              {mySessions.slice(0, 3).map((s, i) => (
                <div key={s.id} style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
                  }}>
                    <div style={{ fontSize: 11.5, color: theme.ash, letterSpacing: "0.03em", minWidth: 0 }}>
                      <span style={{ fontStyle: "italic", fontFamily: ff.serif }}>{s.intent}</span>
                      <span style={{ margin: "0 5px", color: theme.rule }}>→</span>
                      <span style={{ color: theme.sageDeep }}>{s.actual}</span>
                      <span style={{ margin: "0 8px", color: theme.rule }}>·</span>
                      <span style={{ color: theme.terra, letterSpacing: "0.1em" }}>
                        {"●".repeat(s.taste)}<span style={{ color: theme.rule }}>{"●".repeat(5 - s.taste)}</span>
                      </span>
                    </div>
                    <span style={{ fontFamily: ff.sans, fontSize: 10, color: theme.ash, letterSpacing: "0.08em", flexShrink: 0 }}>
                      {s.ago}
                    </span>
                  </div>
                  {s.note && (
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                      color: theme.inkSoft, lineHeight: 1.4,
                      paddingLeft: 8, borderLeft: `2px solid ${theme.ruleSoft}`,
                    }}>
                      "{s.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* See all link — only if there are more than 3 */}
            {mySessions.length > 3 && go && (
              <button onClick={() => { onClose(); go("library"); }} style={{
                marginTop: 4, width: "100%",
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                cursor: "pointer", padding: "8px 0 0",
                textAlign: "right",
              }}>
                see all {mySessions.length} in Apothecary →
              </button>
            )}
          </div>
        )}

        <button onClick={onBrew} style={{
          marginTop: 22, width: "100%",
          fontFamily: ff.serif, fontSize: 17,
          padding: "14px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 8px 24px -12px rgba(30,24,18,0.4)",
        }}>
          <Kettle size={20} c={theme.cream} />
          Brew this cup →
        </button>
      </div>
    </div>
  );
};
