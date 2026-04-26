/* ──────────────────────────────────────────────────────────────
   screens/ComposeScreen.jsx — Compose screen and its ReverseCompose sibling.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  computeBrewProfile, resolveCandidates, resolveBlendAtBrew,
} from "../algo/compose";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import {
  Flower, Kettle,
} from "../components/icons";
import {
  Chip, ChipRows, Rule, SectionLabel,
} from "../components/layout";
import {
  BLENDS, FLAVOR_CONFLICTS, FLAVORS, MOOD_CONFLICTS, MOODS,
} from "../data/blends";
import { INGREDIENTS } from "../data/ingredients";
import { getBlend, iconBtn } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import {
  formatAmount, formatTemp, formatTempRange, formatTempShort, useUnit,
} from "../units/units";
import { LibraryList, BlendListRow } from "./LibraryScreen";
import { SessionRow } from "./HomeScreen";

/* ──────────────────────────────────────────────────────────────
   Screen: COMPOSE
   ────────────────────────────────────────────────────────────── */

export const ComposeScreen = ({ go, startBrew, savedBlendIds, favoriteBlendIds, generatedBlends, hiddenBlendIds, deleteBlend, saveComposedBlend, openBlend, composePreselect, openInCompose, pantryIds, sessions = [] }) => {
  // Save-prompt state for the forward (Vibe) compose flow.
  const [saveName, setSaveName] = useState("");
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const { unit, weightUnit } = useUnit();
  const [mode, setMode] = useState("reverse"); // reverse | forward | apothecary
  const [apothecaryFilter, setApothecaryFilter] = useState("favorites");
  const [catalogueFilter, setCatalogueFilter] = useState("all");
  const [shelfTab, setShelfTab] = useState("blends"); // blends | catalogue | journal
  const [moods, setMoods] = useState([]);        // start empty — user sets their intent
  const [flavors, setFlavors] = useState([]);    // multi-select, same pattern as moods
  const [onlyPantry, setOnlyPantry] = useState(false);
  const [reverseIngs, setReverseIngs] = useState([]);
  // Which axis leads: "feel" (mood-primary) or "taste" (flavor-primary).
  // Changes which side shows as the prominent row and which axis the
  // resolver varies across for alternate candidates.
  const [primaryAxis, setPrimaryAxis] = useState("feel");

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to the Apothecary sub-tab so the
  // user sees their saved recipe highlighted, ready to set intent and brew.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("apothecary");
    setApothecaryFilter("all");
  }, [composePreselect?.at]);

  const toggleMood = (m) => {
    setMoods(prev => {
      if (prev.includes(m)) return prev.filter(x => x !== m);
      if (prev.length >= 4) return [...prev.slice(1), m];
      return [...prev, m];
    });
  };

  const toggleFlavor = (f) => {
    setFlavors(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      if (prev.length >= 4) return [...prev.slice(1), f];
      return [...prev, f];
    });
  };

  const moodInTension = (m) =>
    MOOD_CONFLICTS.some(([a, b]) =>
      (moods.includes(a) && m === b) ||
      (moods.includes(b) && m === a)
    );

  const flavorInTension = (f) =>
    FLAVOR_CONFLICTS.some(([a, b]) =>
      (flavors.includes(a) && f === b) ||
      (flavors.includes(b) && f === a)
    );

  // Resolver still takes a single flavor (for now) — we pass the first
  // selected flavor as the primary driver. Additional flavors will be used
  // for accent/variant generation downstream.
  // Pass the full flavors array so resolveCandidates can score
  // candidates against every selected flavor, not just the first.
  const rawCandidates = resolveCandidates(moods, flavors, primaryAxis);

  // When "only use what's in my pantry" is toggled on, drop any candidate
  // that contains an ingredient the user doesn't have. Empty pantry + toggle
  // on = empty candidate list, rendered as a dedicated empty state below.
  const candidates = onlyPantry && pantryIds
    ? rawCandidates.filter(c =>
        (c.ingredients || []).every(({ id }) => pantryIds.has(id))
      )
    : rawCandidates;

  const [selectedIdx, setSelectedIdx] = useState(0);

  // When the candidate list changes (moods/flavors changed), snap selection
  // back to 0 so the user always sees the "best match" first.
  const candidateKey = candidates.map(c => c.name).join("|");
  React.useEffect(() => {
    setSelectedIdx(0);
  }, [candidateKey]);

  const blend = candidates[selectedIdx] || {
    name: "—",
    subtitle: onlyPantry
      ? (pantryIds && pantryIds.size === 0
          ? "add ingredients to your pantry first"
          : "no blends from what you have on hand")
      : "pick a mood to begin",
    ingredients: [], tempC: 95, timeS: 300, effects: [],
    empty: true, conflict: null, moods: [],
  };

  // Live brew state — lifted up from BlendExtractionExplorer so the warning
  // block above the "start brewing" button can react to slider changes.
  // Reset to the blend's algorithmic defaults whenever the blend changes
  // (user picks a different suggestion, or moods/flavors change).
  const [brewTempC, setBrewTempC] = useState(blend.tempC);
  const [brewTimeS, setBrewTimeS] = useState(blend.timeS);

  // User-augmented ingredients — things they add to a suggestion to make
  // it their own. Kept separate from blend.ingredients (which is the
  // algorithm's base suggestion) so we can reset cleanly when the blend
  // identity changes and the user picks something new.
  const [addedIngIds, setAddedIngIds] = useState([]);
  const [showAdder, setShowAdder] = useState(false);
  const [adderSearch, setAdderSearch] = useState("");

  React.useEffect(() => {
    setBrewTempC(blend.tempC);
    setBrewTimeS(blend.timeS);
    setAddedIngIds([]);        // drop user additions on blend change
    setShowAdder(false);
    setAdderSearch("");
  }, [blend.name, blend.tempC, blend.timeS]);

  // Effective ingredient list = algorithmic base + user additions (as
  // light accents at 0.5g). Used for the explorer, the warning, and
  // start-brewing. Base ingredients preserve their original grams.
  const effectiveIngredients = [
    ...blend.ingredients,
    ...addedIngIds.map(id => ({ id, g: 0.5 })),
  ];

  // Live compatibility check — uses the user's current slider values, not
  // the static algorithmic defaults. `outsiders` is an array of ingredient
  // NAMES (not ids) at the live temp.
  const liveBrew = effectiveIngredients.length > 0
    ? resolveBlendAtBrew(effectiveIngredients, brewTempC, brewTimeS, blend.tempC, blend.timeS, true)
    : { outsiders: [], perIngredient: [] };
  // Curated blends sitting on the curator's chosen brew don't surface the
  // temperature-compromise note — the curator already accepted that trade.
  // Accent/catalyst ingredients also don't fire it (they're stylistic
  // adjuncts; the recipe accepts the stretch by design).
  const atCuratedBaseline = brewTempC === blend.tempC && brewTimeS === blend.timeS;
  const liveOutsiders = atCuratedBaseline
    ? []
    : (liveBrew.perIngredient || []).filter(c => !c.inRange && (c.role === "lead" || c.role == null));

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Segmented control */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
        marginBottom: 14, background: theme.cream,
      }}>
        {[
          ["reverse",    "Blend"],
          ["forward",    "Vibe"],
          ["apothecary", "Shelf"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
            padding: "9px 4px", cursor: "pointer",
            background: mode === k ? theme.ink : "transparent",
            color: mode === k ? theme.cream : theme.inkSoft,
            border: "none",
          }}>{label}</button>
        ))}
      </div>

      {mode === "forward" && (
        <>
          {/* Primary-axis toggle — "by feel" (mood leads) vs "by taste" (flavor leads).
              Reorders the page and changes how alternate candidates are generated. */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
            marginBottom: 16, background: theme.cream,
          }}>
            {[
              ["feel",  "by feel"],
              ["taste", "by taste"],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setPrimaryAxis(k)} style={{
                fontFamily: ff.serif, fontSize: 13, fontStyle: "italic",
                padding: "9px 4px", cursor: "pointer",
                background: primaryAxis === k ? theme.terra : "transparent",
                color: primaryAxis === k ? theme.cream : theme.inkSoft,
                border: "none",
              }}>{label}</button>
            ))}
          </div>

          {(() => {
            const moodRow = (
              <div key="mood-row" style={{ opacity: primaryAxis === "feel" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <SectionLabel n={primaryAxis === "feel" ? "ii" : "iii"}>
                    {primaryAxis === "feel" ? "Desired mood" : "Mood, lightly"}
                  </SectionLabel>
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
                  }}>
                    {primaryAxis === "taste" && moods.length === 0 ? "optional" :
                     moods.length === 0 ? "pick one or two" :
                     moods.length === 1 ? "add a second to combine" :
                     moods.length === 2 ? "2 selected · pairs well" :
                     moods.length === 3 ? "3 selected · adding nuance" :
                     "4 selected · at the limit"}
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <ChipRows
                    items={MOODS}
                    renderItem={(m) => (
                      <Chip
                        key={m}
                        active={moods.includes(m)}
                        caution={moodInTension(m)}
                        onClick={() => toggleMood(m)}
                        tone="sage"
                      >{m}</Chip>
                    )}
                  />
                </div>

                {blend.conflict && (
                  <div style={{
                    marginTop: 12, padding: "10px 12px", borderRadius: 8,
                    background: "rgba(176, 84, 47, 0.07)",
                    border: `1px solid rgba(176, 84, 47, 0.22)`,
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <Flower size={16} c={theme.terra} />
                    <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5, color: theme.inkSoft, lineHeight: 1.45 }}>
                      <em style={{ color: theme.terra, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>at odds</em>
                      <em style={{ color: theme.terra }}>{blend.conflict[0]}</em> and <em style={{ color: theme.terra }}>{blend.conflict[1]}</em> pull in opposite directions. The blend will try to thread the needle, but usually better to pick one.
                    </div>
                  </div>
                )}
              </div>
            );

            const flavorRow = (
              <div key="flavor-row" style={{ opacity: primaryAxis === "taste" ? 1 : 0.72 }}>
                <div style={{ marginTop: 20 }}>
                  <SectionLabel n={primaryAxis === "taste" ? "ii" : "iii"}>
                    {primaryAxis === "taste" ? "Flavor you're after" : "Flavor direction"}
                  </SectionLabel>
                </div>
                <div style={{ marginTop: 10 }}>
                  <ChipRows
                    items={FLAVORS}
                    renderItem={(f) => {
                      const active = flavors.includes(f);
                      const tension = !active && flavorInTension(f);
                      return (
                        <Chip
                          key={f}
                          active={active}
                          onClick={() => toggleFlavor(f)}
                          tone="terra"
                          caution={tension}
                        >{f}</Chip>
                      );
                    }}
                  />
                </div>
                {/* Soft warning when user has selected flavors that typically fight each other */}
                {flavors.length >= 2 && (() => {
                  const conflict = FLAVOR_CONFLICTS.find(([a, b]) =>
                    flavors.includes(a) && flavors.includes(b)
                  );
                  return conflict ? (
                    <div style={{
                      marginTop: 10, padding: "8px 10px", borderRadius: 6,
                      background: "rgba(165, 120, 54, 0.08)",
                      border: `1px solid rgba(165, 120, 54, 0.22)`,
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                      color: theme.inkSoft, lineHeight: 1.45,
                    }}>
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[0]}</em>
                      {" "}and{" "}
                      <em style={{ color: theme.terra, fontStyle: "normal" }}>{conflict[1]}</em>
                      {" "}can work against each other in a cup. The blend will try to balance them; often better to pick one.
                    </div>
                  ) : null;
                })()}
              </div>
            );

            // Render the primary axis first (gets "ii"), secondary second (gets "iii")
            return primaryAxis === "feel" ? [moodRow, flavorRow] : [flavorRow, moodRow];
          })()}

          <label style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 18,
            fontFamily: ff.sans, fontSize: 12, color: theme.inkSoft, cursor: "pointer",
          }}>
            <span style={{
              width: 30, height: 18, borderRadius: 999,
              background: onlyPantry ? theme.sageDeep : theme.rule,
              position: "relative", transition: "background .2s",
            }} onClick={() => setOnlyPantry(!onlyPantry)}>
              <span style={{
                position: "absolute", top: 2, left: onlyPantry ? 14 : 2,
                width: 14, height: 14, borderRadius: "50%", background: theme.cream,
                transition: "left .2s",
              }} />
            </span>
            only use what's in my pantry
          </label>

          {/* Candidate selector — only shown when there are multiple suggestions */}
          {candidates.length > 1 && (
            <div style={{ marginTop: 22 }}>
              <div style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: theme.ash, fontFamily: ff.sans, marginBottom: 8,
              }}>
                {candidates.length} suggestions
              </div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {candidates.map((c, i) => {
                  const isSelected = i === selectedIdx;
                  // Both experimental and accented (Herbanium variations
                  // on a tradition) get the same in-house blue treatment.
                  const isExperimental = c.kind === "experimental" || c.kind === "accented";
                  // Experimental blends get a sky-blue outline (and label color)
                  // so they read as a different *kind* of candidate than the
                  // traditions and accents around them.
                  const borderColor = isSelected
                    ? theme.ink
                    : isExperimental ? theme.sky : theme.rule;
                  return (
                    <button key={i} onClick={() => setSelectedIdx(i)} style={{
                      flex: "0 0 auto", minWidth: 130, maxWidth: 170,
                      textAlign: "left",
                      padding: "8px 10px", borderRadius: 10,
                      border: `1px solid ${borderColor}`,
                      borderWidth: isExperimental && !isSelected ? 1.5 : 1,
                      background: isSelected ? theme.ink : "transparent",
                      color: isSelected ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      <div style={{
                        fontFamily: ff.sans, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isSelected ? "rgba(243,236,220,0.6)"
                          : isExperimental ? theme.sky
                          : theme.ash,
                      }}>{c.kindLabel}</div>
                      <div style={{
                        fontFamily: ff.serif, fontSize: 13, lineHeight: 1.15,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{c.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generated blend card */}
          <div style={{
            marginTop: candidates.length > 1 ? 12 : 22, padding: 18, borderRadius: 14,
            border: `1px solid ${theme.rule}`, background: theme.cream,
            position: "relative", overflow: "hidden",
            opacity: blend.empty ? 0.55 : 1,
          }}>
            <div style={{
              position: "absolute", top: 10, right: 12,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5, color: theme.ash,
            }}>
              suggestion · unsaved
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Flower size={18} c={theme.ochre} />
              <div style={{ fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.ash }}>
                {moods.length === 0   ? "no mood yet"
                 : moods.length === 1 ? `a blend for ${moods[0]}`
                 : moods.length === 2 ? `for ${moods[0]} & ${moods[1]}`
                 : `for ${moods.slice(0, -1).join(", ")} & ${moods[moods.length - 1]}`}
              </div>
            </div>
            <div style={{ fontFamily: ff.serif, fontSize: 26, color: theme.ink, lineHeight: 1.1 }}>
              {blend.name}
            </div>
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, marginTop: 2 }}>
              {blend.subtitle}
            </div>

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            {blend.ingredients.length === 0 ? (
              <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
                Tap a mood chip above to compose a cup.
              </div>
            ) : (
              <>
                {blend.ingredients.map(({ id, g }) => {
                  const ing = INGREDIENTS[id];
                  const topFlavors = (ing.flavors || []).slice(0, 2).join(", ");
                  const topEffect = (ing.effects || []).filter(([t]) => t !== "bitterness")[0];
                  const metaParts = [
                    formatTempRange(ing.tempC[0], ing.tempC[1], unit),
                    topFlavors,
                    topEffect ? `${topEffect[0]} ${topEffect[1]}` : null,
                  ].filter(Boolean);
                  return (
                    <div key={id} onClick={() => go("ingredient", id)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      padding: "6px 0", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                          {ing.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                        </div>
                        <div style={{
                          fontFamily: ff.sans, fontSize: 10.5, color: theme.ash,
                          marginTop: 2, letterSpacing: "0.02em",
                        }}>
                          {metaParts.join(" · ")}
                        </div>
                      </div>
                      <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft, flexShrink: 0, marginLeft: 12 }}>
                        {formatAmount(g, ing.category, weightUnit)}
                      </div>
                    </div>
                  );
                })}

                {/* User-added ingredients — shown inline with the suggested ones
                    but distinguishable via italic "added" marker and a remove
                    affordance. */}
                {addedIngIds.map(id => {
                  const ing = INGREDIENTS[id];
                  if (!ing) return null;
                  const topFlavors = (ing.flavors || []).slice(0, 2).join(", ");
                  const metaParts = [
                    formatTempRange(ing.tempC[0], ing.tempC[1], unit),
                    topFlavors,
                  ].filter(Boolean);
                  return (
                    <div key={`added-${id}`} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      padding: "6px 0",
                    }}>
                      <div
                        onClick={() => go("ingredient", id)}
                        style={{ flex: 1, minWidth: 0, textAlign: "left", cursor: "pointer" }}
                      >
                        <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                          {ing.name}{" "}
                          <span style={{ fontStyle: "italic", fontSize: 10.5, color: theme.sageDeep, letterSpacing: "0.04em" }}>
                            added
                          </span>{" "}
                          <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                        </div>
                        <div style={{
                          fontFamily: ff.sans, fontSize: 10.5, color: theme.ash,
                          marginTop: 2, letterSpacing: "0.02em",
                        }}>
                          {metaParts.join(" · ")}
                        </div>
                      </div>
                      <button
                        onClick={() => setAddedIngIds(addedIngIds.filter(x => x !== id))}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          color: theme.ash, fontSize: 16, lineHeight: 1,
                          padding: "2px 8px", marginLeft: 8,
                        }}
                        aria-label={`Remove ${ing.name}`}
                      >×</button>
                    </div>
                  );
                })}

                {/* Adder toggle + inline picker panel */}
                <button
                  onClick={() => setShowAdder(!showAdder)}
                  style={{
                    width: "100%", marginTop: 8,
                    padding: "8px 10px", borderRadius: 8,
                    background: "transparent",
                    border: `1px dashed ${theme.rule}`,
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                    color: theme.inkSoft, cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {showAdder ? "× close" : "+ add an ingredient"}
                </button>

                {showAdder && (
                  <div style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: 8,
                    background: "rgba(0,0,0,0.02)",
                    border: `1px solid ${theme.ruleSoft}`,
                  }}>
                    <input
                      type="text"
                      value={adderSearch}
                      onChange={e => setAdderSearch(e.target.value)}
                      placeholder="search ingredients…"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "6px 8px", marginBottom: 8,
                        border: `1px solid ${theme.rule}`, borderRadius: 6,
                        background: theme.cream,
                        fontFamily: ff.sans, fontSize: 12, color: theme.ink,
                        outline: "none",
                      }}
                    />
                    <div style={{
                      maxHeight: 220, overflowY: "auto",
                      display: "flex", flexDirection: "column", gap: 2,
                    }}>
                      {(() => {
                        const excluded = new Set([
                          ...blend.ingredients.map(i => i.id),
                          ...addedIngIds,
                        ]);
                        const q = adderSearch.trim().toLowerCase();
                        const matches = Object.keys(INGREDIENTS)
                          .filter(id => !excluded.has(id))
                          .filter(id => {
                            if (!q) return true;
                            const ing = INGREDIENTS[id];
                            const hay = [
                              ing.name, ing.latin || "",
                              ...(ing.flavors || []),
                              ing.category || "",
                            ].join(" ").toLowerCase();
                            return hay.includes(q);
                          })
                          .sort((a, b) => INGREDIENTS[a].name.localeCompare(INGREDIENTS[b].name))
                          .slice(0, 30);

                        if (matches.length === 0) {
                          return (
                            <div style={{
                              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
                              color: theme.ash, padding: "8px 4px", textAlign: "center",
                            }}>
                              nothing matches — try another word
                            </div>
                          );
                        }

                        return matches.map(id => {
                          const ing = INGREDIENTS[id];
                          const topFlavors = (ing.flavors || []).slice(0, 2).join(", ");
                          return (
                            <button
                              key={id}
                              onClick={() => {
                                setAddedIngIds([...addedIngIds, id]);
                                setAdderSearch("");
                              }}
                              style={{
                                textAlign: "left",
                                padding: "6px 8px", borderRadius: 4,
                                background: "transparent", border: "none",
                                cursor: "pointer",
                                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                                gap: 10,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(109,126,85,0.08)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: ff.serif, fontSize: 13.5, color: theme.ink }}>
                                  {ing.name}
                                </div>
                                <div style={{
                                  fontFamily: ff.sans, fontSize: 10, color: theme.ash,
                                  marginTop: 1, letterSpacing: "0.02em",
                                }}>
                                  {formatTempRange(ing.tempC[0], ing.tempC[1], unit)}
                                  {topFlavors && ` · ${topFlavors}`}
                                </div>
                              </div>
                              <span style={{
                                fontFamily: ff.sans, fontSize: 11, color: theme.sageDeep,
                                flexShrink: 0,
                              }}>+ add</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            {effectiveIngredients.length > 0 && (
              <BlendExtractionExplorer
                ingredients={effectiveIngredients}
                defaultTempC={blend.tempC}
                defaultTimeS={blend.timeS}
                tempC={brewTempC}
                setTempC={setBrewTempC}
                timeS={brewTimeS}
                setTimeS={setBrewTimeS}
                compact
                curated
              />
            )}

            {/* Temperature-compromise warning — reactive to slider values
                in the explorer above. Sits under the stats so the user
                sees the consequence in the context of what they've set. */}
            {!blend.empty && liveOutsiders.length > 0 && (
              <div style={{
                marginTop: 14, padding: "8px 10px", borderRadius: 6,
                background: "rgba(165, 120, 54, 0.08)",
                border: `1px solid rgba(165, 120, 54, 0.22)`,
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                color: theme.inkSoft, lineHeight: 1.45,
              }}>
                <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
                these ingredients don't all share a brewing window at{" "}
                <em style={{ fontStyle: "normal" }}>{formatTemp(brewTempC, unit)}</em>.{" "}
                <em>
                  {liveOutsiders.map((c, i) => (
                    <React.Fragment key={c.id}>
                      {i > 0 && (i === liveOutsiders.length - 1 ? " and " : ", ")}
                      {c.name}
                    </React.Fragment>
                  ))}
                </em>
                {" "}will extract lightly at this temp — fine as accents, worth rethinking if they carry the blend.
              </div>
            )}

            {/* Save / brew row. Save prompts for a name (defaults to the
                algorithm-suggested one); brew goes straight into Steep. */}
            {savePromptOpen && (
              <div style={{
                marginTop: 14, padding: "10px 12px", borderRadius: 8,
                background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="name your blend"
                  maxLength={48}
                  style={{
                    fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                    background: "transparent", border: "none",
                    borderBottom: `1px solid ${theme.terra}`,
                    padding: "4px 2px", outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setSavePromptOpen(false); setSaveStatus(null); }}
                    style={{
                      fontFamily: ff.sans, fontSize: 12, color: theme.ash,
                      padding: "6px 12px", borderRadius: 999,
                      background: "transparent", border: "none", cursor: "pointer",
                    }}
                  >cancel</button>
                  <button
                    onClick={() => {
                      const id = saveComposedBlend && saveComposedBlend(
                        { ...blend, ingredients: effectiveIngredients, tempC: brewTempC, timeS: brewTimeS },
                        saveName,
                      );
                      if (id) {
                        setSaveStatus({ kind: "ok", text: `Saved as "${saveName.trim() || blend.name || 'Untitled blend'}"` });
                        setSavePromptOpen(false);
                        setSaveName("");
                        setTimeout(() => setSaveStatus(null), 2000);
                      }
                    }}
                    style={{
                      fontFamily: ff.serif, fontSize: 14,
                      padding: "6px 16px", borderRadius: 999,
                      background: theme.ink, color: theme.cream,
                      border: "none", cursor: "pointer",
                    }}
                  >save</button>
                </div>
              </div>
            )}
            {saveStatus && (
              <div style={{
                marginTop: 10, padding: "6px 10px", borderRadius: 8,
                background: "rgba(98,124,92,0.10)", border: `1px solid ${theme.ruleSoft}`,
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.sageDeep,
                textAlign: "center",
              }}>{saveStatus.text}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                disabled={blend.empty}
                onClick={() => {
                  setSaveName(blend.name || "");
                  setSavePromptOpen(true);
                  setSaveStatus(null);
                }}
                style={{
                  fontFamily: ff.sans, fontSize: 13, color: theme.terra,
                  padding: "12px 18px", borderRadius: 10,
                  background: "transparent", border: `1px solid ${theme.terra}`,
                  cursor: blend.empty ? "not-allowed" : "pointer",
                  opacity: blend.empty ? 0.4 : 1,
                }}
              >save</button>
              <button
                disabled={blend.empty}
                onClick={() => startBrew(
                  { ...blend, ingredients: effectiveIngredients, tempC: brewTempC, timeS: brewTimeS },
                  "",
                  moods
                )}
                style={{
                  flex: 1,
                  fontFamily: ff.serif, fontSize: 16,
                  padding: "14px 16px", borderRadius: 10,
                  background: blend.empty ? theme.rule : theme.terra,
                  color: theme.cream, border: "none",
                  cursor: blend.empty ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Kettle size={18} c={theme.cream} />
                start brewing
              </button>
            </div>
          </div>
        </>
      )}

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} saveComposedBlend={saveComposedBlend} />
      )}

      {mode === "apothecary" && (() => {
        // Shelf is your-personal-stuff: blends you've brewed at least
        // once plus your favorites in Blends, the app's curated recipes
        // plus your generated/composed experiments in Catalogue, and
        // check-ins in Journal.
        const hidden = hiddenBlendIds || new Set();
        const traditional = BLENDS.filter(b => b.tradition && !hidden.has(b.id));
        const curatedExperimental = BLENDS.filter(b => b.experimental && !hidden.has(b.id));
        // Generated/composed experimentals (onboarding-seeded + user-composed),
        // deduped by id and excluded if already in the curated set.
        const curatedIds = new Set(BLENDS.map(b => b.id));
        const generatedExperimental = (generatedBlends || []).filter(
          b => !curatedIds.has(b.id) && !hidden.has(b.id)
        );
        const experimental = [...curatedExperimental, ...generatedExperimental];
        const yourSessions = (sessions || []).filter(s => s.who === "you");

        const brewedIds = new Set(yourSessions.map(s => s.blendId).filter(Boolean));
        const favSet = favoriteBlendIds || new Set();
        const personalIds = new Set([...brewedIds, ...favSet]);
        const saved = [...personalIds]
          .filter(id => !hidden.has(id))
          .map(id => getBlend(id))
          .filter(Boolean);

        let visible;
        let emptyMsg;
        // Blends sub-tab = brewed-at-least-once ∪ favorites.
        if (apothecaryFilter === "all") {
          visible = saved;
          emptyMsg = "Your Shelf is empty. Brew a cup or favorite a blend from the Catalogue to see it here.";
        } else if (apothecaryFilter === "favorites") {
          visible = saved.filter(b => favSet.has(b.id));
          emptyMsg = "No favorites yet. Tap the heart on a blend to mark it as a favorite.";
        } else if (apothecaryFilter === "what worked") {
          const wonIds = new Set(
            yourSessions.filter(s => (s.taste ?? 0) >= 4).map(s => s.blendId)
          );
          visible = saved.filter(b => wonIds.has(b.id));
          emptyMsg = "No blends have earned four stars yet — rate a cup 4+ in your log and it'll surface here.";
        } else {
          visible = saved.filter(b => b.mood === apothecaryFilter);
          emptyMsg = `Nothing on your shelf matches ${apothecaryFilter} yet. Try brewing one.`;
        }

        const subTabHeader = (
          <div style={{ display: "flex", gap: 16, marginBottom: 14, borderBottom: `1px solid ${theme.ruleSoft}` }}>
            {[
              ["blends",    "Blends",    saved.length],
              ["catalogue", "Catalogue", traditional.length + experimental.length],
              ["journal",   "Journal",   yourSessions.length],
            ].map(([k, label, count]) => (
              <button key={k} onClick={() => setShelfTab(k)} style={{
                background: "transparent", border: "none",
                fontFamily: ff.serif, fontSize: 15, color: shelfTab === k ? theme.ink : theme.ash,
                padding: "6px 0 10px", cursor: "pointer",
                borderBottom: shelfTab === k ? `2px solid ${theme.terra}` : "2px solid transparent",
                marginBottom: -1,
                display: "flex", alignItems: "baseline", gap: 5,
              }}>
                {label}
                {count > 0 && (
                  <span style={{
                    fontFamily: ff.mono, fontSize: 10, color: shelfTab === k ? theme.terra : theme.ash, opacity: 0.75,
                  }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        );

        if (shelfTab === "journal") {
          return (
            <div style={{ marginTop: 4 }}>
              {subTabHeader}
              {yourSessions.length === 0 ? (
                <div style={{
                  marginTop: 18, padding: "14px 16px",
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, textAlign: "center", lineHeight: 1.5,
                }}>
                  Your journal starts with your first cup. Brew, log, and every check-in lands here.
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  {yourSessions.map((s, i) => (
                    <SessionRow key={s.id} s={s} openBlend={openBlend} first={i === 0} />
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (shelfTab === "catalogue") {
          let catVisible;
          let catEmpty;
          if (catalogueFilter === "all") {
            const seen = new Set();
            catVisible = [...traditional, ...experimental].filter(b => {
              if (seen.has(b.id)) return false;
              seen.add(b.id);
              return true;
            });
            catEmpty = "No catalogue blends to show.";
          } else if (catalogueFilter === "traditional") {
            catVisible = traditional;
            catEmpty = "No traditional blends to show.";
          } else if (catalogueFilter === "experimental") {
            catVisible = experimental;
            catEmpty = "No experimental blends to show.";
          } else {
            catVisible = [...traditional, ...experimental]
              .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
              .filter(b => b.mood === catalogueFilter);
            catEmpty = `No catalogue blends match ${catalogueFilter} yet.`;
          }
          return (
            <div style={{ marginTop: 4 }}>
              {subTabHeader}
              <div style={{ marginBottom: 10 }}>
                <ChipRows
                  items={["all", "traditional", "experimental", "calm", "focus", "energy", "comfort"]}
                  renderItem={(f) => (
                    <Chip
                      key={f}
                      active={catalogueFilter === f}
                      onClick={() => setCatalogueFilter(f)}
                    >{f}</Chip>
                  )}
                />
              </div>

              {catalogueFilter === "traditional" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  Classic preparations, taught the way they're traditionally made.
                  Tap any to open its recipe or start brewing.
                </div>
              )}

              {catalogueFilter === "experimental" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  Recipes the catalog's chemistry suggests but no tradition has codified —
                  Herbanium house experiments. Try, log, judge for yourself.
                </div>
              )}

              {catVisible.length === 0 ? (
                <div style={{
                  marginTop: 18, padding: "14px 16px",
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, textAlign: "center", lineHeight: 1.5,
                }}>
                  {catEmpty}
                </div>
              ) : (
                catVisible.map((b, i) => {
                  // Tom Foolery is the one experimental treated as a permanent
                  // catalogue staple — Herbanium's house signature, undeletable.
                  const isHouseStaple = b.id === "exp-tom-foolery";
                  const author = b.tradition
                    || (isHouseStaple ? "Herbanium house"
                       : b.synthetic ? "algorithmic experiment"
                       : b.id?.startsWith("local-") ? "your composition"
                       : b.experimental ? "Herbanium experiment"
                       : null);
                  const canDelete = !b.tradition && !isHouseStaple && deleteBlend;
                  return (
                    <div key={b.id} style={{ position: "relative" }}>
                      <BlendListRow
                        b={b}
                        author={author}
                        first={i === 0}
                        go={go}
                        startBrew={startBrew}
                        openBlend={openBlend}
                      />
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete "${b.name}" from your Catalogue?`)) {
                              deleteBlend(b.id);
                            }
                          }}
                          title="Delete from catalogue"
                          style={{
                            position: "absolute", top: 10, right: 8,
                            background: "transparent", border: "none",
                            color: theme.ash, fontSize: 14, lineHeight: 1,
                            padding: "4px 6px", cursor: "pointer",
                            opacity: 0.55,
                          }}
                        >✕</button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        }

        return (
          <div style={{ marginTop: 4 }}>
            {subTabHeader}
            <div style={{ marginBottom: 10 }}>
              <ChipRows
                items={["favorites", "all", "what worked", "calm", "focus", "energy", "comfort"]}
                renderItem={(f) => (
                  <Chip
                    key={f}
                    active={apothecaryFilter === f}
                    onClick={() => setApothecaryFilter(f)}
                  >{f}</Chip>
                )}
              />
            </div>

            {visible.length === 0 ? (
              <div style={{
                marginTop: 18, padding: "14px 16px",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                color: theme.ash, textAlign: "center", lineHeight: 1.5,
              }}>
                {emptyMsg}
              </div>
            ) : (
              <LibraryList
                blends={visible}
                highlightId={composePreselect?.blendId}
                compact
                go={go}
                startBrew={startBrew}
                openBlend={openBlend}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
};

export const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew, saveComposedBlend }) => {
  const [rcSaveName, setRcSaveName] = useState("");
  const [rcSavePromptOpen, setRcSavePromptOpen] = useState(false);
  const [rcSaveStatus, setRcSaveStatus] = useState(null);
  const { unit, weightUnit } = useUnit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const available = Object.keys(INGREDIENTS).filter(id => !reverseIngs.includes(id));
  const filteredAvailable = available
    .filter(id => {
      const ing = INGREDIENTS[id];
      if (filter !== "all" && ing.category !== filter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => INGREDIENTS[a].name.localeCompare(INGREDIENTS[b].name));

  // Derive temperature and time from the actual ingredients rather than hardcoding.
  // Uses range intersection when possible, weighted-grams dominance when not.
  const ingsForProfile = reverseIngs.map(id => ({ id, g: 1.0 }));
  const profile = computeBrewProfile(ingsForProfile);

  // Live brew state — lifted up so the compatibility warning reacts to the
  // user's slider movements in the BlendExtractionExplorer below.
  const [brewTempC, setBrewTempC] = useState(profile.tempC);
  const [brewTimeS, setBrewTimeS] = useState(profile.timeS);
  useEffect(() => {
    setBrewTempC(profile.tempC);
    setBrewTimeS(profile.timeS);
  }, [profile.tempC, profile.timeS]);

  // Custom user-built blend — no curator, no baseline. Every warning
  // fires immediately so the user exploring an arbitrary combination
  // sees the consequence of each slider position the moment it lands.
  const liveBrew = ingsForProfile.length > 0
    ? resolveBlendAtBrew(ingsForProfile, brewTempC, brewTimeS)
    : { outsiders: [], perIngredient: [] };
  const liveOutsiders = liveBrew.perIngredient?.filter(c => !c.inRange) || [];

  // For the picker: would adding this ingredient conflict with ANY ingredient
  // already in the pot? The rule: flag the candidate if there exists at least
  // one pot member whose temp range has zero overlap with the candidate's.
  // This is stricter as the pot grows — more pairs to check, more chances
  // of a conflict — which matches user intuition ("more stuff in = more risk").
  const tempConflictsWithPot = (candidateId) => {
    if (reverseIngs.length === 0) return false;
    const candidate = INGREDIENTS[candidateId];
    if (!candidate) return false;
    const [cLo, cHi] = candidate.tempC;
    return reverseIngs.some(id => {
      const [pLo, pHi] = INGREDIENTS[id].tempC;
      // Ranges [cLo,cHi] and [pLo,pHi] overlap iff max(cLo,pLo) <= min(cHi,pHi).
      // So they fail to overlap when max(cLo,pLo) > min(cHi,pHi).
      return Math.max(cLo, pLo) > Math.min(cHi, pHi);
    });
  };

  return (
    <>
      <SectionLabel n="i">What's in the pot?</SectionLabel>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {reverseIngs.map(id => (
          <div key={id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0",
          }}>
            <button
              onClick={() => go("ingredient", id)}
              style={{
                background: "transparent", border: "none", padding: 0,
                textAlign: "left", cursor: "pointer",
                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                display: "flex", alignItems: "baseline", gap: 4,
              }}
            >
              {INGREDIENTS[id].name}
              <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
              <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginLeft: 6 }}>
                {formatTempShort(INGREDIENTS[id].tempC[0], INGREDIENTS[id].tempC[1], unit)}
              </span>
            </button>
            <button onClick={() => setReverseIngs(reverseIngs.filter(x => x !== id))} style={{
              background: "transparent", border: "none", color: theme.ash, fontSize: 14, cursor: "pointer",
            }}>×</button>
          </div>
        ))}

        {/* Temperature-compatibility notice — reactive to the user's current
            slider values in the explorer below. Disappears when the user moves
            the temp into a range where every ingredient fits. */}
        {reverseIngs.length > 1 && liveOutsiders.length > 0 && (
          <div style={{
            marginTop: 10, padding: "8px 10px", borderRadius: 6,
            background: "rgba(165, 120, 54, 0.08)",
            border: `1px solid rgba(165, 120, 54, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <Kettle size={14} c={theme.ochre} />
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
              at <em style={{ fontStyle: "normal" }}>{formatTemp(brewTempC, unit)}</em>,{" "}
              <em>
                {liveOutsiders.map((c, i) => (
                  <React.Fragment key={c.id}>
                    {i > 0 && (i === liveOutsiders.length - 1 ? " and " : ", ")}
                    <button
                      onClick={() => go("ingredient", c.id)}
                      style={{
                        background: "transparent", border: "none", padding: 0, cursor: "pointer",
                        color: theme.ochre, fontStyle: "italic", textDecoration: "underline",
                        textDecorationStyle: "dotted", textUnderlineOffset: 3,
                        fontFamily: "inherit", fontSize: "inherit",
                      }}
                    >{c.name}</button>
                  </React.Fragment>
                ))}
              </em>
              {" "}will extract lightly.
            </div>
          </div>
        )}

        <Rule soft />
        <div style={{
          marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, fontFamily: ff.sans,
        }}>
          <span>add ingredient</span>
          <span style={{ letterSpacing: 0, textTransform: "none", fontStyle: "italic", fontFamily: ff.serif, fontSize: 11 }}>
            {filteredAvailable.length} in the apothecary
          </span>
        </div>

        {/* Search input */}
        <div style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: theme.ivory, border: `1px solid ${theme.ruleSoft}`,
        }}>
          <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search the apothecary…"
            style={{
              flex: 1, background: "transparent", border: "none",
              fontFamily: ff.serif, fontStyle: search ? "normal" : "italic",
              fontSize: 14, color: theme.ink, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "transparent", border: "none", color: theme.ash,
              fontSize: 12, cursor: "pointer",
            }}>×</button>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ marginTop: 8 }}>
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
              <button key={key} onClick={() => setFilter(key)} style={{
                fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                padding: "3px 9px", borderRadius: 999,
                border: `1px solid ${filter === key ? theme.ink : theme.ruleSoft}`,
                background: filter === key ? theme.ink : "transparent",
                color: filter === key ? theme.cream : theme.ash,
                cursor: "pointer",
              }}>{label}</button>
            )}
          />
        </div>

        {/* Scrollable results */}
        <div style={{
          marginTop: 10, maxHeight: 180, overflowY: "auto",
          paddingRight: 4,
        }}>
          {filteredAvailable.length === 0 ? (
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
              color: theme.ash, padding: "12px 0", textAlign: "center",
            }}>
              no match in your apothecary.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filteredAvailable.map(id => {
                const ing = INGREDIENTS[id];
                const catColor =
                  ing.category === "flower"    ? theme.ochre
                  : ing.category === "herbal"  ? theme.sage
                  : ing.category === "true tea" ? theme.sageDeep
                  : ing.category === "spice"    ? theme.terra
                  : ing.category === "adaptogen" ? theme.plum
                  : theme.ash;
                const isCaution = tempConflictsWithPot(id);
                return (
                  <button
                    key={id}
                    onClick={() => setReverseIngs([...reverseIngs, id])}
                    title={isCaution ? "Brewing temp doesn't overlap with the current pot" : undefined}
                    style={{
                      fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.02em",
                      padding: "5px 10px 5px 8px", borderRadius: 999,
                      border: isCaution ? `1px dashed ${theme.ochre}` : `1px solid ${theme.rule}`,
                      background: "transparent",
                      color: isCaution ? theme.ochre : theme.inkSoft,
                      opacity: isCaution ? 0.75 : 1,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      transition: "all .15s ease",
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: catColor, flexShrink: 0,
                    }} />
                    {ing.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}><SectionLabel n="ii">This will likely be…</SectionLabel></div>
      {ingsForProfile.length === 0 ? (
        <div style={{
          marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
          background: theme.cream,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash,
        }}>
          Add a few ingredients to see a prediction.
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <BlendExtractionExplorer
            ingredients={ingsForProfile}
            defaultTempC={profile.tempC}
            defaultTimeS={profile.timeS}
            tempC={brewTempC}
            setTempC={setBrewTempC}
            timeS={brewTimeS}
            setTimeS={setBrewTimeS}
            compact
            experimental
          />
        </div>
      )}

      {rcSavePromptOpen && (
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: 8,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <input
            autoFocus
            value={rcSaveName}
            onChange={(e) => setRcSaveName(e.target.value)}
            placeholder="name your blend"
            maxLength={48}
            style={{
              fontFamily: ff.serif, fontSize: 16, color: theme.ink,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${theme.terra}`,
              padding: "4px 2px", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => { setRcSavePromptOpen(false); setRcSaveStatus(null); }}
              style={{
                fontFamily: ff.sans, fontSize: 12, color: theme.ash,
                padding: "6px 12px", borderRadius: 999,
                background: "transparent", border: "none", cursor: "pointer",
              }}
            >cancel</button>
            <button
              onClick={() => {
                const id = saveComposedBlend && saveComposedBlend(
                  { name: rcSaveName.trim() || "Untitled blend", ingredients: ingsForProfile, tempC: brewTempC, timeS: brewTimeS },
                  rcSaveName,
                );
                if (id) {
                  setRcSaveStatus({ kind: "ok", text: `Saved as "${rcSaveName.trim() || 'Untitled blend'}"` });
                  setRcSavePromptOpen(false);
                  setRcSaveName("");
                  setTimeout(() => setRcSaveStatus(null), 2000);
                }
              }}
              style={{
                fontFamily: ff.serif, fontSize: 14,
                padding: "6px 16px", borderRadius: 999,
                background: theme.ink, color: theme.cream,
                border: "none", cursor: "pointer",
              }}
            >save</button>
          </div>
        </div>
      )}
      {rcSaveStatus && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 8,
          background: "rgba(98,124,92,0.10)", border: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.sageDeep,
          textAlign: "center",
        }}>{rcSaveStatus.text}</div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          disabled={!saveComposedBlend || reverseIngs.length === 0}
          onClick={() => {
            setRcSaveName("");
            setRcSavePromptOpen(true);
            setRcSaveStatus(null);
          }}
          style={{
            fontFamily: ff.sans, fontSize: 13, color: theme.terra,
            padding: "12px 18px", borderRadius: 10,
            background: "transparent", border: `1px solid ${theme.terra}`,
            cursor: reverseIngs.length === 0 ? "not-allowed" : "pointer",
            opacity: reverseIngs.length === 0 ? 0.4 : 1,
          }}
        >save</button>
        <button onClick={() => startBrew({ name: "Untitled blend", ingredients: ingsForProfile, tempC: brewTempC, timeS: brewTimeS }, "", ["calm"])} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 16,
          padding: "12px 16px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
        }}>start brewing</button>
      </div>
    </>
  );
};
