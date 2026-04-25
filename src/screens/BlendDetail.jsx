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
import { BLEND_DIRECTIONS } from "../data/blends";
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

export const BlendDetail = ({ blendId, onClose, onOpenIngredient, onBrew, isSaved, onToggleSave, isFavorite, onToggleFavorite, sessions, go }) => {
  const { unit, weightUnit } = useUnit();
  const b = getBlend(blendId);
  const [openMood, setOpenMood] = React.useState(null);
  const [openTag, setOpenTag] = React.useState(null);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
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
          {onToggleSave ? (
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {isSaved && onToggleFavorite && (
                <button onClick={onToggleFavorite} style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  padding: "4px 6px",
                  fontSize: 18, lineHeight: 1,
                  color: isFavorite ? theme.terra : theme.ash,
                }} title={isFavorite ? "remove from favorites" : "add to favorites"}>
                  {isFavorite ? "♥" : "♡"}
                </button>
              )}
              <button onClick={onToggleSave} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "4px 6px",
                fontSize: 20, lineHeight: 1,
                color: isSaved ? theme.ochre : theme.ash,
              }} title={isSaved ? "remove from shelf" : "save to shelf"}>
                {isSaved ? "★" : "☆"}
              </button>
            </div>
          ) : <div style={{ width: 40 }} />}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            flexShrink: 0,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: theme.ivory, border: `1px solid ${theme.rule}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Flower size={28} c={theme.ochre} />
            </div>
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
          </div>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <h1 style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, margin: 0, lineHeight: 1.05 }}>
              {b.name}
            </h1>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 4, lineHeight: 1.15 }}>
              {b.subtitle}
            </div>

            {/* Signal tag tiles — centered under the name/subtitle column,
                not the full hero, so they read as belonging to the title. */}
            {(() => {
          const caffeineMg = (b.ingredients || []).reduce((sum, ing) => {
            const meta = INGREDIENTS[ing.id];
            return sum + (meta?.caffeine || 0) * (ing.g || 0);
          }, 0);
          const flagged = (b.ingredients || []).some(ing => INGREDIENTS[ing.id]?.headsUp);
          const tags = [];
          if (caffeineMg > 0) {
            tags.push({
              label: "caffeinated",
              summary: `Contains caffeine — about ${Math.round(caffeineMg)}mg per cup.`,
              body: "Tea-leaf caffeine releases more slowly than coffee thanks to L-theanine, but it still adds up. Avoid late evening if you're caffeine-sensitive.",
              tone: "terra",
              fg: theme.cream, bg: theme.terra, border: theme.terra,
            });
          }
          if (b.style === "low-temp") {
            tags.push({
              label: "low-temp",
              summary: "Brewed cooler than a Western steep.",
              body: "Japanese green-tea and yerba-mate traditions — the lower temperature is what keeps the cup from going bitter and lets umami / sweetness lead.",
              tone: "sage",
              fg: theme.sageDeep, bg: "transparent", border: theme.sageDeep,
            });
          } else if (b.style === "decoction") {
            tags.push({
              label: "decoction",
              summary: "Long active simmer (15–30 minutes).",
              body: "Roots and bark need a sustained boil to release their character. The recipe knowingly accepts that lighter supporting spices steep past their delicate window.",
              tone: "sage",
              fg: theme.sageDeep, bg: "transparent", border: theme.sageDeep,
            });
          } else if (b.style) {
            tags.push({
              label: b.style,
              summary: `Brew style: ${b.style}.`,
              body: "",
              tone: "sage",
              fg: theme.sageDeep, bg: "transparent", border: theme.sageDeep,
            });
          }
          if (b.tradition) {
            tags.push({
              label: b.tradition,
              summary: `${b.tradition} tradition.`,
              body: "A curated preparation — taught the way it's traditionally made, with brewing parameters and ratios drawn from the source culture.",
              tone: "terra",
              fg: theme.ochre, bg: "transparent", border: theme.ochre,
            });
          }
          if (b.experimental) {
            const isHouse = b.id === "exp-tom-foolery";
            tags.push({
              label: isHouse ? "house staple" : "experiment",
              summary: isHouse ? "Herbanium house signature." : "Algorithmic experiment.",
              body: isHouse
                ? "The one experimental treated as a permanent catalogue staple — undeletable, always present."
                : "The catalog's chemistry suggests this combination but no tradition has codified it. Try, log, judge for yourself.",
              tone: "terra",
              fg: theme.plum, bg: "transparent", border: theme.plum, dashed: true,
            });
          }
          if (flagged) {
            tags.push({
              label: "heads-up",
              summary: "Caution — at least one ingredient has a heads-up note.",
              body: "Common reasons: drug interactions, pregnancy concerns, sedative effects, blood-pressure shifts. Open any ingredient with a flagged badge to read its specific note.",
              tone: "terra",
              fg: theme.terra, bg: "transparent", border: theme.terra, dashed: true,
            });
          }
          if (tags.length === 0) return null;
          const open = openTag != null ? tags[openTag] : null;
          return (
            <>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 5,
                justifyContent: "center", marginTop: 10,
              }}>
                {tags.map((t, i) => {
                  const active = openTag === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setOpenTag(prev => prev === i ? null : i)}
                      style={{
                        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: t.fg, background: t.bg,
                        border: `1px ${t.dashed ? "dashed" : "solid"} ${t.border}`,
                        borderRadius: 3,
                        padding: "3px 8px",
                        cursor: "pointer",
                        boxShadow: active ? `0 0 0 2px ${t.border}33` : "none",
                      }}
                    >{t.label}</button>
                  );
                })}
              </div>
              {open && (
                <div style={{ textAlign: "left", marginTop: 4 }}>
                  <VocabInfoCard
                    term={open.label}
                    summary={open.summary}
                    body={open.body}
                    tone={open.tone}
                    onClose={() => setOpenTag(null)}
                  />
                </div>
              )}
            </>
          );
            })()}
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

        {/* Directions — tradition-specific steps when curated, generic
            template otherwise. Expandable; collapsed by default to keep
            the page scannable. */}
        {(() => {
          const tradSteps = BLEND_DIRECTIONS[b.id];
          const tempLabel = formatTempRange(b.tempC, b.tempC, unit);
          const minutes = Math.round((b.timeS || 0) / 60);
          const timeLabel = minutes >= 1
            ? `${minutes} minute${minutes !== 1 ? "s" : ""}`
            : `${b.timeS} seconds`;
          const fallbackSteps = [
            `Heat water to ${tempLabel}.`,
            `Use the gram amounts in the recipe above (or about 1–2 teaspoons of blend per ${b.ml || 250}ml).`,
            `Steep covered for ${timeLabel}.`,
            "Strain into your cup. Inhale before sipping.",
          ];
          const steps = tradSteps || fallbackSteps;
          const sourceLabel = tradSteps
            ? (b.tradition ? `${b.tradition} preparation` : "house preparation")
            : "simple steep";
          return (
            <div style={{ margin: "22px 0 10px" }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDirectionsOpen(o => !o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDirectionsOpen(o => !o);
                  }
                }}
                style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8,
                  cursor: "pointer", userSelect: "none",
                }}
              >
                <SectionLabel n="ii">Directions</SectionLabel>
                <span style={{
                  display: "flex", alignItems: "baseline", gap: 6,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                }}>
                  <span>{sourceLabel}</span>
                  <span style={{
                    fontFamily: ff.sans, fontSize: 10, color: theme.ash,
                    transition: "transform 0.15s ease",
                    transform: directionsOpen ? "rotate(90deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>▸</span>
                </span>
              </div>
              {directionsOpen && (
                <ol style={{
                  marginTop: 10, marginLeft: "auto", marginRight: "auto",
                  maxWidth: 360,
                  padding: "12px 16px 12px 32px", borderRadius: 8,
                  background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                  fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
                  lineHeight: 1.55, textAlign: "left",
                }}>
                  {steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: i === steps.length - 1 ? 0 : 6 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })()}

        {/* Brewing — interactive explorer */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="iii">Brewing</SectionLabel>
        </div>
        <BlendExtractionExplorer
          ingredients={b.ingredients}
          defaultTempC={b.tempC}
          defaultTimeS={b.timeS}
          curated
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
          <SectionLabel n="iv">Your log with this blend</SectionLabel>
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
