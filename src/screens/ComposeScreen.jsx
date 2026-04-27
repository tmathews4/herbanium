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
import { checkIngredientInteractions } from "../data/safety";
import { getBlend, iconBtn } from "../helpers/misc";
import {
  ff, theme,
} from "../theme";
import {
  formatAmount, formatTemp, formatTempRange, formatTempShort, useUnit,
} from "../units/units";
import { LibraryList, BlendListRow, LibraryScreen } from "./LibraryScreen";
import { SessionRow } from "./HomeScreen";
import { JournalComposer } from "../components/JournalComposer";
import { HintCard } from "../components/HintCard";
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

export const ComposeScreen = ({ section = "apothecary", go, startBrew, savedBlendIds, favoriteBlendIds, generatedBlends, hiddenBlendIds, deleteBlend, unhideBlend, saveComposedBlend, openBlend, composePreselect, composeView, openInCompose, pantryIds, togglePantry, sessions = [], journalEntries = [], addJournalEntry, deleteJournalEntry, composeHintShown, dismissComposeHint, journalHintShown, dismissJournalHint, libraryView, pantryHintShown, dismissPantryHint }) => {
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
  const { unit, weightUnit } = useUnit();
  // Mode universe per section:
  //   apothecary: reverse (Blend) | forward (Vibe) | compendium
  //   shelf:      journal | recipes | pantry
  const initialMode = section === "shelf" ? "journal" : "reverse";
  const [mode, setMode] = useState(initialMode);
  // Reset mode when section changes so the user lands on a valid sub-tab.
  useEffect(() => {
    const validModes = section === "shelf"
      ? ["journal", "recipes", "pantry"]
      : ["reverse", "forward", "compendium"];
    if (!validModes.includes(mode)) setMode(validModes[0]);
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the user manually clicks the Recipe Book sub-tab, reset the
  // catalogue filter to "all" so the full stock — traditionals plus
  // Herbanium's house recipes — is visible by default. (composePreselect
  // can still flip it to "favorites" when a star is tapped from Home.)
  const setModeUserAction = (next) => {
    if (next === "recipes" && mode !== "recipes") {
      setCatalogueFilter("all");
    }
    setMode(next);
  };
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
  // composePreselect arrives here. Switch to Recipe Book / favorites so
  // the user sees their saved recipe highlighted, ready to set intent.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("recipes");
    setCatalogueFilter("favorites");
  }, [composePreselect?.at]);

  // Deep-link from Profile stats: lands on Compose with the requested
  // sub-mode/tab pre-selected.
  React.useEffect(() => {
    if (!composeView) return;
    if (composeView.mode) setMode(composeView.mode);
    if (composeView.shelfTab) setShelfTab(composeView.shelfTab);
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

  // Ingredient-interaction safety flags (high + moderate). Surfaced
  // below the temperature-compromise banner so the user sees both
  // brewing and safety considerations in one place.
  const safetyFlags = !blend.empty
    ? checkIngredientInteractions(effectiveIngredients)
    : [];

  return (
    <div style={{ padding: "18px 20px 32px", fontFamily: ff.sans }}>
      {/* First-visit tutorial — different copy per section. */}
      {section === "apothecary" && !composeHintShown && dismissComposeHint && (
        <HintCard
          icon={<Sprig size={18} c={theme.sageDeep} />}
          title="The Apothecary."
          body={<>
            Three sub-tabs. <em>Blend</em> builds a cup from ingredients you
            pick. <em>Vibe</em> recommends one from a mood and flavor.
            <em> Compendium</em> is the full ingredient reference — every leaf,
            flower, root, and bark Herbanium tracks.
          </>}
          onDismiss={dismissComposeHint}
        />
      )}
      {section === "shelf" && !composeHintShown && dismissComposeHint && (
        <HintCard
          icon={<Pencil size={16} c={theme.terra} />}
          title="The Shelf."
          body={<>
            Three sub-tabs. <em>Journal</em> is everything you've kept in
            time — cups, notes, and verses. <em>Recipe Book</em> is the full
            catalogue of blends. <em>Compendium</em> opens to the ingredients
            you've marked on hand; toggle "only what's in my pantry" off to
            browse and add more.
          </>}
          onDismiss={dismissComposeHint}
        />
      )}
      {/* Segmented control — three sub-tabs per section. */}
      {(() => {
        const sectionTabs = section === "shelf"
          ? [
              ["journal",    "Journal"],
              ["recipes",    "Recipe Book"],
              ["pantry",     "Compendium"],
            ]
          : [
              ["reverse",    "Blend"],
              ["forward",    "Vibe"],
              ["compendium", "Compendium"],
            ];
        return (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${sectionTabs.length}, 1fr)`,
            border: `1px solid ${theme.rule}`, borderRadius: 10, overflow: "hidden",
            marginBottom: 14, background: theme.cream,
          }}>
            {sectionTabs.map(([k, label]) => (
              <button key={k} onClick={() => setModeUserAction(k)} style={{
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.02em",
                padding: "9px 4px", cursor: "pointer",
                background: mode === k ? theme.ink : "transparent",
                color: mode === k ? theme.cream : theme.inkSoft,
                border: "none",
              }}>{label}</button>
            ))}
          </div>
        );
      })()}

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
                onClick={() => {
                  const candidate = { ...blend, ingredients: effectiveIngredients, tempC: brewTempC, timeS: brewTimeS };
                  // Custom & unsaved = just-built variant, synth, or a
                  // local-blend that isn't in saved/favorites yet.
                  const isCustomUnsaved =
                    !blend.id
                    || String(blend.id).startsWith("synth-")
                    || (addedIngIds && addedIngIds.length > 0)
                    || (String(blend.id).startsWith("local-") && savedBlendIds && !savedBlendIds.has(blend.id));
                  if (isCustomUnsaved) {
                    // If the catalogue already holds a blend with the
                    // same temp + ingredients, brew that one instead of
                    // re-prompting to save a duplicate.
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

            {/* Confirm-before-brew dialog for custom unsaved blends. */}
            {brewAsk && pendingBrew && (
              <BrewSavePrompt
                defaultName={pendingBrew.candidate.name}
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

      {mode === "journal" && (() => {
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
        const timeline = [...sessionItems, ...entryItems]
          .sort((a, b) => b.ts - a.ts);

        return (
          <div style={{ marginTop: 4 }}>
            {!journalHintShown && dismissJournalHint && (
              <HintCard
                icon={<Pencil size={16} c={theme.terra} />}
                title="A space for words and cups."
                body={<>
                  Tap <em>+ new entry</em> to journal a thought, or try a
                  <em> haiku</em> or <em>limerick</em> ad-lib if you'd like a
                  little help. Brewed cups also land here — the journal is
                  where the days connect.
                </>}
                onDismiss={dismissJournalHint}
              />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                color: theme.ash, lineHeight: 1.5,
              }}>
                Cups, verses, and notes — everything in time.
              </div>
              <button
                onClick={() => setJournalComposerOpen(o => !o)}
                style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                  color: theme.terra,
                  background: "transparent",
                  border: `1px solid ${theme.terra}`, borderRadius: 999,
                  padding: "5px 12px", cursor: "pointer",
                  flexShrink: 0, marginLeft: 12,
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
                {timeline.map((item, i) => {
                  if (item.kind === "cup") {
                    return (
                      <SessionRow
                        key={item.ref.id}
                        s={item.ref}
                        openBlend={openBlend}
                        first={i === 0}
                      />
                    );
                  }
                  return (
                    <JournalEntryRow
                      key={item.ref.id}
                      entry={item.ref}
                      first={i === 0}
                      onDelete={deleteJournalEntry}
                    />
                  );
                })}
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
        if (true) {
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
          } else if (catalogueFilter === "favorites") {
            const fav = favoriteBlendIds || new Set();
            const seen = new Set();
            catVisible = [...traditional, ...experimental].filter(b => {
              if (seen.has(b.id)) return false;
              seen.add(b.id);
              return fav.has(b.id);
            });
            catEmpty = "No favorites yet. Tap the star on a blend to mark it.";
          } else if (catalogueFilter === "traditional") {
            catVisible = traditional;
            catEmpty = "No traditional blends to show.";
          } else if (catalogueFilter === "house recipes" || catalogueFilter === "experimental") {
            catVisible = experimental;
            catEmpty = "No house recipes to show.";
          } else {
            catVisible = [...traditional, ...experimental]
              .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
              .filter(b => b.mood === catalogueFilter);
            catEmpty = `No catalogue blends match ${catalogueFilter} yet.`;
          }
          return (
            <div style={{ marginTop: 4 }}>
              <div style={{ marginBottom: 10 }}>
                <ChipRows
                  items={["favorites", "all", "traditional", "house recipes", "calm", "focus", "energy", "comfort"]}
                  renderItem={(f) => (
                    <Chip
                      key={f}
                      active={catalogueFilter === f}
                      onClick={() => setCatalogueFilter(f)}
                    >{f}</Chip>
                  )}
                />
              </div>

              {catalogueFilter === "all" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  The full Recipe Book — {traditional.length} traditional preparations
                  and {experimental.length} Herbanium house recipes, plus any blend
                  you've composed and saved.
                </div>
              )}

              {catalogueFilter === "favorites" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  Blends you've starred. Same set as your Home favorites — tap
                  the star on any blend to add or remove it.
                </div>
              )}

              {catalogueFilter === "traditional" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  Classic preparations, taught the way they're traditionally made.
                  Tap any to open its recipe or start brewing.
                </div>
              )}

              {catalogueFilter === "house recipes" && (
                <div style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
                  color: theme.ash, lineHeight: 1.5, marginBottom: 14,
                }}>
                  Herbanium's own recipes — combinations the catalog's chemistry
                  suggests but no tradition has codified. Try, log, judge for
                  yourself.
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

              <RestoreDeletedPanel
                hiddenBlendIds={hidden}
                unhideBlend={unhideBlend}
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Compendium — full ingredient reference (renders LibraryScreen
          inline without its own header). */}
      {mode === "compendium" && (
        <LibraryScreen
          go={go}
          pantryIds={pantryIds}
          libraryView={libraryView}
          hideHeader
        />
      )}

      {/* Shelf · Compendium — full ingredient browse defaulted to
          "only what's in my pantry" (so it lands as a personal stock
          list), with the toggle visible so the user can flip it off to
          browse and add new ingredients without leaving the tab. */}
      {mode === "pantry" && (
        <LibraryScreen
          go={go}
          pantryIds={pantryIds}
          libraryView={libraryView}
          defaultPantryOnly
          hideHeader
          pantryHintShown={pantryHintShown}
          dismissPantryHint={dismissPantryHint}
        />
      )}
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
        <button onClick={() => {
          if (reverseIngs.length === 0) return;
          const candidate = { name: "Untitled blend", ingredients: ingsForProfile, tempC: brewTempC, timeS: brewTimeS };
          // Skip the prompt when the catalogue already holds a blend
          // with the same temp + ingredients — brew the saved record so
          // repeats count toward animis like the Self-Repeater.
          const allCatalogue = [
            ...BLENDS,
            ...((generatedBlends || []).filter(b => !BLENDS.find(x => x.id === b.id))),
          ];
          const dup = findDuplicateBlend(candidate, allCatalogue, hiddenBlendIds);
          if (dup) {
            startBrew({ ...dup, tempC: candidate.tempC, timeS: candidate.timeS }, "", ["calm"]);
            return;
          }
          // Reverse-built blends never have an id — always custom.
          setRcPendingBrew({ candidate, moods: ["calm"] });
          setRcBrewAsk(true);
        }} style={{
          flex: 1, fontFamily: ff.serif, fontSize: 16,
          padding: "12px 16px", borderRadius: 10,
          background: theme.terra, color: theme.cream, border: "none", cursor: "pointer",
        }}>start brewing</button>
      </div>

      {rcBrewAsk && rcPendingBrew && (
        <BrewSavePrompt
          defaultName={rcPendingBrew.candidate.name}
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

const JournalEntryRow = ({ entry, first, onDelete }) => {
  const isHaiku    = entry.kind === "haiku";
  const isLimerick = entry.kind === "limerick";
  const isVerse    = isHaiku || isLimerick;
  const stamp = entry.ts ? new Date(entry.ts) : null;
  const ago = stamp ? formatAgo(stamp) : "";
  const label =
    isHaiku    ? "a verse"
    : isLimerick ? "a limerick"
    : "an entry";
  return (
    <div style={{
      padding: "12px 0",
      borderTop: first ? "none" : `1px solid ${theme.ruleSoft}`,
      position: "relative",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
        paddingRight: onDelete ? 22 : 0,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
        }}>{ago}</div>
      </div>
      <div style={{
        fontFamily: ff.serif, fontSize: 14, color: theme.ink,
        lineHeight: isVerse ? 1.7 : 1.55,
        whiteSpace: "pre-line",
        fontStyle: isVerse ? "italic" : "normal",
      }}>{entry.text}</div>
      {entry.note && (
        <div style={{
          marginTop: 8, paddingTop: 6,
          borderTop: `1px dashed ${theme.ruleSoft}`,
          fontFamily: ff.serif, fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.5,
          whiteSpace: "pre-line",
        }}>{entry.note}</div>
      )}
      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm("Remove this journal entry?")) onDelete(entry.id);
          }}
          title="delete entry"
          style={{
            position: "absolute", top: 10, right: 0,
            background: "transparent", border: "none",
            color: theme.ash, fontSize: 13, lineHeight: 1,
            padding: "4px 6px", cursor: "pointer",
            opacity: 0.45,
          }}
        >✕</button>
      )}
    </div>
  );
};

// Tiny date-relative helper for journal entry timestamps. Mirrors the
// "X minutes ago" convention used in seed-session formatting.
function formatAgo(date) {
  const now = Date.now();
  const diffMin = Math.round((now - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const BrewSavePrompt = ({ defaultName, onSaveAndBrew, onJustBrew, onCancel }) => {
  // Pre-fill with the blend's algorithmic name, but treat the reverse-
  // compose placeholder ("Untitled blend") as empty so the user is
  // nudged to write something of their own.
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
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canSave) onSaveAndBrew(trimmed); }}
          autoFocus
          maxLength={48}
          placeholder="name your blend"
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: ff.serif, fontSize: 15, color: theme.ink,
            background: "transparent",
            border: "none", borderBottom: `1px solid ${theme.terra}`,
            padding: "6px 2px", outline: "none",
            marginBottom: 14,
          }}
        />
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
