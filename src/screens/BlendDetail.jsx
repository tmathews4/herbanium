/* ──────────────────────────────────────────────────────────────
   screens/BlendDetail.jsx — full-screen blend detail page.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import {
  Flower, Kettle, MOOD_ICONS,
} from "../components/icons";
import {
  Button, SectionLabel, VocabInfoCard, FitOneLine,
} from "../components/layout";
import { INGREDIENTS } from "../data/ingredients";
import { BLEND_DIRECTIONS, BLEND_SOURCES, BLEND_TABLE_ACCENTS } from "../data/blends";
import {
  EFFECT_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { getBlend, sessionAgo } from "../helpers/misc";
import {
  ff, theme, shadow, radius,
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
  const [openTag, setOpenTag] = React.useState(null);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
  // Section collapse state. Defaults to open so the first-time
  // view still shows everything; the user can collapse to focus.
  const [recipeOpen, setRecipeOpen] = React.useState(true);
  const [brewingOpen, setBrewingOpen] = React.useState(true);
  // Signal-tag overflow toggle. Cap visible at 6 (3 per row × 2
  // rows); anything beyond hides behind "+N more" until expanded.
  const [tagsExpanded, setTagsExpanded] = React.useState(false);
  const [tableAccentsOpen, setTableAccentsOpen] = React.useState(false);
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
      {/* Hero — flat cream with a soft drop shadow so it reads as a
          lifted card sitting on the ivory page rather than a heavier
          gradient strip. Mirrors Home's card-on-page elevation. */}
      <div style={{
        background: theme.cream,
        padding: "22px 22px 20px",
        borderBottom: `1px solid ${theme.ruleSoft}`,
        boxShadow: shadow.card,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Button variant="ghost" onClick={onClose}>← back</Button>
          <div style={{ fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>
            The Blend
          </div>
          {onToggleFavorite ? (
            <button onClick={onToggleFavorite} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 6px",
              fontSize: 22, lineHeight: 1,
              color: isFavorite ? theme.terra : theme.ash,
            }} title={isFavorite ? "remove from favorites" : "add to favorites"}>
              {isFavorite ? "★" : "☆"}
            </button>
          ) : <div style={{ width: 40 }} />}
        </div>

        {/* Header grid — three rows × two columns. Icon spans rows
            1-2 in the left column (alongside title + subtitle on the
            right). Mood label lives in row 3 of the left column,
            which is the same grid row as the tag tiles on the right
            — so the label and the first tag row share a row line and
            naturally align without pixel-level math. */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: 14,
          rowGap: 0,
          alignItems: "start",
        }}>
          <div style={{
            gridColumn: 1, gridRow: "1 / span 2",
            justifySelf: "center", alignSelf: "start",
            width: 56, height: 56, borderRadius: "50%",
            background: theme.ivory, border: `1px solid ${theme.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {(() => {
              const Icon = MOOD_ICONS[b.mood] || Flower;
              return <Icon size={32} />;
            })()}
          </div>
          <div style={{
            gridColumn: 1, gridRow: 3,
            justifySelf: "center", alignSelf: "start",
            // Pin to the top of the tag block (where the first tag
            // row sits) rather than centering in the block, so the
            // label tracks tag row 1 even when a second row exists.
            // Small marginTop nudges the label's center onto the
            // first row's center line (label half-height ≈ 7,
            // tag-row half-height ≈ 8.5 → 1.5px tweak).
            marginTop: 1.5,
          }}>
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
                {b.mood} <span style={{ fontSize: 9, color: theme.sageDeep }}>ⓘ</span>
              </button>
            ) : (
              <span style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em",
                textTransform: "uppercase", color: theme.ash,
              }}>
                {b.mood}
              </span>
            )}
          </div>
          <div style={{ gridColumn: 2, gridRow: 1, textAlign: "center", minWidth: 0 }}>
            <h1 style={{ fontFamily: ff.serif, fontSize: 28, fontWeight: 400, color: theme.ink, margin: 0, lineHeight: 1.05 }}>
              {b.name}
            </h1>
          </div>
          {/* Subtitle stays on one line at any width by auto-
              shrinking the font-size to fit. Avoids both wrapping
              (which pushes the signal tags and recipe down
              inconsistently) and ellipsis truncation (which hid
              content). Falls back to no shrink on browsers
              without ResizeObserver. */}
          <div style={{ gridColumn: 2, gridRow: 2, textAlign: "center", minWidth: 0 }}>
            <FitOneLine
              text={b.subtitle}
              baseSize={13}
              minSize={9.5}
              style={{
                fontFamily: ff.serif, fontStyle: "italic",
                color: theme.ash, marginTop: 4, lineHeight: 1.15,
              }}
            />
          </div>
          {/* Tag row sits at gridRow 3 alongside the mood label so
              the two share a row baseline. The wrapping div takes
              the grid placement; the tag content lives inside. */}
          <div style={{ gridColumn: 2, gridRow: 3, textAlign: "center", minWidth: 0 }}>
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
            if (b.twist) {
              // Herbanium Twist tag takes precedence — same experimental
              // status, but the user-facing framing is "tradition with a
              // deliberate deviation," which is the more useful story.
              tags.push({
                label: "twist",
                summary: "Herbanium Twist — a tradition with one or two intentional changes.",
                body: b.twistNote || "A traditional preparation reframed with one or two accent additions or brewing changes. The notes panel on this blend explains why the change works.",
                tone: "terra",
                fg: theme.plum, bg: "transparent", border: theme.plum, dashed: true,
              });
            } else {
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
          }
          if (flagged) {
            tags.push({
              label: "heads-up",
              summary: "Caution — at least one ingredient has a heads-up note.",
              body: "Common reasons: drug interactions, pregnancy concerns, sedative effects, blood-pressure shifts. Open any ingredient with a flagged badge to read its specific note. Herbanium is a brewing companion, not medical advice — verify with a clinician.",
              tone: "terra",
              fg: theme.terra, bg: "transparent", border: theme.terra, dashed: true,
            });
          }
          if (tags.length === 0) return null;
          const TAG_HEAD = 6; // 3 per row × 2 rows
          const visibleTags = tagsExpanded ? tags : tags.slice(0, TAG_HEAD);
          const hiddenCount = Math.max(0, tags.length - TAG_HEAD);
          return (
            <div style={{ marginTop: 10 }}>
              {/* Three-per-row layout via flex with each pill taking
                  one-third of the row width. Partial rows center
                  themselves (one extra pill lands in the middle of
                  its own row, two extra pills bracket the center). */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 5,
                maxWidth: 360, marginLeft: "auto", marginRight: "auto",
              }}>
                {visibleTags.map((t, i) => {
                  const active = openTag?.label === t.label;
                  return (
                    <button
                      key={i}
                      onClick={() => setOpenTag(prev => prev?.label === t.label ? null : t)}
                      style={{
                        // 1/3 of the row width minus 2/3 of the gap, so 3 fit
                        // exactly per row regardless of label length and
                        // partial rows center via the flex parent.
                        flex: "0 0 calc((100% - 10px) / 3)",
                        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: t.fg, background: t.bg,
                        border: `1px ${t.dashed ? "dashed" : "solid"} ${t.border}`,
                        borderRadius: 6,
                        padding: "3px 8px",
                        cursor: "pointer",
                        boxShadow: active ? `0 0 0 2px ${t.border}33` : "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >{t.label}</button>
                  );
                })}
              </div>
              {hiddenCount > 0 && (
                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <button
                    onClick={() => setTagsExpanded(v => !v)}
                    style={{
                      fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: theme.ash,
                      background: "transparent",
                      border: `1px dashed ${theme.rule}`,
                      borderRadius: 3,
                      padding: "3px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {tagsExpanded ? "show fewer" : `+${hiddenCount} more`}
                  </button>
                </div>
              )}
            </div>
          );
            })()}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 32px" }}>
        {openTag && (
          <div style={{ marginBottom: 18 }}>
            <VocabInfoCard
              term={openTag.label}
              summary={openTag.summary}
              body={openTag.body}
              tone={openTag.tone}
              onClose={() => setOpenTag(null)}
            />
          </div>
        )}
        {openMood && EFFECT_DESCRIPTIONS[openMood] && (
          <div style={{ marginBottom: 18 }}>
            <VocabInfoCard
              term={openMood}
              summary={EFFECT_DESCRIPTIONS[openMood].summary}
              tone="sage"
              onClose={() => setOpenMood(null)}
            />
          </div>
        )}

        {/* Ingredients — collapsible header. Default open. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setRecipeOpen(o => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setRecipeOpen(o => !o);
            }
          }}
          style={{
            display: "flex", alignItems: "baseline", gap: 8,
            cursor: "pointer", userSelect: "none",
          }}
        >
          <span style={{
            fontFamily: ff.sans, fontSize: 9, color: theme.ash,
            transition: "transform 0.15s ease",
            transform: recipeOpen ? "rotate(90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}>▶</span>
          <SectionLabel n="i">The recipe</SectionLabel>
        </div>
        {recipeOpen && (() => {
          const accents = BLEND_TABLE_ACCENTS[b.id] || [];
          const hasAccents = accents.length > 0;
          return (
            <>
              <div style={{
                marginTop: 10, padding: "4px 14px",
                borderRadius: hasAccents ? `${radius.md}px ${radius.md}px 0 0` : radius.md,
                background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                borderBottom: hasAccents ? "none" : `1px solid ${theme.ruleSoft}`,
                boxShadow: hasAccents ? "none" : shadow.card,
              }}>
                {b.ingredients.map((ing, i) => {
                  const meta = INGREDIENTS[ing.id];
                  if (!meta) return null;
                  // Compact metadata line: temp range, steep range, top 2 flavors, top effect.
                  // Steep range formatted in minutes when both bounds are
                  // multiples of 60s (most ingredients); falls back to seconds
                  // for the few that brew sub-minute (matcha 30s, hojicha 30–60s).
                  const formatSteepRange = ([sMin, sMax]) => {
                    if (sMax < 60) return `${sMin}–${sMax}s`;
                    if (sMin < 60) return `${sMin}s–${Math.round(sMax / 60)} min`;
                    const lo = sMin / 60, hi = sMax / 60;
                    return `${Number.isInteger(lo) ? lo : lo.toFixed(1)}–${Number.isInteger(hi) ? hi : hi.toFixed(1)} min`;
                  };
                  const steepRange = meta.timeS ? formatSteepRange(meta.timeS) : null;
                  const topFlavors = (meta.flavors || []).slice(0, 2).join(", ");
                  const topEffect = (meta.effects || []).filter(([t]) => t !== "bitterness")[0];
                  const metaParts = [
                    formatTempRange(meta.tempC[0], meta.tempC[1], unit),
                    steepRange,
                    topFlavors,
                    topEffect ? topEffect[0] : null,
                  ].filter(Boolean);
                  const hasHeadsUp = !!(meta.headsUp && meta.headsUp.trim?.());
                  return (
                    <button key={ing.id} onClick={() => onOpenIngredient(ing.id)} style={{
                      width: "100%", textAlign: "left", background: "transparent",
                      border: "none", borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                      padding: "10px 0", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    }}>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{
                          fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                        }}>
                          <span>{meta.name}</span>
                          {hasHeadsUp && (
                            // Heads-up indicator on the ingredient row —
                            // matches the badge style on the ingredient
                            // catalog cards (LibraryScreen) so the user
                            // recognizes it as the same flag, and answers
                            // the recipe-page question "which ingredient
                            // does the blend's heads-up tag refer to?"
                            <span title={`heads up — ${meta.headsUp}`} style={{
                              width: 16, height: 16, borderRadius: "50%",
                              background: theme.ochre, color: theme.cream,
                              fontFamily: ff.serif, fontSize: 11, fontWeight: "bold",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              lineHeight: 1,
                            }}>!</span>
                          )}
                          <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
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

              {/* At-the-table accents — connected sub-card (shares the
                  recipe card's border, dashed top divider, lighter
                  background). Thinner padding implies non-essential.
                  Click the header to expand the list. */}
              {hasAccents && (
                <div style={{
                  borderRadius: `0 0 ${radius.md}px ${radius.md}px`,
                  background: "rgba(98, 124, 92, 0.04)",
                  border: `1px solid ${theme.ruleSoft}`,
                  borderTop: `1px dashed ${theme.ruleSoft}`,
                  overflow: "hidden",
                  boxShadow: shadow.card,
                }}>
                  <button
                    onClick={() => setTableAccentsOpen(o => !o)}
                    style={{
                      width: "100%", textAlign: "left",
                      background: "transparent", border: "none",
                      padding: "6px 14px", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <div style={{
                      fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
                      textTransform: "uppercase", color: theme.ash,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{
                        fontSize: 9, color: theme.ash,
                        transition: "transform 0.15s ease",
                        transform: tableAccentsOpen ? "rotate(90deg)" : "rotate(0deg)",
                        display: "inline-block",
                      }}>▶</span>
                      from the kitchen
                    </div>
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                      color: theme.ash,
                    }}>
                      {accents.length} {accents.length === 1 ? "addition" : "additions"}
                    </div>
                  </button>
                  {tableAccentsOpen && (
                    <div style={{ padding: "0 14px 6px", textAlign: "left" }}>
                      {accents.map((label, i) => (
                        <div key={label} style={{
                          padding: "6px 0",
                          borderTop: `1px solid ${theme.ruleSoft}`,
                          fontFamily: ff.serif, fontSize: 13, color: theme.inkSoft,
                          fontStyle: "italic",
                          textAlign: "left",
                        }}>{label}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* Brewing — collapsible header + interactive explorer.
            Default open; collapsing hides the slider explorer and
            volume tag so the user can read just the recipe and
            preparations. The Brew CTA stays outside the collapse
            so the action is always one tap away. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setBrewingOpen(o => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setBrewingOpen(o => !o);
            }
          }}
          style={{
            margin: "22px 0 10px",
            display: "flex", alignItems: "baseline", gap: 8,
            cursor: "pointer", userSelect: "none",
          }}
        >
          <span style={{
            fontFamily: ff.sans, fontSize: 9, color: theme.ash,
            transition: "transform 0.15s ease",
            transform: brewingOpen ? "rotate(90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}>▶</span>
          <SectionLabel n="ii">Brewing</SectionLabel>
        </div>
        {brewingOpen && (
          <>
            <BlendExtractionExplorer
              ingredients={b.ingredients}
              defaultTempC={b.tempC}
              defaultTimeS={b.timeS}
              declaredEffects={b.effects}
              curated
              isTraditional={!!b.tradition}
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
          </>
        )}

        {/* Brew CTA — primary terra button, full width. Style overrides
            push the size up one tier (17px serif, 15px vertical pad) so
            the page's headline action reads slightly bigger than the
            standard Button defaults. */}
        <Button
          variant="primary" fullWidth
          onClick={onBrew}
          icon={<Kettle size={20} c={theme.cream} />}
          style={{ marginTop: 18, fontSize: 17, padding: "15px 16px", gap: 10 }}
        >
          Brew this cup →
        </Button>

        {/* Recommended Preparations — tradition-specific steps when curated,
            generic template otherwise. Sits after the predicted-mood/balance
            bars so the brewing science reads first, the ritual second. */}
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
          // Localize Celsius temperatures in curated direction strings to
          // the user's selected temperature unit. Catches both bare and
          // tilde-prefixed forms (e.g. "90°C", "~95°C", "above 85°C").
          const localizeSteps = (raw) => {
            if (unit !== "F") return raw;
            return raw.map(s =>
              s.replace(/(\d+)\s*°C/g, (_, c) =>
                `${Math.round(Number(c) * 9 / 5 + 32)}°F`)
            );
          };
          const steps = localizeSteps(tradSteps || fallbackSteps);
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
                <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontFamily: ff.sans, fontSize: 9, color: theme.ash,
                    transition: "transform 0.15s ease",
                    transform: directionsOpen ? "rotate(90deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>▶</span>
                  <SectionLabel n="iii">Recommended Preparations</SectionLabel>
                </span>
                <span style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                }}>{sourceLabel}</span>
              </div>
              {directionsOpen && (
                <ol style={{
                  marginTop: 10, marginLeft: "auto", marginRight: "auto",
                  maxWidth: 360,
                  padding: "12px 16px 12px 32px", borderRadius: radius.md,
                  background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                  fontFamily: ff.serif, fontSize: 13.5, color: theme.ink,
                  lineHeight: 1.55, textAlign: "left",
                  boxShadow: shadow.card,
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

        {/* Your log with this blend — aggregates + recent sessions */}
        <div style={{ margin: "22px 0 10px" }}>
          <SectionLabel n="iv">Your log with this blend</SectionLabel>
        </div>
        {brewCount === 0 ? (
          <div style={{
            padding: "16px 18px", borderRadius: radius.md,
            background: theme.cream, border: `1px dashed ${theme.ruleSoft}`,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, textAlign: "center",
          }}>
            No log for this blend yet.<br />
            Brew it and your notes will live here.
          </div>
        ) : (
          <div style={{
            padding: "12px 14px", borderRadius: radius.md,
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            boxShadow: shadow.card,
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
                      {sessionAgo(s) || s.ago}
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
              <button onClick={() => { onClose(); go("shelf", { mode: "journal" }); }} style={{
                marginTop: 4, width: "100%",
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash,
                cursor: "pointer", padding: "8px 0 0",
                textAlign: "right",
              }}>
                see all {mySessions.length} in your Journal →
              </button>
            )}
          </div>
        )}

        {/* Sources — listed at the foot of the page when this blend's
            preparation, brew window, or pairing is drawn from a
            specific named source. Quiet, italic, footer voice. */}
        {BLEND_SOURCES[b.id] && BLEND_SOURCES[b.id].length > 0 && (
          <>
            <div style={{ margin: "26px 0 10px" }}>
              <SectionLabel n="v">Sources</SectionLabel>
            </div>
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
              textAlign: "left",
            }}>
              {BLEND_SOURCES[b.id].map((src, i) => (
                <div key={i} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                  color: theme.inkSoft, lineHeight: 1.5,
                  padding: "6px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                }}>{src}</div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
