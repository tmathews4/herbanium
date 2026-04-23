/* ──────────────────────────────────────────────────────────────
   screens/ComposeScreen.jsx — Compose screen and its ReverseCompose sibling.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  computeBrewProfile, resolveCandidates,
} from "../algo/compose";
import { EffectBar } from "../components/EffectBar";
import {
  Flower, Kettle,
} from "../components/icons";
import {
  Chip, ChipRows, Rule, SectionLabel,
} from "../components/layout";
import {
  BLENDS, FLAVOR_CONFLICTS, MOOD_CONFLICTS,
} from "../data/blends";
import {
  FLAVORS, INGREDIENTS, MOODS,
} from "../data/ingredients";
import { iconBtn, mmss } from "../helpers/misc";;
import {
  ff, theme,
} from "../theme";
import {
  formatAmount, formatTemp, formatTempRange, formatTempShort, useUnit,
} from "../units/units";
import { LibraryList, BlendListRow } from "./LibraryScreen";

/* ──────────────────────────────────────────────────────────────
   Screen: COMPOSE
   ────────────────────────────────────────────────────────────── */

export const ComposeScreen = ({ go, startBrew, savedBlendIds, openBlend, composePreselect, openInCompose, pantryIds }) => {
  const { unit, weightUnit } = useUnit();
  const [mode, setMode] = useState("forward"); // forward | reverse | library | traditions
  const [moods, setMoods] = useState([]);        // start empty — user sets their intent
  const [flavors, setFlavors] = useState([]);    // multi-select, same pattern as moods
  const [onlyPantry, setOnlyPantry] = useState(false);
  const [reverseIngs, setReverseIngs] = useState(["chamomile", "lemonbalm"]);
  // Which axis leads: "feel" (mood-primary) or "taste" (flavor-primary).
  // Changes which side shows as the prominent row and which axis the
  // resolver varies across for alternate candidates.
  const [primaryAxis, setPrimaryAxis] = useState("feel");

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to the Apothecary sub-tab so the
  // user sees their saved recipe highlighted, ready to set intent and brew.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("library");
  }, [composePreselect?.at]);

  const toggleMood = (m) => {
    setMoods(prev => {
      if (prev.includes(m)) return prev.filter(x => x !== m);
      if (prev.length >= 3) return [...prev.slice(1), m];
      return [...prev, m];
    });
  };

  const toggleFlavor = (f) => {
    setFlavors(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      if (prev.length >= 3) return [...prev.slice(1), f];
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
  const primaryFlavor = flavors[0] || null;
  const rawCandidates = resolveCandidates(moods, primaryFlavor, primaryAxis);

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

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* Segmented control */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
        marginBottom: 14, background: theme.cream,
      }}>
        {[
          ["forward",    "Compose"],
          ["reverse",    "Blend"],
          ["library",    "Apothecary"],
          ["traditions", "Traditions"],
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
                     "3 selected · at the limit"}
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

          {/* Temperature-compromise warning — fires when the resolved blend's
              ingredients don't share a brewing window. Currently rare (curated
              mood blends were designed to agree), but reserved for future
              blends that mix ingredients with disjoint temp ranges. */}
          {!blend.empty && blend.compatible === false && blend.outsiders?.length > 0 && (
            <div style={{
              marginTop: 14, padding: "8px 10px", borderRadius: 6,
              background: "rgba(165, 120, 54, 0.08)",
              border: `1px solid rgba(165, 120, 54, 0.22)`,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
              color: theme.inkSoft, lineHeight: 1.45,
            }}>
              <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
              these ingredients don't all share a brewing window.{" "}
              <em>
                {blend.outsiders.map((id, i) => (
                  <React.Fragment key={id}>
                    {i > 0 && (i === blend.outsiders.length - 1 ? " and " : ", ")}
                    {INGREDIENTS[id]?.name || id}
                  </React.Fragment>
                ))}
              </em>
              {" "}will extract lightly at this temp — fine as accents, worth rethinking if they carry the blend.
            </div>
          )}

          {/* Primary action: brew the current blend. Placed here, right after
              mood/flavor selection, so the decision-to-action path is reachable
              without scrolling. Pantry toggle, candidate selector, and blend
              card detail all live below for users who want to refine. */}
          <button
            disabled={blend.empty}
            onClick={() => startBrew(blend, "", moods)}
            style={{
              width: "100%", marginTop: 20,
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
                  return (
                    <button key={i} onClick={() => setSelectedIdx(i)} style={{
                      flex: "0 0 auto", minWidth: 130, maxWidth: 170,
                      textAlign: "left",
                      padding: "8px 10px", borderRadius: 10,
                      border: `1px solid ${isSelected ? theme.ink : theme.rule}`,
                      background: isSelected ? theme.ink : "transparent",
                      color: isSelected ? theme.cream : theme.inkSoft,
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      <div style={{
                        fontFamily: ff.sans, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isSelected ? "rgba(243,236,220,0.6)" : theme.ash,
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
              blend.ingredients.map(({ id, g }) => {
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
              })
            )}

            <div style={{ margin: "14px 0", height: 1, background: theme.ruleSoft }} />

            <div style={{ display: "flex", gap: 16, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{formatTemp(blend.tempC, unit)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
                <div style={{ fontFamily: ff.serif, fontSize: 18, color: theme.ink }}>{mmss(blend.timeS)}</div>
              </div>
              <div style={{ flex: 1 }} />
              <button style={{
                fontFamily: ff.sans, fontSize: 11, color: theme.ash,
                background: "transparent", border: `1px solid ${theme.rule}`,
                borderRadius: 999, padding: "4px 10px", cursor: "pointer",
              }}>why this temp?</button>
            </div>

            {blend.effects.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <SectionLabel>Predicted effect</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {blend.effects.map(([tag, n], i) => (
                    <EffectBar
                      key={tag}
                      label={tag}
                      value={n}
                      color={
                        tag === "bitterness" ? theme.terra
                        : i === 0           ? theme.sage
                        : i === 1           ? theme.ochre
                        : theme.sky
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={iconBtn()}>↻ shuffle</button>
            <button style={iconBtn()}>✎ tweak</button>
          </div>
        </>
      )}

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} />
      )}

      {mode === "library" && (
        <LibraryList
          blends={BLENDS.filter(b => savedBlendIds.has(b.id))}
          highlightId={composePreselect?.blendId}
          compact go={go} startBrew={startBrew}
        />
      )}

      {mode === "traditions" && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5, marginBottom: 14,
          }}>
            Classic preparations, taught the way they're traditionally made.
            Tap any to open its recipe or start brewing.
          </div>
          {BLENDS.filter(b => b.tradition).map((b, i) => (
            <BlendListRow key={b.id} b={b} author={b.tradition} first={i === 0} go={go} startBrew={startBrew} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew }) => {
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
  // derive predicted effects as weighted sum
  const totals = {};
  reverseIngs.forEach(id => {
    INGREDIENTS[id].effects.forEach(([tag, n]) => { totals[tag] = (totals[tag] || 0) + n; });
  });
  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]).slice(0,3);
  const maxT = Math.max(1, ...sorted.map(x => x[1]));

  // Derive temperature and time from the actual ingredients rather than hardcoding.
  // Uses range intersection when possible, weighted-grams dominance when not.
  const ingsForProfile = reverseIngs.map(id => ({ id, g: 1.0 }));
  const profile = computeBrewProfile(ingsForProfile);

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

        {/* Temperature-compatibility notice — inline with the pot so users see
            it while looking at the ingredient list, not buried below the adder. */}
        {reverseIngs.length > 1 && !profile.compatible && (
          <div style={{
            marginTop: 10, padding: "8px 10px", borderRadius: 6,
            background: "rgba(165, 120, 54, 0.08)",
            border: `1px solid rgba(165, 120, 54, 0.22)`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <Kettle size={14} c={theme.ochre} />
            <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5, color: theme.inkSoft, lineHeight: 1.45 }}>
              <em style={{ color: theme.ochre, fontStyle: "normal", fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6 }}>temperature compromise</em>
              these don't share a brewing window.
              {profile.outsiders.length > 0 && (
                <> at <em style={{ fontStyle: "normal" }}>{formatTemp(profile.tempC, unit)}</em>,{" "}
                  <em>
                    {profile.outsiders.map((id, i) => (
                      <React.Fragment key={id}>
                        {i > 0 && (i === profile.outsiders.length - 1 ? " and " : ", ")}
                        <button
                          onClick={() => go("ingredient", id)}
                          style={{
                            background: "transparent", border: "none", padding: 0, cursor: "pointer",
                            color: theme.ochre, fontStyle: "italic", textDecoration: "underline",
                            textDecorationStyle: "dotted", textUnderlineOffset: 3,
                            fontFamily: "inherit", fontSize: "inherit",
                          }}
                        >{INGREDIENTS[id].name}</button>
                      </React.Fragment>
                    ))}
                  </em>
                  {" "}will extract lightly.
                </>
              )}
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
            {filteredAvailable.length} on the shelf
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
            placeholder="search the shelf…"
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
              no match on your shelf.
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
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {sorted.length === 0 ? (
          <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, padding: "6px 0" }}>
            Add a few ingredients to see a prediction.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(([tag, n], i) => (
              <EffectBar key={tag} label={tag} value={Math.round((n / maxT) * 5)} color={i === 0 ? theme.sage : i === 1 ? theme.ochre : theme.terra} />
            ))}
          </div>
        )}
        <Rule soft />
        <div style={{ marginTop: 10, display: "flex", gap: 14, fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Water</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>
              {formatTemp(profile.tempC, unit)}
              {profile.tempRange && profile.tempRange[0] !== profile.tempRange[1] && (
                <span style={{ fontSize: 11, fontStyle: "italic", color: theme.ash, marginLeft: 4 }}>
                  (range {formatTempRange(profile.tempRange[0], profile.tempRange[1], unit)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash }}>Steep</div>
            <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink }}>{mmss(profile.timeS)}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: profile.compatible ? theme.sageDeep : theme.ochre,
          }}>
            {reverseIngs.length <= 1 ? "" : profile.compatible ? "✓ compatible" : "⚠ compromise"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={iconBtn()}>save as recipe</button>
        <button onClick={() => startBrew({ name: "Untitled blend", ingredients: ingsForProfile, tempC: profile.tempC, timeS: profile.timeS }, "", ["calm"])} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 16,
          padding: "12px 16px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
        }}>start brewing</button>
      </div>
    </>
  );
};
