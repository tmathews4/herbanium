/* ──────────────────────────────────────────────────────────────
   screens/ComposeScreen.jsx — Compose screen and its ReverseCompose sibling.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  computeBrewProfile, resolveCandidates, resolveBlendAtBrew,
} from "../algo/compose";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import {
  Flower, Kettle, Ornament,
} from "../components/icons";
import {
  Button, Chip, ChipRows, Rule, SectionLabel, FitOneLine,
} from "../components/layout";
import {
  BLENDS, FLAVOR_CONFLICTS, FLAVORS, FLAVOR_FAMILY_CHIPS,
  MOOD_CONFLICTS, MOODS,
} from "../data/blends";
import { FAMILY_BY_FLAVOR } from "../components/FlavorMap";
import { INGREDIENTS } from "../data/ingredients";
import { checkIngredientInteractions } from "../data/safety";
import { getBlend, iconBtn, suggestBlendName, formatAgo } from "../helpers/misc";
import {
  ff, theme, shadow, radius,
} from "../theme";
import {
  formatAmount, formatTemp, formatTempRange, formatTempShort, useUnit,
} from "../units/units";
import { BlendListRow, LibraryScreen } from "./LibraryScreen";
import { SessionRow } from "./HomeScreen";
import { JournalComposer } from "../components/JournalComposer";
import { Planner } from "../components/Planner";
import { HintCard } from "../components/HintCard";
import { BestiaryView } from "../components/BestiaryView";
import { Sprig, Pencil } from "../components/icons";

// Stable signature for an ingredient list — same ids with same grams,
// order-independent. Used to detect when a candidate brew already
// exists in the user's catalogue under a different name.
function ingredientsKey(ings) {
  return (ings || [])
    .map(i => `${i.id}:${Number(i.g ?? 0).toFixed(2)}`)
    .sort()
    .join("|");
}

// Find a catalogue entry that matches the candidate by tempC and
// ingredient set (ids + grams). Returns the matched blend or null.
// Skips entries the user has hidden.
function findDuplicateBlend(candidate, allBlends, hidden) {
  if (!candidate || !candidate.ingredients?.length) return null;
  const tempC = candidate.tempC;
  const key = ingredientsKey(candidate.ingredients);
  const skipped = hidden || new Set();
  return allBlends.find(b =>
    !skipped.has(b.id)
    && b.tempC === tempC
    && ingredientsKey(b.ingredients) === key
  ) || null;
}

/* ──────────────────────────────────────────────────────────────
   Screen: COMPOSE
   ────────────────────────────────────────────────────────────── */

export const ComposeScreen = ({ section = "apothecary", go, startBrew, savedBlendIds, favoriteBlendIds, generatedBlends, hiddenBlendIds, deleteBlend, unhideBlend, saveComposedBlend, openBlend, openCup, openEntry, composePreselect, composeView, openInCompose, pantryIds, togglePantry, sessions = [], journalEntries = [], addJournalEntry, deleteJournalEntry, plannerItems = [], addPlannerItem, togglePlannerItem, editPlannerItem, deletePlannerItem, clearDonePlannerItems, composeHintShown, dismissComposeHint, journalHintShown, dismissJournalHint, pantryHintShown, dismissPantryHint, profile, tabVisits, elementalsDisabled, omenShown, dismissOmen, seenElementalIds, setSeenElementalIds, featuredElementals, setFeaturedElementals, wildElementals, bestiaryHintShown, dismissBestiaryHint, mode, setMode, setModeUserAction, catalogueFilter, setCatalogueFilter }) => {
  // Save-prompt state for the forward (Vibe) compose flow.
  const [saveName, setSaveName] = useState("");
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  // Brew-save confirmation state — when the user clicks "start brewing"
  // on a custom blend that isn't in their catalogue yet, prompt before
  // brewing so they can save first if they want.
  const [brewAsk, setBrewAsk] = useState(false);
  const [pendingBrew, setPendingBrew] = useState(null);
  // Journal composer visibility — toggled by the "+ new entry" button
  // on Compose · Shelf · Journal.
  const [journalComposerOpen, setJournalComposerOpen] = useState(false);
  // Close the composer whenever the user navigates away from the
  // journal sub-view — switching apothecary/shelf mode, switching
  // section, or moving to a different journal sub-tab. Without this
  // the composer's open flag could outlive the journal context that
  // surfaced it; the next time the user landed back on the journal
  // tab it could re-render an unintended writing surface.
  React.useEffect(() => {
    setJournalComposerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, mode]);
  // Section-aware mode clamp. Each section has a fixed set of valid
  // sub-modes (apothecary: reverse / forward / compendium; shelf:
  // recipes / journal / pantry). If the mode somehow drifts into an
  // out-of-section value — usually because a deep-link from the
  // other section was applied before the section guard caught it —
  // snap back to the section's default. Belt-and-suspenders for the
  // composeView section tag above.
  React.useEffect(() => {
    const apothecaryModes = new Set(["reverse", "forward", "compendium"]);
    const shelfModes      = new Set(["recipes", "journal", "pantry"]);
    if (section === "apothecary" && !apothecaryModes.has(mode)) {
      setMode("reverse");
    } else if (section === "shelf" && !shelfModes.has(mode)) {
      setMode("recipes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, mode]);
  // Journal timeline filter — default "all" shows cups + entries.
  // Deep-links can preset it via composeView.journalFilter (e.g. the
  // Home recent-brews 'see all' link sets it to "cups").
  const [journalFilter, setJournalFilter] = useState("all");
  // Planner inline collapse — folded by default in the journal so
  // the timeline reads first. The brew-page modal is independent.
  const [plannerInlineOpen, setPlannerInlineOpen] = useState(false);
  // Planner props passed inline into the Shelf > Journal section.
  // The brew-time modal trigger lives on SteepScreen, not here.
  const plannerProps = {
    items: plannerItems || [],
    onAdd: addPlannerItem,
    onToggle: togglePlannerItem,
    onEdit: editPlannerItem,
    onDelete: deletePlannerItem,
    onClearDone: clearDonePlannerItems,
  };
  const { unit, weightUnit } = useUnit();
  // Mode universe per section (state lives in App so the bottom
  // TabBar can render the sub-tabs as part of the same dock):
  //   apothecary: reverse (Blend) | forward (Vibe) | compendium
  //   shelf:      recipes | journal | pantry (bestiary nested under journal)
  // Secondary toggle inside the Journal sub-tab — flips between the
  // brew/entry timeline and the elemental Bestiary that used to sit
  // as its own primary tab.
  const [journalSubTab, setJournalSubTab] = useState("journal"); // journal | bestiary
  // Switching between Journal and Bestiary inside the journal mode
  // also dismisses an open composer — the writing surface belongs
  // to the journal sub-tab and shouldn't bleed across.
  React.useEffect(() => {
    setJournalComposerOpen(false);
  }, [journalSubTab]);
  const [apothecaryFilter, setApothecaryFilter] = useState("favorites");
  const [shelfTab, setShelfTab] = useState("blends"); // blends | catalogue | journal
  const [moods, setMoods] = useState([]);        // start empty — user sets their intent
  const [flavors, setFlavors] = useState([]);    // multi-select, same pattern as moods
  const [onlyPantry, setOnlyPantry] = useState(false);
  const [reverseIngs, setReverseIngs] = useState([]);
  // Which axis leads: "feel" (mood-primary) or "taste" (flavor-primary).
  // Changes which side shows as the prominent row and which axis the
  // resolver varies across for alternate candidates.
  // primaryAxis was a user-facing "by feel / by taste" toggle that
  // told the algorithm which axis (mood vs flavor) to lead the
  // candidate ranking with. Removed from the UI — users can pick
  // moods, flavors, or both, and the engine treats each selection
  // as an honest filter without an explicit lead. The compose.js
  // helpers still accept the parameter; we pin it to "feel" for
  // backward compatibility with their internal name/score logic.
  const primaryAxis = "feel";

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to Recipe Book / favorites so
  // the user sees their saved recipe highlighted, ready to set intent.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("recipes");
    setCatalogueFilter("favorites");
  }, [composePreselect?.at]);

  // Deep-link from Profile stats: lands on Compose with the requested
  // sub-mode/tab pre-selected. The section guard prevents a deep-link
  // intended for one section (e.g. shelf-journal) from leaking into
  // the other section's mode the next time it mounts — both
  // apothecary and shelf instances of ComposeScreen read the same
  // composeView object, so without this guard switching tabs after
  // a deep-link would replay the mode in the wrong section.
  React.useEffect(() => {
    if (!composeView) return;
    if (composeView.section && composeView.section !== section) return;
    if (composeView.mode) setMode(composeView.mode);
    if (composeView.shelfTab) setShelfTab(composeView.shelfTab);
    if (composeView.journalFilter) setJournalFilter(composeView.journalFilter);
    if (composeView.journalSubTab) setJournalSubTab(composeView.journalSubTab);
  }, [composeView?.at]);

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
          ? "add ingredients to your cabinet first"
          : "no blends from what you have on hand")
      : "pick a mood or flavor to begin",
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
  // Filter on tempRange specifically — this banner's copy explicitly
  // names a temperature ("don't all share a brewing window at X°"),
  // so a time-only outsider would mislead the reader (e.g. an apple
  // at 100°C but only steeped 60s isn't a temp problem). Time-axis
  // pulls are surfaced by the over-/under-steep warnings instead.
  const liveOutsiders = atCuratedBaseline
    ? []
    : (liveBrew.perIngredient || []).filter(c => !c.inTempRange && (c.role === "lead" || c.role == null));

  // Ingredient-interaction safety flags (high + moderate). Surfaced
  // below the temperature-compromise banner so the user sees both
  // brewing and safety considerations in one place.
  const safetyFlags = !blend.empty
    ? checkIngredientInteractions(effectiveIngredients)
    : [];

  return (
    <div style={{ padding: "18px 20px 24px", fontFamily: ff.sans }}>
      {mode === "forward" && (
        <>
          {(() => {
            const moodRow = (
              <div key="mood-row">
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <SectionLabel n="ii">Desired mood</SectionLabel>
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
                  }}>
                    {moods.length === 0 ? "pick any · optional" :
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
              <div key="flavor-row">
                <div style={{ marginTop: 20 }}>
                  <SectionLabel n="iii">Flavor direction</SectionLabel>
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

            return [moodRow, flavorRow];
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
            only use what's in my cabinet
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

          {/* Generated blend card. overflow stays "visible" so the
              Save / Start brewing buttons at the bottom can paint
              their drop shadow past the card's border — overflow:
              hidden was clipping the shadow flat. */}
          <div style={{
            marginTop: candidates.length > 1 ? 12 : 22, padding: 18, borderRadius: 14,
            border: `1px solid ${theme.rule}`, background: theme.cream,
            position: "relative",
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
            <FitOneLine
              text={blend.subtitle}
              baseSize={13}
              minSize={9.5}
              style={{
                fontFamily: ff.serif, fontStyle: "italic",
                color: theme.ash, marginTop: 2,
              }}
            />

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
                    topEffect ? topEffect[0] : null,
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
                isTraditional={!!blend.tradition}
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

            {/* Ingredient-interaction safety banners. High-severity
                stacks (e.g. licorice + a diuretic herb, valerian +
                ashwagandha) read red; moderate ones (additive sedation,
                vitamin-K stack, antiplatelet stack) read yellow. */}
            {safetyFlags.map(flag => {
              const high = flag.severity === "high";
              return (
                <div key={flag.id} style={{
                  marginTop: 14, padding: "8px 10px", borderRadius: 6,
                  background: high ? "rgba(176, 64, 48, 0.10)" : "rgba(165, 120, 54, 0.08)",
                  border: high ? `1px solid rgba(176, 64, 48, 0.30)` : `1px solid rgba(165, 120, 54, 0.22)`,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: theme.inkSoft, lineHeight: 1.45,
                }}>
                  <em style={{
                    color: high ? "rgb(176, 64, 48)" : theme.ochre,
                    fontStyle: "normal", fontFamily: ff.sans, fontSize: 10,
                    letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6,
                  }}>{high ? "skip this combination" : "heads up"} · {flag.title}</em>
                  {flag.message}
                </div>
              );
            })}

            {/* Save / brew row. Save prompts for a name (defaults to the
                algorithm-suggested one); brew goes straight into Steep. */}
            {savePromptOpen && (
              <div style={{
                marginTop: 14, padding: "12px 14px", borderRadius: 10,
                background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{
                  fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: theme.ash,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>Name</span>
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic",
                    fontSize: 10.5, letterSpacing: 0,
                    textTransform: "none", color: theme.terra,
                  }}>— suggested from your ingredients, edit anything below</span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(176, 84, 47, 0.05)",
                  border: `1px solid ${theme.terra}`,
                }}>
                  <Pencil size={14} c={theme.terra} />
                  <input
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="name your blend"
                    maxLength={48}
                    style={{
                      flex: 1, minWidth: 0,
                      fontFamily: ff.serif, fontSize: 16, color: theme.ink,
                      background: "transparent", border: "none",
                      padding: "2px 0", outline: "none",
                    }}
                  />
                  {saveName && (
                    <button
                      onClick={() => setSaveName("")}
                      aria-label="clear name"
                      title="clear"
                      style={{
                        background: "transparent", border: "none",
                        color: theme.ash, fontSize: 14, lineHeight: 1,
                        padding: "2px 4px", cursor: "pointer",
                      }}
                    >×</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => { setSavePromptOpen(false); setSaveStatus(null); }}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary" tone="ink"
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
                      } else {
                        // saveComposedBlend returned falsy — most likely
                        // a duplicate name collision or a missing handler.
                        // Surface it so the user isn't left wondering why
                        // nothing happened. Stays on screen longer than
                        // the success toast since failure copy needs a
                        // beat to read.
                        setSaveStatus({
                          kind: "err",
                          text: "Couldn't save — try a different name or check the recipe.",
                        });
                        setTimeout(() => setSaveStatus(null), 3500);
                      }
                    }}
                    style={{ fontSize: 14, padding: "10px 24px" }}
                  >Save</Button>
                </div>
              </div>
            )}
            {saveStatus && (
              <div style={{
                marginTop: 10, padding: "6px 10px", borderRadius: 8,
                background: saveStatus.kind === "err"
                  ? "rgba(176,84,47,0.08)"
                  : "rgba(98,124,92,0.10)",
                border: `1px solid ${saveStatus.kind === "err" ? theme.terra : theme.ruleSoft}`,
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
                color: saveStatus.kind === "err" ? theme.terra : theme.sageDeep,
                textAlign: "center",
              }}>{saveStatus.text}</div>
            )}
            {/* Save / Start brewing pair. Same height + type as the
                BlendDetail Brew CTA, mirrored across both buttons so
                the row reads as a balanced pair rather than two
                stacked styles. */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button
                variant="secondary"
                disabled={blend.empty}
                onClick={() => {
                  setSaveName(suggestBlendName(effectiveIngredients));
                  setSavePromptOpen(true);
                  setSaveStatus(null);
                }}
                style={{ fontSize: 14, padding: "10px 18px" }}
              >Save</Button>
              <Button
                variant="primary"
                disabled={blend.empty}
                onClick={() => {
                  const candidate = { ...blend, ingredients: effectiveIngredients, tempC: brewTempC, timeS: brewTimeS };
                  const isCustomUnsaved =
                    !blend.id
                    || String(blend.id).startsWith("synth-")
                    || (addedIngIds && addedIngIds.length > 0)
                    || (String(blend.id).startsWith("local-") && savedBlendIds && !savedBlendIds.has(blend.id));
                  if (isCustomUnsaved) {
                    const allCatalogue = [
                      ...BLENDS,
                      ...((generatedBlends || []).filter(b => !BLENDS.find(x => x.id === b.id))),
                    ];
                    const dup = findDuplicateBlend(candidate, allCatalogue, hiddenBlendIds);
                    if (dup) {
                      startBrew({ ...dup, tempC: candidate.tempC, timeS: candidate.timeS }, "", moods);
                      return;
                    }
                    setPendingBrew({ candidate, moods: [...moods] });
                    setBrewAsk(true);
                    return;
                  }
                  startBrew(candidate, "", moods);
                }}
                icon={<Kettle size={17} c={theme.cream} />}
                style={{ flex: 1, fontSize: 14, padding: "10px 14px", gap: 8 }}
              >Start brewing</Button>
            </div>

            {/* Confirm-before-brew dialog for custom unsaved blends. */}
            {brewAsk && pendingBrew && (
              <BrewSavePrompt
                defaultName={suggestBlendName(pendingBrew.candidate.ingredients)}
                onSaveAndBrew={(chosenName) => {
                  if (saveComposedBlend) {
                    const id = saveComposedBlend(pendingBrew.candidate, chosenName);
                    if (id) {
                      const persisted = { ...pendingBrew.candidate, id, name: chosenName };
                      startBrew(persisted, "", pendingBrew.moods);
                    }
                  }
                  setBrewAsk(false);
                  setPendingBrew(null);
                }}
                onJustBrew={() => {
                  startBrew(pendingBrew.candidate, "", pendingBrew.moods);
                  setBrewAsk(false);
                  setPendingBrew(null);
                }}
                onCancel={() => { setBrewAsk(false); setPendingBrew(null); }}
              />
            )}
          </div>
        </>
      )}

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} saveComposedBlend={saveComposedBlend} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} />
      )}

      {mode === "journal" && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
          marginBottom: 14, background: theme.cream,
        }}>
          {[
            ["journal",  "Journal"],
            ["bestiary", "Bestiary"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setJournalSubTab(k)} style={{
              fontFamily: ff.serif, fontSize: 13, fontStyle: "italic",
              padding: "9px 4px", cursor: "pointer",
              background: journalSubTab === k ? theme.terra : "transparent",
              color: journalSubTab === k ? theme.cream : theme.inkSoft,
              border: "none",
            }}>{label}</button>
          ))}
        </div>
      )}

      {mode === "journal" && journalSubTab === "bestiary" && (
        <BestiaryView
          profile={profile}
          sessions={sessions}
          savedBlendIds={savedBlendIds}
          pantryIds={pantryIds}
          journalEntries={journalEntries}
          tabVisits={tabVisits}
          elementalsDisabled={elementalsDisabled}
          omenShown={omenShown}
          dismissOmen={dismissOmen}
          seenElementalIds={seenElementalIds}
          setSeenElementalIds={setSeenElementalIds}
          featuredElementals={featuredElementals}
          setFeaturedElementals={setFeaturedElementals}
          wildElementals={wildElementals}
          bestiaryHintShown={bestiaryHintShown}
          dismissBestiaryHint={dismissBestiaryHint}
        />
      )}

      {mode === "journal" && journalSubTab === "journal" && (() => {
        // Merge cup sessions and free-form journal entries by
        // timestamp so the journal reads as a single chronology.
        // Sessions stamp ts off their numeric id (sess-<ts>); entries
        // carry an explicit ts field.
        const yourSessions = (sessions || []).filter(s => s.who === "you");
        const sessionItems = yourSessions.map(s => {
          const n = parseInt(String(s?.id || "").replace("sess-", ""), 10);
          return { kind: "cup", ts: Number.isFinite(n) ? n : 0, ref: s };
        });
        const entryItems = (journalEntries || []).map(e => ({
          kind: "entry",
          ts: e.ts || 0,
          ref: e,
        }));
        const timelineFull = [...sessionItems, ...entryItems]
          .sort((a, b) => b.ts - a.ts);
        const timeline = timelineFull.filter(item =>
          journalFilter === "all"     ? true
          : journalFilter === "cups"  ? item.kind === "cup"
          : journalFilter === "entries" ? item.kind === "entry"
          : true
        );

        // Date-grouped sections. Buckets cascade by recency:
        //   Today / Yesterday / This week / Earlier this month /
        //   then "Month YYYY" for everything older. Reads as a
        //   journal rather than a feed — the eye scans by date
        //   header, not by counting rows back from now.
        const startOfDay = (d) => {
          const x = new Date(d);
          x.setHours(0, 0, 0, 0);
          return x.getTime();
        };
        const now = new Date();
        const todayStart     = startOfDay(now);
        const yesterdayStart = todayStart - 86400000;
        const weekStart      = todayStart - 6 * 86400000;
        const monthStart     = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        const monthLabel = (ts) => {
          const d = new Date(ts);
          return d.toLocaleString(undefined, { month: "long", year: "numeric" });
        };
        const bucketFor = (ts) => {
          if (ts >= todayStart)     return { key: "today",     label: "Today" };
          if (ts >= yesterdayStart) return { key: "yesterday", label: "Yesterday" };
          if (ts >= weekStart)      return { key: "this-week", label: "This week" };
          if (ts >= monthStart)     return { key: "this-month", label: "Earlier this month" };
          return { key: `m-${monthLabel(ts)}`, label: monthLabel(ts) };
        };
        // Group while preserving order — timeline is already sorted
        // newest-first, so iterating once produces buckets in display
        // order without an extra sort.
        const groups = [];
        let current = null;
        for (const item of timeline) {
          const b = bucketFor(item.ts || 0);
          if (!current || current.key !== b.key) {
            current = { ...b, items: [] };
            groups.push(current);
          }
          current.items.push(item);
        }

        // Stats strip — quietly frames the page as a record. "Keeping
        // since" reads off the earliest ts across cups + entries (the
        // unfiltered set so the figure doesn't shift when the user
        // toggles the cups/entries chips).
        const allTimes = timelineFull.map(it => it.ts).filter(t => t > 0);
        const earliest = allTimes.length ? Math.min(...allTimes) : null;
        const cupCount   = sessionItems.length;
        const entryCount = entryItems.length;

        return (
          <div style={{ marginTop: 4 }}>
            {/* Planner — collapsed by default; the journal timeline
                reads first. Click the header to expand. The brew-page
                modal still opens the same shared state. */}
            <div style={{ marginBottom: 14 }}>
              {(() => {
                const items = plannerProps.items || [];
                const openCount = items.filter(i => !i.done).length;
                return (
                  <div style={{
                    borderRadius: 10,
                    border: `1px solid ${theme.ruleSoft}`,
                    background: theme.cream,
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setPlannerInlineOpen(o => !o)}
                      aria-expanded={plannerInlineOpen}
                      style={{
                        width: "100%", textAlign: "left",
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.18em",
                        textTransform: "uppercase", color: theme.sageDeep,
                      }}>
                        <span style={{
                          display: "inline-block",
                          transform: plannerInlineOpen ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.15s ease",
                          color: theme.terra,
                        }}>›</span>
                        <span>Planner</span>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                        color: theme.ash,
                      }}>
                        {items.length > 0 ? `${openCount}/${items.length} open` : "empty"}
                        {openCount > 0 && (
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: theme.terra,
                            display: "inline-block",
                          }} />
                        )}
                      </div>
                    </button>
                    {plannerInlineOpen && (
                      <div style={{ padding: "0 8px 8px" }}>
                        <Planner {...plannerProps} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 8, marginBottom: 10, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  ["all",     "All"],
                  ["cups",    "Cups"],
                  ["entries", "Entries"],
                ].map(([key, label]) => {
                  const active = journalFilter === key;
                  const count = key === "cups"
                    ? sessionItems.length
                    : key === "entries"
                      ? entryItems.length
                      : timelineFull.length;
                  return (
                    <button
                      key={key}
                      onClick={() => setJournalFilter(key)}
                      style={{
                        fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.04em",
                        padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                        background: active ? theme.ink : "transparent",
                        color: active ? theme.cream : theme.ash,
                        border: `1px solid ${active ? theme.ink : theme.rule}`,
                        boxShadow: active ? "0 2px 6px -1px rgba(30,24,18,0.22)" : "0 1px 2px rgba(30,24,18,0.05)",
                        transition: "all 0.18s ease",
                      }}
                    >{label}{count > 0 && (
                      <span style={{
                        marginLeft: 5, opacity: 0.7,
                        fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5,
                      }}>{count}</span>
                    )}</button>
                  );
                })}
              </div>
              <button
                onClick={() => setJournalComposerOpen(o => !o)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                  color: theme.terra,
                  background: "transparent",
                  border: `1px solid ${theme.terra}`, borderRadius: 999,
                  padding: "5px 12px", cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(176,84,47,0.12)",
                  transition: "all 0.18s ease",
                }}
              >{journalComposerOpen ? "× cancel" : "+ new entry"}</button>
            </div>
            {journalComposerOpen && (
              <JournalComposer
                onCancel={() => setJournalComposerOpen(false)}
                onSave={(text, kind, note) => {
                  if (addJournalEntry) addJournalEntry(text, kind, note);
                  setJournalComposerOpen(false);
                }}
              />
            )}

            {/* Stats strip — surfaces only once the journal has any
                weight to it. A blank line with three zeros on day one
                feels patronizing; eight cups in is when this earns its
                space. */}
            {(cupCount + entryCount) >= 3 && (
              <div style={{
                marginTop: 6, marginBottom: 12,
                padding: "8px 0",
                borderTop: `1px solid ${theme.ruleSoft}`,
                borderBottom: `1px solid ${theme.ruleSoft}`,
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
                textTransform: "uppercase", color: theme.ash,
                gap: 10, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span><span style={{ color: theme.sageDeep, fontWeight: 500 }}>{cupCount}</span> cup{cupCount === 1 ? "" : "s"}</span>
                  <span style={{ color: theme.rule }}>·</span>
                  <span><span style={{ color: theme.terra, fontWeight: 500 }}>{entryCount}</span> {entryCount === 1 ? "entry" : "entries"}</span>
                </div>
                {earliest && (
                  <span style={{
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
                    letterSpacing: "0.02em", textTransform: "none", color: theme.ash,
                  }}>
                    keeping since {monthLabel(earliest)}
                  </span>
                )}
              </div>
            )}

            {timeline.length === 0 ? (
              <div style={{
                marginTop: 18, padding: "14px 16px",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                color: theme.ash, textAlign: "center", lineHeight: 1.5,
              }}>
                Your journal is open. Brew a cup, log it, or write an entry —
                everything lands here in time.
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                {groups.map((g, gi) => (
                  <div key={g.key} style={{ marginTop: gi === 0 ? 0 : 18 }}>
                    {/* Section header — sans uppercase eyebrow with a
                        soft underline. Reads like a date marker in a
                        bound journal: a small announcement, not a
                        button. The hairline carries the weight so the
                        text itself can stay quiet. */}
                    <div style={{
                      paddingBottom: 6, marginBottom: 4,
                      borderBottom: `1px solid ${theme.rule}`,
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    }}>
                      <span style={{
                        fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.2em",
                        textTransform: "uppercase", color: theme.inkSoft,
                      }}>
                        {g.label}
                      </span>
                      <span style={{
                        fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5,
                        color: theme.ash,
                      }}>
                        {g.items.length} {g.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    {g.items.map((item, i) => {
                      if (item.kind === "cup") {
                        return (
                          <SessionRow
                            key={item.ref.id}
                            s={item.ref}
                            openCup={openCup}
                            first={i === 0}
                          />
                        );
                      }
                      return (
                        <JournalEntryRow
                          key={item.ref.id}
                          entry={item.ref}
                          first={i === 0}
                          openEntry={openEntry}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {mode === "recipes" && (() => {
        // Recipe Book — the full catalogue of curated traditional and
        // experimental blends, plus user-composed local- entries. The
        // favorites filter gives the user-saved view.
        const hidden = hiddenBlendIds || new Set();
        const traditional = BLENDS.filter(b => b.tradition && !hidden.has(b.id));
        const curatedExperimental = BLENDS.filter(b => b.experimental && !hidden.has(b.id));
        const curatedIds = new Set(BLENDS.map(b => b.id));
        const generatedExperimental = (generatedBlends || []).filter(
          b => !curatedIds.has(b.id) && !hidden.has(b.id)
        );
        const experimental = [...curatedExperimental, ...generatedExperimental];

        // Recipe Book always shows the catalogue with filter chips.
        // Filter state is a structured object: collection (single-select),
        // moods (multi-select OR), flavors (multi-select OR). String form
        // is supported for backwards-compat with any cached older state.
        if (true) {
          const cf = typeof catalogueFilter === "string"
            ? { collection: catalogueFilter, moods: [], flavors: [] }
            : { collection: "favorites", moods: [], flavors: [], ...(catalogueFilter || {}) };
          const setCollection = (c) => setCatalogueFilter({ ...cf, collection: c });
          const toggleInList = (key, item) => {
            const list = cf[key] || [];
            const next = list.includes(item)
              ? list.filter(x => x !== item)
              : [...list, item];
            setCatalogueFilter({ ...cf, [key]: next });
          };

          // Step 1 — collection bucket.
          let pool;
          let catEmpty;
          if (cf.collection === "all") {
            const seen = new Set();
            pool = [...traditional, ...experimental].filter(b => {
              if (seen.has(b.id)) return false;
              seen.add(b.id);
              return true;
            });
            catEmpty = "No catalogue blends to show.";
          } else if (cf.collection === "favorites") {
            const fav = favoriteBlendIds || new Set();
            const seen = new Set();
            pool = [...traditional, ...experimental].filter(b => {
              if (seen.has(b.id)) return false;
              seen.add(b.id);
              return fav.has(b.id);
            });
            catEmpty = "No favorites yet. Tap the star on a blend to mark it.";
          } else if (cf.collection === "traditional") {
            pool = traditional;
            catEmpty = "No traditional blends to show.";
          } else if (cf.collection === "twists") {
            // Herbanium Twists — experimentals that deviate from a
            // traditional with one or two accent additions or
            // brewing changes. Marked twist:true with a twistNote
            // explaining why the deviation works.
            pool = experimental.filter(b => b.twist);
            catEmpty = "No Herbanium Twists to show.";
          } else if (cf.collection === "house recipes" || cf.collection === "experimental") {
            pool = experimental;
            catEmpty = "No house recipes to show.";
          } else {
            // Legacy fallback — older state may hold a mood string here.
            pool = [...traditional, ...experimental]
              .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
              .filter(b => b.mood === cf.collection);
            catEmpty = `No catalogue blends match ${cf.collection} yet.`;
          }

          // Step 2 — sub-filter by mood (OR within row) and flavor
          // family (OR within row, ANDed across rows). Flavor is matched
          // against any ingredient in the blend whose flavor maps to a
          // selected family via FAMILY_BY_FLAVOR.
          const moodSet = new Set(cf.moods || []);
          const flavorSet = new Set(cf.flavors || []);
          const blendMatchesFlavors = (b) => {
            if (flavorSet.size === 0) return true;
            const ings = b.ingredients || [];
            for (const it of ings) {
              const ing = INGREDIENTS.find(x => x.id === it.id);
              if (!ing) continue;
              for (const fl of (ing.flavors || [])) {
                const fam = FAMILY_BY_FLAVOR[fl] || fl;
                if (flavorSet.has(fam) || flavorSet.has(fl)) return true;
              }
            }
            return false;
          };
          const blendMatchesMoods = (b) => {
            if (moodSet.size === 0) return true;
            return moodSet.has(b.mood);
          };
          const catVisible = pool.filter(b => blendMatchesMoods(b) && blendMatchesFlavors(b));
          if (catVisible.length === 0 && (moodSet.size > 0 || flavorSet.size > 0)) {
            const subBits = [
              moodSet.size > 0 ? `mood (${[...moodSet].join(", ")})` : null,
              flavorSet.size > 0 ? `flavor (${[...flavorSet].join(", ")})` : null,
            ].filter(Boolean).join(" + ");
            catEmpty = `No ${cf.collection} blends match ${subBits}. Tap a chip to clear.`;
          }

          return (
            <div style={{ marginTop: 4 }}>
              {/* Filters — three rows with eyebrow labels: COLLECTION
                  (single-select bucket), MOOD (multi-select), FLAVOR
                  (multi-select). Each row is a flex-1 grid so the
                  strip extends edge-to-edge. Selections AND across
                  rows; chips within a multi-select row OR together. */}
              <FilterRow
                label="collection"
                items={[
                  ["favorites",   "Favorites"],
                  ["all",         "All"],
                  ["traditional", "Traditional"],
                  ["twists",      "Twists"],
                  ["house recipes", "House"],
                ]}
                value={cf.collection}
                setValue={setCollection}
              />
              <FilterRow
                label="mood"
                multi
                items={[
                  ["calm",    "Calm"],
                  ["focus",   "Focus"],
                  ["energy",  "Energy"],
                  ["comfort", "Comfort"],
                ]}
                value={cf.moods}
                setValue={(m) => toggleInList("moods", m)}
              />
              <FilterRow
                label="flavor"
                multi
                items={FLAVOR_FAMILY_CHIPS.map(c => [c.family, c.label])}
                value={cf.flavors}
                setValue={(f) => toggleInList("flavors", f)}
              />

              {/* Add-recipe CTA — sends the user to the Apothecary's
                  Blend (reverse-compose) page where they can build
                  one of their own from ingredients. Solid secondary-
                  style button with a thin-stroke SVG plus, replacing
                  the prior dashed-border placeholder look. */}
              <button
                onClick={() => go("apothecary", { mode: "reverse" })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(176,84,47,0.06)";
                  e.currentTarget.style.borderColor = theme.terra;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = theme.ruleSoft;
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  marginBottom: 14,
                  fontFamily: ff.serif, fontSize: 14,
                  color: theme.terra,
                  background: "transparent",
                  border: `1px solid ${theme.ruleSoft}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.18s ease, border-color 0.18s ease",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 2.5 L6 9.5 M2.5 6 L9.5 6" stroke={theme.terra} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                add a recipe
              </button>

              {/* Per-filter description band — soft left-rule + meta
                  count line so each filter's context reads as a band,
                  not a paragraph dropped into the page. */}
              {(() => {
                const descriptions = {
                  all: {
                    count: `${traditional.length + experimental.length} recipes`,
                    body: `The full Recipe Book — ${traditional.length} traditional preparations and ${experimental.length} Herbanium house recipes, plus any blend you've composed and saved.`,
                  },
                  favorites: {
                    count: "your starred picks",
                    body: "Blends you've starred. Same set as your Home favorites — tap the star on any blend to add or remove it.",
                  },
                  traditional: {
                    count: `${traditional.length} classics`,
                    body: "Classic preparations, taught the way they're traditionally made. Tap any to open its recipe or start brewing.",
                  },
                  "house recipes": {
                    count: `${experimental.length} from the kettle`,
                    body: "Herbanium's own recipes — combinations the catalog's chemistry suggests but no tradition has codified. Try, log, judge for yourself.",
                  },
                  twists: {
                    count: "tradition with intent",
                    body: "Traditional preparations with one or two intentional deviations — a layered accent, a swapped base, a tighter steep. Each twist comes with a short note on why the change works.",
                  },
                };
                const d = descriptions[cf.collection];
                if (!d) return null;
                return (
                  <div style={{
                    marginBottom: 14, padding: "10px 12px",
                    borderLeft: `2px solid ${theme.terra}`,
                    background: "rgba(176,84,47,0.04)",
                    borderRadius: "0 6px 6px 0",
                  }}>
                    <div style={{
                      fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: theme.terra, marginBottom: 4,
                    }}>{d.count}</div>
                    <div style={{
                      fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
                      color: theme.inkSoft, lineHeight: 1.5,
                    }}>
                      {d.body}
                    </div>
                  </div>
                );
              })()}


              {catVisible.length === 0 ? (
                <div style={{
                  marginTop: 18, padding: "28px 20px",
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
                  color: theme.ash, textAlign: "center", lineHeight: 1.55,
                  background: theme.cream,
                  border: `1px solid ${theme.ruleSoft}`,
                  borderRadius: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                    <Ornament w={56} c={theme.ash} />
                  </div>
                  {catEmpty}
                </div>
              ) : (
                catVisible.map((b, i) => {
                  // House experimentals (Tom Foolery + the curated research
                  // blends) are permanent Catalogue staples — undeletable.
                  const isHouseStaple = b.house === true || b.id === "exp-tom-foolery";
                  const author = b.tradition
                    || (isHouseStaple ? "Herbanium house"
                       : b.synthetic ? "algorithmic experiment"
                       : b.id?.startsWith("local-") ? "your composition"
                       : b.experimental ? "Herbanium experiment"
                       : null);
                  // Any catalogue blend except permanent house staples
                  // can be removed; curated traditions get hidden via
                  // hiddenBlendIds and can be restored from the panel
                  // below the list.
                  const canDelete = !isHouseStaple && deleteBlend;
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
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.45"; }}
                          style={{
                            position: "absolute", top: 12, right: 10,
                            width: 22, height: 22,
                            background: "transparent",
                            border: `1px solid ${theme.ruleSoft}`,
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 0, cursor: "pointer",
                            opacity: 0.45,
                            transition: "opacity 0.18s ease",
                          }}
                        >
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                            <path d="M1.5 1.5 L7.5 7.5 M7.5 1.5 L1.5 7.5"
                              stroke={theme.ash} strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              <RestoreDeletedPanel
                hiddenBlendIds={hidden}
                unhideBlend={unhideBlend}
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Compendium — full ingredient reference. The "only what's in
          my pantry" filter is hidden here; that filter is reserved for
          the Shelf · Pantry surface. Compendium always shows every
          ingredient at full presence. */}
      {mode === "compendium" && (
        <LibraryScreen
          go={go}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          hideHeader
          hidePantryToggle
        />
      )}

      {/* Shelf · Pantry — full ingredient browse defaulted to "only
          what's in my pantry" (so it lands as a personal stock list),
          with the toggle visible so the user can flip it off to browse
          and add new ingredients without leaving the tab. */}
      {mode === "pantry" && (
        <LibraryScreen
          go={go}
          pantryIds={pantryIds}
          togglePantry={togglePantry}
          defaultPantryOnly
          hideHeader
          pantryHintShown={pantryHintShown}
          dismissPantryHint={dismissPantryHint}
        />
      )}

    </div>
  );
};

// Floating Apothecary / Shelf tutorial card — rendered at the App
// level just above the TabBar so it overlays the screen content
// instead of pushing it. Shares the same z layer as the menu
// buttons so the user reads "this card sits with the dock," and
// the description's words land right above the sub-tabs they
// describe. Pulled out of the ComposeScreen tree so the in-screen
// scroll doesn't carry it.
export const ComposeTutorialOverlay = ({ section, hintShown, dismissHint }) => {
  if (hintShown || !dismissHint) return null;
  if (section !== "apothecary" && section !== "shelf") return null;

  const isApothecary = section === "apothecary";
  const Icon  = isApothecary ? Sprig : Pencil;
  const title = isApothecary ? "Apothecary" : "Shelf";
  const items = isApothecary
    ? [
        ["Blend", "Build a recipe from scratch. Pick ingredients, see how they read together, save your formula."],
        ["Vibe",  "Tell the kettle how you want to feel; we'll suggest blends that hit that mood at the strength you'd brew them."],
        ["Compendium", "Every leaf, flower, root, and bark Herbanium tracks. Tap one to read its profile."],
      ]
    : [
        ["Recipes", "Curated picks you've held onto plus your own creations, all in one place to brew again."],
        ["Cabinet", "Ingredients you actually keep at home. Filter blends to use only what's in stock."],
        ["Journal", "Cup logs, free-form entries, and mood arcs. Your tea-meets-mood diary."],
      ];

  return (
    <div style={{
      // Float above the TabBar dock without taking flex space.
      // 100% width inside the centered phone-frame column so the
      // card aligns with the same gutter as the rest of the app.
      flexShrink: 0,
      padding: "0 14px 8px",
      pointerEvents: "auto",
    }}>
      <HintCard
        icon={<Icon size={18} c={isApothecary ? theme.sageDeep : theme.terra} />}
        title={title}
        body={<>
          {items.map(([k, body], i) => (
            <div key={k} style={{ marginBottom: i === items.length - 1 ? 0 : 6 }}>
              <strong style={{ color: theme.terra }}>{k}</strong> — {body}
            </div>
          ))}
        </>}
        onDismiss={dismissHint}
      />
    </div>
  );
};

// FilterRow — recipe-page filter strip with an eyebrow label and a
// row of equal-width chip buttons that span the full container.
// Each chip is flex:1 so the row extends edge-to-edge regardless
// of label length, and active vs inactive uses the same ink-fill
// pattern as the catalog/cabinet filter chips for consistency
// across the app.
const FilterRow = ({ label, items, value, setValue, multi = false }) => {
  // Single-select rows pass `value` as a string; multi-select rows pass
  // an array of selected keys. Active state is computed accordingly so
  // both modes share the same chip styling.
  const isActive = (key) => multi ? (value || []).includes(key) : value === key;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
        textTransform: "uppercase", color: theme.ash,
        marginBottom: 5,
      }}>{label}</div>
      <div style={{ display: "flex", gap: 4, width: "100%", flexWrap: "wrap" }}>
        {items.map(([key, lbl]) => {
          const active = isActive(key);
          return (
            <button
              key={key}
              onClick={() => setValue(key)}
              style={{
                flex: 1, minWidth: 0, whiteSpace: "nowrap",
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
                padding: "6px 8px", borderRadius: 999,
                border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                background: active ? theme.ink : "transparent",
                color: active ? theme.cream : theme.inkSoft,
                cursor: "pointer",
                boxShadow: active
                  ? "0 2px 6px -1px rgba(30,24,18,0.20)"
                  : "0 1px 2px rgba(30,24,18,0.05)",
                transition: "all 0.18s ease",
              }}
            >{lbl}</button>
          );
        })}
      </div>
    </div>
  );
};

export const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew, saveComposedBlend, generatedBlends, hiddenBlendIds }) => {
  const [rcSaveName, setRcSaveName] = useState("");
  const [rcSavePromptOpen, setRcSavePromptOpen] = useState(false);
  const [rcSaveStatus, setRcSaveStatus] = useState(null);
  // Brew-save confirmation — reverse-built blends always start unsaved.
  const [rcBrewAsk, setRcBrewAsk] = useState(false);
  const [rcPendingBrew, setRcPendingBrew] = useState(null);
  const { unit, weightUnit } = useUnit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const available = Object.keys(INGREDIENTS).filter(id => !reverseIngs.includes(id));
  const filteredAvailable = available
    .filter(id => {
      const ing = INGREDIENTS[id];
      // Match LibraryScreen: "fruit" is a virtual filter that
      // surfaces fruit-adjacent ingredients regardless of where
      // they live in the data taxonomy (cranberry, dried-apple,
      // citrus peels, hibiscus).
      if (filter === "fruit") {
        const isFruit = ing.subcategory === "fruit"
          || ing.subcategory === "peel"
          || id === "hibiscus";
        if (!isFruit) return false;
      } else if (filter !== "all" && ing.category !== filter) {
        return false;
      }
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
  // Same as forward-mode filter: this banner is temp-axis only, so
  // exclude ingredients that are in their preferred temp band even
  // if their steep time is currently off.
  const liveOutsiders = liveBrew.perIngredient?.filter(c => !c.inTempRange) || [];

  // Reverse-mode safety check — same rules as forward mode. Custom
  // user-built combinations are exactly where unsafe pairs can sneak
  // in (the generators are already filtered), so the warning matters
  // most here.
  const rcSafetyFlags = checkIngredientInteractions(reverseIngs);

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

        {/* Ingredient-interaction safety banners — reverse mode. */}
        {rcSafetyFlags.map(flag => {
          const high = flag.severity === "high";
          return (
            <div key={flag.id} style={{
              marginTop: 10, padding: "8px 10px", borderRadius: 6,
              background: high ? "rgba(176, 64, 48, 0.10)" : "rgba(165, 120, 54, 0.08)",
              border: high ? `1px solid rgba(176, 64, 48, 0.30)` : `1px solid rgba(165, 120, 54, 0.22)`,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
              color: theme.inkSoft, lineHeight: 1.45,
            }}>
              <em style={{
                color: high ? "rgb(176, 64, 48)" : theme.ochre,
                fontStyle: "normal", fontFamily: ff.sans, fontSize: 10,
                letterSpacing: "0.16em", textTransform: "uppercase", marginRight: 6,
              }}>{high ? "skip this combination" : "heads up"} · {flag.title}</em>
              {flag.message}
            </div>
          );
        })}

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
              ["fruit",     "fruits"],
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

      <div style={{ marginTop: 20 }}><SectionLabel n="ii">The blender — see how it brews</SectionLabel></div>
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
            <Button variant="ghost" onClick={() => { setRcSavePromptOpen(false); setRcSaveStatus(null); }}>
              Cancel
            </Button>
            <Button
              variant="primary" tone="ink"
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
                } else {
                  setRcSaveStatus({
                    kind: "err",
                    text: "Couldn't save — try a different name or check the recipe.",
                  });
                  setTimeout(() => setRcSaveStatus(null), 3500);
                }
              }}
              style={{ fontSize: 14, padding: "10px 24px" }}
            >Save</Button>
          </div>
        </div>
      )}
      {rcSaveStatus && (
        <div style={{
          marginTop: 10, padding: "6px 10px", borderRadius: 8,
          background: rcSaveStatus.kind === "err"
            ? "rgba(176,84,47,0.08)"
            : "rgba(98,124,92,0.10)",
          border: `1px solid ${rcSaveStatus.kind === "err" ? theme.terra : theme.ruleSoft}`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: rcSaveStatus.kind === "err" ? theme.terra : theme.sageDeep,
          textAlign: "center",
        }}>{rcSaveStatus.text}</div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button
          variant="secondary"
          disabled={!saveComposedBlend || reverseIngs.length === 0}
          onClick={() => {
            setRcSaveName("");
            setRcSavePromptOpen(true);
            setRcSaveStatus(null);
          }}
          style={{ fontSize: 14, padding: "10px 18px" }}
        >Save</Button>
        <Button
          variant="primary"
          disabled={reverseIngs.length === 0}
          onClick={() => {
            if (reverseIngs.length === 0) return;
            const candidate = { name: "Untitled blend", ingredients: ingsForProfile, tempC: brewTempC, timeS: brewTimeS };
            const allCatalogue = [
              ...BLENDS,
              ...((generatedBlends || []).filter(b => !BLENDS.find(x => x.id === b.id))),
            ];
            const dup = findDuplicateBlend(candidate, allCatalogue, hiddenBlendIds);
            if (dup) {
              startBrew({ ...dup, tempC: candidate.tempC, timeS: candidate.timeS }, "", ["calm"]);
              return;
            }
            setRcPendingBrew({ candidate, moods: ["calm"] });
            setRcBrewAsk(true);
          }}
          icon={<Kettle size={17} c={theme.cream} />}
          style={{ flex: 1, fontSize: 14, padding: "10px 14px", gap: 8 }}
        >Start brewing</Button>
      </div>

      {rcBrewAsk && rcPendingBrew && (
        <BrewSavePrompt
          defaultName={suggestBlendName(rcPendingBrew.candidate.ingredients)}
          onSaveAndBrew={(chosenName) => {
            if (saveComposedBlend) {
              const id = saveComposedBlend(rcPendingBrew.candidate, chosenName);
              if (id) {
                const persisted = { ...rcPendingBrew.candidate, id, name: chosenName };
                startBrew(persisted, "", rcPendingBrew.moods);
              }
            }
            setRcBrewAsk(false);
            setRcPendingBrew(null);
          }}
          onJustBrew={() => {
            startBrew(rcPendingBrew.candidate, "", rcPendingBrew.moods);
            setRcBrewAsk(false);
            setRcPendingBrew(null);
          }}
          onCancel={() => { setRcBrewAsk(false); setRcPendingBrew(null); }}
        />
      )}
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   RestoreDeletedPanel — collapsible "X removed · search · restore"
   block at the bottom of Catalogue. Lets the user bring back any
   curated blend they've previously deleted; user-composed blends
   that were dropped from generatedBlends can't be restored here
   (they're gone from storage, not just hidden).
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   BrewSavePrompt — small modal that fires when the user starts
   brewing a custom blend that hasn't been saved yet. Three actions:
   save it to the catalogue and brew, brew without saving, or cancel.
   Backdrop tap closes via the cancel handler.
   ────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   JournalEntryRow — chronological row for a free-form entry or
   haiku ad-lib in the Journal sub-tab. Visually distinct from
   SessionRow (which renders cups) so the timeline reads as two
   things in one stream rather than one homogenous list.
   ────────────────────────────────────────────────────────────── */

const JournalEntryRow = ({ entry, first, openEntry }) => {
  const isHaiku    = entry.kind === "haiku";
  const isLimerick = entry.kind === "limerick";
  const isPoem     = entry.kind === "poem";
  const isVerse    = isHaiku || isLimerick || isPoem;
  const stamp = entry.ts ? new Date(entry.ts) : null;
  const ago = stamp ? formatAgo(stamp) : "";
  const label =
    isHaiku    ? "a verse"
    : isLimerick ? "a limerick"
    : isPoem    ? "a poem"
    : "an entry";
  // Single-line preview of the entry body. The detail screen carries
  // the full text, line breaks, and mood arc; the row only needs to
  // hint at the content so the user can tell entries apart at a
  // glance. Strip newlines and trim so a haiku doesn't blow the row
  // height open.
  const preview = (entry.text || "")
    .replace(/\s+/g, " ")
    .trim();
  // Edge color + glyph differ for verse vs prose so the journal
  // timeline tells them apart at a glance. Sprig (sage) for verse —
  // a poetic flourish; Pencil (terra) for prose entries — the
  // utilitarian writing tool.
  const Glyph = isVerse ? Sprig : Pencil;
  const accent = isVerse ? theme.sage : theme.terra;
  const glyphColor = isVerse ? theme.sageDeep : theme.terra;
  return (
    <button
      onClick={() => openEntry?.(entry.id)}
      style={{
        width: "100%", textAlign: "left", background: "transparent",
        border: "none", borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
        borderLeft: `2px solid ${accent}`,
        padding: "10px 2px 10px 10px", cursor: "pointer",
        display: "flex", gap: 8, minWidth: 0,
      }}
    >
      <span style={{ flexShrink: 0, display: "inline-flex", paddingTop: 2 }}>
        <Glyph size={12} c={glyphColor} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <span style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: theme.ash,
          }}>
            {label}
          </span>
          <span style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
          }}>{ago}</span>
        </div>
        {preview && (
          <span style={{
            fontFamily: ff.serif,
            fontStyle: isVerse ? "italic" : "normal",
            fontSize: 13.5, color: theme.ink, lineHeight: 1.4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {preview}
          </span>
        )}
      </div>
    </button>
  );
};

const BrewSavePrompt = ({ defaultName, onSaveAndBrew, onJustBrew, onCancel }) => {
  // Pre-fill with the suggested name from the ingredients. The
  // "Untitled blend" fallback (no ingredients) opens empty so the
  // user is nudged to write something of their own.
  const seed = (defaultName && defaultName !== "Untitled blend") ? defaultName : "";
  const [name, setName] = useState(seed);
  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 220,
        background: "rgba(40, 30, 20, 0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 360, width: "100%",
          background: theme.cream,
          border: `1px solid ${theme.ruleSoft}`,
          borderRadius: 12,
          padding: "18px 20px",
          boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{
          fontFamily: ff.serif, fontSize: 16, color: theme.ink,
          lineHeight: 1.35, marginBottom: 6,
        }}>
          Save this blend first?
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
          color: theme.inkSoft, lineHeight: 1.5, marginBottom: 12,
        }}>
          It isn't in your catalogue yet. Name it to save and brew, or
          skip and brew it without saving.
        </div>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash,
          marginBottom: 6,
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        }}>
          <span>Name</span>
          <span style={{
            fontFamily: ff.serif, fontStyle: "italic",
            fontSize: 10.5, letterSpacing: 0,
            textTransform: "none", color: theme.terra,
          }}>— suggested from your ingredients, edit anything below</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: "rgba(176, 84, 47, 0.05)",
          border: `1px solid ${theme.terra}`,
          marginBottom: 14,
        }}>
          <Pencil size={14} c={theme.terra} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSave) onSaveAndBrew(trimmed); }}
            autoFocus
            onFocus={(e) => e.target.select()}
            maxLength={48}
            placeholder="name your blend"
            style={{
              flex: 1, minWidth: 0,
              fontFamily: ff.serif, fontSize: 15, color: theme.ink,
              background: "transparent", border: "none",
              padding: "2px 0", outline: "none",
            }}
          />
          {name && (
            <button
              onClick={() => setName("")}
              aria-label="clear name"
              title="clear"
              style={{
                background: "transparent", border: "none",
                color: theme.ash, fontSize: 14, lineHeight: 1,
                padding: "2px 4px", cursor: "pointer",
              }}
            >×</button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => canSave && onSaveAndBrew(trimmed)}
            disabled={!canSave}
            style={{
              fontFamily: ff.serif, fontSize: 14,
              padding: "10px 14px", borderRadius: 999,
              background: canSave ? theme.ink : theme.rule,
              color: theme.cream, border: "none",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >save & brew</button>
          <button
            onClick={onJustBrew}
            style={{
              fontFamily: ff.serif, fontSize: 14,
              padding: "10px 14px", borderRadius: 999,
              background: "transparent", color: theme.terra,
              border: `1px solid ${theme.terra}`, cursor: "pointer",
            }}
          >brew without saving</button>
          <button
            onClick={onCancel}
            style={{
              fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
              background: "transparent", border: "none",
              color: theme.ash, cursor: "pointer", padding: "6px 10px",
            }}
          >cancel</button>
        </div>
      </div>
    </div>
  );
};

const RestoreDeletedPanel = ({ hiddenBlendIds, unhideBlend }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Resolve hidden ids against BLENDS — user-composed `local-` ids
  // won't be in BLENDS and aren't restorable from this panel.
  const hiddenList = [...(hiddenBlendIds || new Set())]
    .map(id => BLENDS.find(b => b.id === id))
    .filter(Boolean);
  if (hiddenList.length === 0) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? hiddenList.filter(b =>
        (b.name || "").toLowerCase().includes(q)
        || (b.subtitle || "").toLowerCase().includes(q)
        || (b.tradition || "").toLowerCase().includes(q)
      )
    : hiddenList;

  return (
    <div style={{
      marginTop: 22,
      padding: "10px 12px",
      borderTop: `1px solid ${theme.ruleSoft}`,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "transparent", border: "none",
          padding: "6px 0", cursor: "pointer",
          fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span>removed · {hiddenList.length}</span>
        <span style={{ fontFamily: ff.serif, fontSize: 14, letterSpacing: 0 }}>
          {open ? "hide" : "restore"}
        </span>
      </button>

      {open && (
        <>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search removed recipes…"
            style={{
              width: "100%",
              marginTop: 8,
              fontFamily: ff.serif, fontSize: 14, color: theme.ink,
              background: "transparent",
              border: "none", borderBottom: `1px solid ${theme.ruleSoft}`,
              padding: "6px 2px", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 10 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: "10px 0",
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                color: theme.ash, textAlign: "center",
              }}>
                Nothing matches that search.
              </div>
            ) : filtered.map(b => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: `1px solid ${theme.ruleSoft}`,
                gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: ff.serif, fontSize: 14, color: theme.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{b.name}</div>
                  {b.tradition && (
                    <div style={{
                      fontFamily: ff.sans, fontSize: 10, color: theme.ash,
                      letterSpacing: "0.06em", marginTop: 1,
                    }}>{b.tradition}</div>
                  )}
                </div>
                <button
                  onClick={() => unhideBlend && unhideBlend(b.id)}
                  style={{
                    fontFamily: ff.sans, fontSize: 11, color: theme.terra,
                    background: "transparent",
                    border: `1px solid ${theme.terra}`, borderRadius: 999,
                    padding: "5px 12px", cursor: "pointer", flexShrink: 0,
                  }}
                >restore</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
