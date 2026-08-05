/* ──────────────────────────────────────────────────────────────
   screens/ComposeScreen.jsx — Compose screen and its ReverseCompose sibling.
   ────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  computeBrewProfile, resolveBlendAtBrew,
} from "../algo/compose";
import { BlendExtractionExplorer } from "../components/BlendExtractionExplorer";
import {
  Kettle, Ornament,
} from "../components/icons";
import {
  Button, ChipRows, SectionLabel, FitOneLine,
} from "../components/layout";
import {
  BLENDS, FLAVOR_FAMILY_CHIPS,
} from "../data/blends";
import { PARENT_MOODS } from "../data/canon";
import { FAMILY_BY_FLAVOR } from "../components/FlavorMap";
import { INGREDIENTS } from "../data/ingredients";
import { checkIngredientInteractions } from "../data/safety";
import { getBlend, iconBtn, suggestBlendName, formatAgo } from "../helpers/misc";
import { recommendBlends } from "../helpers/recommend";
import {
  ff, theme, shadow, radius,
} from "../theme";
import {
  formatAmount, formatTemp, formatTempRange, formatTempShort, useUnit,
} from "../units/units";
import { BlendListRow, LibraryScreen } from "./LibraryScreen";
import { SessionRow } from "./HomeScreen";
import { JournalComposer } from "../components/JournalComposer";
import { ElementalsView } from "../components/ElementalsView";
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

export const ComposeScreen = ({ section = "apothecary", go, startBrew, savedBlendIds, favoriteBlendIds, generatedBlends, hiddenBlendIds, deleteBlend, unhideBlend, saveComposedBlend, openBlend, openCup, openEntry, composePreselect, composeView, openInCompose, sessions = [], journalEntries = [], addJournalEntry, deleteJournalEntry, journalHintShown, dismissJournalHint, profile, tabVisits, elementalsDisabled, omenShown, dismissOmen, seenElementalIds, setSeenElementalIds, featuredElementals, setFeaturedElementals, wildElementals, rolledElementalIds, rolledElementalAt, rolledElementalAction, autoOpenArrivalId, onAutoOpenConsumed, lockedCrystal, setLockedCrystal, elementalsHintShown, dismissElementalsHint, mode, setMode, setModeUserAction, catalogueFilter, setCatalogueFilter, blendTourActive, blendTourStep, blendTourFamilyMode, blendTourControlsOpen, blendTourAxis, lodestoneCharge = 0, onChargedSummon }) => {
  // Journal composer visibility — toggled by the "+ new entry" button
  // on Compose · Shelf · Journal.
  const [journalComposerOpen, setJournalComposerOpen] = useState(false);
  // Active form-style mode for the journal composer. Lifted out of
  // JournalComposer so the chooser can live in the parent and the
  // four entry-points (free / haiku / limerick / poem) double as
  // both "open the composer" and "switch the active mode" — the
  // tab strip that used to sit inside the composer is gone.
  const [journalMode, setJournalMode] = useState("free");
  // Dropdown visibility for the "Write something" trigger. The four
  // form choices (free / haiku / limerick / poem) used to occupy a
  // four-card grid in the page; folding them behind a dropdown keeps
  // the journal timeline as the page's center of gravity.
  const [writeMenuOpen, setWriteMenuOpen] = useState(false);
  // Close the composer whenever the user navigates away from the
  // journal sub-view — switching apothecary/shelf mode, switching
  // section, or moving to a different journal sub-tab. Without this
  // the composer's open flag could outlive the journal context that
  // surfaced it; the next time the user landed back on the journal
  // tab it could re-render an unintended writing surface.
  React.useEffect(() => {
    setJournalComposerOpen(false);
    setWriteMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, mode]);
  // Section-aware mode clamp. Each section has a fixed set of valid
  // sub-modes (apothecary: reverse / compendium; shelf:
  // recipes / journal / visitors). If the mode somehow drifts into an
  // out-of-section value — usually because a deep-link from the
  // other section was applied before the section guard caught it —
  // snap back to the section's default. Belt-and-suspenders for the
  // composeView section tag above.
  React.useEffect(() => {
    // "forward" (Vibe) was retired; the Recipes filter on Shelf now
    // covers that flow. Any deep-link or stale persisted state with
    // "forward" gets snapped back to "reverse" by the section guard.
    const apothecaryModes = new Set(["reverse", "compendium"]);
    // "pantry" (Cabinet) was retired along with the pantry feature;
    // stale persisted state lands back on the section's default.
    // Elementals was previously a sub-toggle inside Journal; promoted to
    // a top-level Notebook sub-tab so it surfaces in the dock and gets
    // the discoverability the feature deserves.
    const shelfModes      = new Set(["recipes", "journal", "visitors"]);
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
  const { unit, weightUnit } = useUnit();
  // Mode universe per section (state lives in App so the bottom
  // TabBar can render the sub-tabs as part of the same dock):
  //   apothecary: reverse (Blend) | compendium (Herbanium)
  //   shelf:      recipes | journal (elementals nested under journal)
  // Secondary toggle inside the Journal sub-tab — flips between the
  // brew/entry timeline and the elemental Elementals that used to sit
  // as its own primary tab.
  // Recipes-tab "More filters" disclosure state. Default collapsed so the
  // filter strip lands quiet (collection row). Expands
  // to reveal mood + flavor rows when the user wants to narrow further.
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [reverseIngs, setReverseIngs] = useState([]);

  // When a favorite is tapped on Home (or a saved blend in Apothecary),
  // composePreselect arrives here. Switch to Recipe Book / favorites so
  // the user sees their saved recipe highlighted, ready to set intent.
  React.useEffect(() => {
    if (!composePreselect) return;
    setMode("recipes");
    setCatalogueFilter({ collection: "favorites", moods: [], flavors: [] });
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
    if (composeView.journalFilter) setJournalFilter(composeView.journalFilter);
    // Legacy deep-link compat — old links carried journalSubTab "elementals"
    // when Elementals was nested inside Journal. Elementals is now its own
    // top-level Notebook sub-mode, so route the deep-link there instead.
    if (composeView.journalSubTab === "elementals") setMode("elementals");
  }, [composeView?.at]);

  return (
    <div style={{ padding: "18px 20px 24px", fontFamily: ff.sans }}>

      {mode === "reverse" && (
        <ReverseCompose reverseIngs={reverseIngs} setReverseIngs={setReverseIngs} go={go} startBrew={startBrew} saveComposedBlend={saveComposedBlend} generatedBlends={generatedBlends} hiddenBlendIds={hiddenBlendIds} blendTourActive={blendTourActive} blendTourStep={blendTourStep} blendTourFamilyMode={blendTourFamilyMode} blendTourControlsOpen={blendTourControlsOpen} blendTourAxis={blendTourAxis} />
      )}

      {/* Visitors — the notebook's third sub-tab. The lodestone
          plus the journal of observed elementals. Notebook is the
          collection-and-record register (Recipes / Journal /
          Visitors); the apothecary stays focused on the active
          making tools (Blend / Herbanium reference). */}
      {mode === "visitors" && (
        <ElementalsView
          lodestoneCharge={lodestoneCharge}
          onChargedSummon={onChargedSummon}
          tourStep={blendTourStep}
          profile={profile}
          sessions={sessions}
          savedBlendIds={savedBlendIds}
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
          rolledElementalIds={rolledElementalIds}
          rolledElementalAt={rolledElementalAt}
          rolledElementalAction={rolledElementalAction}
          autoOpenArrivalId={autoOpenArrivalId}
          onAutoOpenConsumed={onAutoOpenConsumed}
          lockedCrystal={lockedCrystal}
          setLockedCrystal={setLockedCrystal}
          elementalsHintShown={elementalsHintShown}
          dismissElementalsHint={dismissElementalsHint}
        />
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
            {/* Timeline filter chips — All / Cups / Entries — narrow
                what the user sees in the journal scroll below. */}
            <div data-tour="reflections-log" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
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

            {/* Write trigger — folds the four form choices behind a
                single dropdown so the timeline below stays the page's
                center of gravity. Closed: "Write something ▾". Open:
                a small menu of free / haiku / limerick / poem with
                a one-line hint each. Picking a form collapses the
                menu and opens the composer locked to that mode. */}
            {(() => {
              const choices = [
                ["free",     "Free",     "open page"],
                ["haiku",    "Haiku",    "5 / 7 / 5"],
                ["limerick", "Limerick", "5 lines, A-A-B-B-A"],
                ["poem",     "Poem",     "any short form"],
              ];
              const activeChoice = choices.find(c => c[0] === journalMode) || choices[0];
              const triggerLabel = journalComposerOpen
                ? `Writing — ${activeChoice[1].toLowerCase()}`
                : "Write something";
              return (
                <div data-tour="reflections-write" style={{ marginBottom: 12, position: "relative" }}>
                  <button
                    onClick={() => setWriteMenuOpen(o => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={writeMenuOpen}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, padding: "10px 14px",
                      background: theme.cream,
                      border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
                      cursor: "pointer",
                      fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: theme.inkSoft,
                      transition: "background 0.18s ease",
                    }}
                  >
                    <span>{triggerLabel}</span>
                    <span style={{
                      display: "inline-block",
                      transform: writeMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.18s ease",
                      color: theme.ash, fontSize: 12,
                    }}>▾</span>
                  </button>
                  {writeMenuOpen && (
                    <div
                      role="listbox"
                      style={{
                        marginTop: 6,
                        background: theme.ivory,
                        border: `1px solid ${theme.ruleSoft}`, borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: "0 6px 18px -8px rgba(30,24,18,0.18)",
                      }}
                    >
                      {choices.map(([key, label, hint], i) => {
                        const active = journalComposerOpen && journalMode === key;
                        return (
                          <button
                            key={key}
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              setJournalMode(key);
                              setJournalComposerOpen(true);
                              setWriteMenuOpen(false);
                            }}
                            style={{
                              width: "100%", textAlign: "left",
                              display: "flex", alignItems: "baseline", justifyContent: "space-between",
                              gap: 10, padding: "10px 14px",
                              background: active ? "rgba(176, 84, 47, 0.06)" : "transparent",
                              border: "none",
                              borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                              cursor: "pointer",
                            }}
                          >
                            <span style={{
                              fontFamily: ff.serif, fontSize: 15,
                              color: active ? theme.terra : theme.ink,
                            }}>{label}</span>
                            <span style={{
                              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                              color: theme.ash,
                            }}>{hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {journalComposerOpen && (
              <JournalComposer
                mode={journalMode}
                setMode={setJournalMode}
                onCancel={() => setJournalComposerOpen(false)}
                onSave={(text, kind, note, currentMoods, landedMoods, flavors, title) => {
                  if (addJournalEntry) addJournalEntry(text, kind, note, currentMoods, landedMoods, flavors, title);
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
          const flavorMap = FAMILY_BY_FLAVOR || {};
          // INGREDIENTS is a dict keyed by id, not an array — look up by key.
          const blendMatchesFlavors = (b) => {
            if (flavorSet.size === 0) return true;
            const ings = b.ingredients || [];
            for (const it of ings) {
              if (!it || !it.id) continue;
              const ing = INGREDIENTS[it.id];
              if (!ing) continue;
              const fls = ing.flavors || [];
              for (const fl of fls) {
                if (!fl) continue;
                const fam = flavorMap[fl] || fl;
                if (flavorSet.has(fam) || flavorSet.has(fl)) return true;
              }
            }
            return false;
          };
          const blendMatchesMoods = (b) => {
            if (moodSet.size === 0) return true;
            return moodSet.has(b.mood);
          };
          const catVisible = pool.filter(b =>
            blendMatchesMoods(b) && blendMatchesFlavors(b)
          );
          if (catVisible.length === 0 && (moodSet.size > 0 || flavorSet.size > 0)) {
            const subBits = [
              moodSet.size > 0 ? `mood (${[...moodSet].join(", ")})` : null,
              flavorSet.size > 0 ? `flavor (${[...flavorSet].join(", ")})` : null,
            ].filter(Boolean).join(" + ");
            catEmpty = `No ${cf.collection} blends match ${subBits}. Tap a chip to clear.`;
          }

          // One-line meta header: count + the active sub-filters that
          // narrowed it. Replaces the two-line description band so the
          // filter strip stays compact when the user knows what they
          // picked. Reads "12 traditional · calm · floral".
          const collectionLabels = {
            favorites: "favorites", all: "all recipes",
            traditional: "traditional", twists: "twists",
            "house recipes": "house",
          };
          const metaBits = [
            `${catVisible.length} ${collectionLabels[cf.collection] || cf.collection}`,
            ...((cf.moods || []).length ? [(cf.moods).join(" / ")] : []),
            ...((cf.flavors || []).length ? [(cf.flavors).map(f => {
              const c = FLAVOR_FAMILY_CHIPS.find(x => x.family === f);
              return c ? c.label.toLowerCase() : f;
            }).join(" / ")] : []),
          ];
          const subFilterCount = (cf.moods || []).length + (cf.flavors || []).length;

          return (
            <div style={{ marginTop: 4 }}>
              {/* Collection row — always visible. Single-select bucket
                  for what kind of recipes to browse. */}
              <div data-tour="recipes-filter">
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
              </div>

              {/* "More filters" disclosure — right-aligned so the
                  filter strip's at-rest height stays compact. */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                gap: 12, marginTop: 4, marginBottom: 10,
              }}>
                {/* Disclosure — opens the mood + flavor rows below.
                    Shows a small count badge when sub-filters are
                    active so the user can spot "narrowed" at a glance
                    without expanding. */}
                <button
                  onClick={() => setFiltersExpanded(v => !v)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                    color: theme.inkSoft, background: "transparent",
                    border: "none", padding: "4px 0", cursor: "pointer",
                  }}
                >
                  {filtersExpanded ? "less" : "more filters"}
                  {subFilterCount > 0 && !filtersExpanded && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 16, height: 16, padding: "0 5px",
                      borderRadius: 999, background: theme.terra, color: theme.cream,
                      fontFamily: ff.sans, fontSize: 9, fontWeight: 600,
                    }}>{subFilterCount}</span>
                  )}
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden
                       style={{
                         transition: "transform 0.18s ease",
                         transform: filtersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                       }}>
                    <path d="M1.5 3 L4.5 6 L7.5 3" stroke={theme.inkSoft}
                          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
              </div>

              {/* Mood + flavor rows live behind the disclosure. Hidden
                  by default so the filter strip lands at two controls
                  (chips + more); expanded for power users. */}
              {filtersExpanded && (
                <div style={{ marginBottom: 4 }}>
                  <FilterRow
                    label="mood"
                    multi
                    perRow={4}
                    items={PARENT_MOODS.map(m => [m.key, m.label])}
                    value={cf.moods}
                    setValue={(m) => toggleInList("moods", m)}
                  />
                  <FilterRow
                    label="flavor"
                    multi
                    perRow={5}
                    items={FLAVOR_FAMILY_CHIPS.map(c => [c.family, c.label])}
                    value={cf.flavors}
                    setValue={(f) => toggleInList("flavors", f)}
                  />
                </div>
              )}

              {/* Add-recipe CTA — quieter outline button now lives below
                  the meta row so the filter zone reads as one block and
                  the create-action sits adjacent to the list it adds to. */}
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
                  padding: "9px 14px",
                  marginTop: 6, marginBottom: 12,
                  fontFamily: ff.serif, fontSize: 13,
                  color: theme.terra,
                  background: "transparent",
                  border: `1px solid ${theme.ruleSoft}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.18s ease, border-color 0.18s ease",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 2.5 L6 9.5 M2.5 6 L9.5 6" stroke={theme.terra} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                add a recipe
              </button>

              {/* Compact one-line meta — count + active sub-filters,
                  separated by middle-dots. Replaces the prior two-line
                  description band; the per-collection blurbs were nice
                  but ate vertical space the user paid for every visit. */}
              <div style={{
                marginBottom: 12, padding: "7px 12px",
                borderLeft: `2px solid ${theme.terra}`,
                background: "rgba(176,84,47,0.04)",
                borderRadius: "0 6px 6px 0",
                fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.06em",
                color: theme.inkSoft, lineHeight: 1.45,
              }}>
                {metaBits.join(" · ")}
              </div>


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
                <>
                  {catVisible.map((b, i) => {
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
                    <div key={b.id} data-tour={i === 0 ? "recipes-row" : undefined} style={{ position: "relative" }}>
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
                  })}
                  {/* "Try these" — recommendations carousel that
                      surfaces in the favorites tab while the user's
                      favorites list is sparse (≤3 pinned). Sits
                      below the user's own favorites so their pinned
                      list stays the priority view; the carousel is
                      a secondary "if you're looking for more" rail.
                      Scoring lives in helpers/recommend.js and is
                      driven by onboarding draws/flavors initially,
                      evolving to incorporate last-30-days mood
                      patterns and high-rated cups as the user logs
                      more. Hides once they've built out their
                      favorites or whenever the scorer returns
                      nothing matching. */}
                  {cf.collection === "favorites" && catVisible.length <= 3 && (() => {
                    const recs = recommendBlends({
                      blends: [...traditional, ...experimental],
                      profile,
                      sessions,
                      favoriteIds: favoriteBlendIds,
                      hiddenIds: hiddenBlendIds,
                      limit: 3,
                    });
                    if (recs.length === 0) return null;
                    return (
                      <div style={{ marginTop: 18, marginBottom: 14 }}>
                        <div style={{
                          display: "flex", alignItems: "baseline",
                          justifyContent: "space-between", gap: 8,
                          marginBottom: 8,
                        }}>
                          <div style={{
                            fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.16em",
                            textTransform: "uppercase", color: theme.terra,
                            fontWeight: 600,
                          }}>
                            Try these
                          </div>
                          <div style={{
                            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                            color: theme.ash,
                          }}>
                            picked for your taste
                          </div>
                        </div>
                        <div style={{
                          display: "flex", gap: 10, overflowX: "auto",
                          paddingBottom: 4,
                          scrollSnapType: "x mandatory",
                          WebkitOverflowScrolling: "touch",
                        }}>
                          {recs.map(b => (
                            <button
                              key={b.id}
                              onClick={() => openBlend && openBlend(b.id)}
                              style={{
                                flex: "0 0 200px",
                                scrollSnapAlign: "start",
                                textAlign: "left",
                                background: theme.cream,
                                border: `1px solid ${theme.ruleSoft}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                                cursor: "pointer",
                                display: "flex", flexDirection: "column", gap: 6,
                                boxShadow: shadow.card,
                                transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                              }}
                            >
                              <div style={{
                                fontFamily: ff.serif, fontSize: 15, color: theme.ink,
                                lineHeight: 1.2,
                                overflow: "hidden", textOverflow: "ellipsis",
                                display: "-webkit-box", WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}>
                                {b.name}
                              </div>
                              {b.subtitle && (
                                <div style={{
                                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                                  color: theme.inkSoft, lineHeight: 1.35,
                                  overflow: "hidden", textOverflow: "ellipsis",
                                  display: "-webkit-box", WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}>
                                  {b.subtitle}
                                </div>
                              )}
                              <div style={{
                                marginTop: "auto", paddingTop: 4,
                                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.12em",
                                textTransform: "uppercase", color: theme.ash,
                              }}>
                                {[b.mood, b.flavor].filter(Boolean).join(" · ")}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
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

      {/* Apothecary · Herbanium — the full ingredient reference.
          Every ingredient shows at full presence. */}
      {mode === "compendium" && (
        <LibraryScreen
          go={go}
          hideHeader
        />
      )}

    </div>
  );
};

// FilterRow — recipe-page filter strip with an eyebrow label and a
// row of equal-width chip buttons that span the full container.
// Each chip is flex:1 so the row extends edge-to-edge regardless
// of label length, and active vs inactive uses the same ink-fill
// pattern as the catalog filter chips for consistency
// across the app.
const FilterRow = ({ label, items, value, setValue, multi = false, perRow = null }) => {
  // Single-select rows pass `value` as a string; multi-select rows pass
  // an array of selected keys. Active state is computed accordingly so
  // both modes share the same chip styling.
  const isActive = (key) => multi ? (value || []).includes(key) : value === key;
  // Chip width is computed off perRow so chips wrap onto a second line
  // at the same card width as other rows. perRow defaults to items.length
  // (single line, equal-width). Pass a smaller perRow when there are more
  // chips than fit comfortably across the row.
  const cap = perRow || items.length;
  const gap = 4;
  const basis = `calc((100% - ${(cap - 1) * gap}px) / ${cap})`;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.18em",
        textTransform: "uppercase", color: theme.ash,
        marginBottom: 5,
      }}>{label}</div>
      <div style={{ display: "flex", gap, width: "100%", flexWrap: "wrap", rowGap: gap }}>
        {items.map(([key, lbl]) => {
          const active = isActive(key);
          return (
            <button
              key={key}
              onClick={() => setValue(key)}
              style={{
                flexGrow: 0, flexShrink: 0, flexBasis: basis,
                minWidth: 0, whiteSpace: "nowrap",
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

export const ReverseCompose = ({ reverseIngs, setReverseIngs, go, startBrew, saveComposedBlend, generatedBlends, hiddenBlendIds, blendTourActive, blendTourStep, blendTourFamilyMode, blendTourControlsOpen, blendTourAxis }) => {
  // When the guided Blend tour starts on an empty pot, drop in a small
  // example *blend* — two ingredients at different parts (2 / 1) — so the
  // walkthrough shows what blending actually is: balancing ingredients,
  // with the parts and the steep together shaping how it all extracts.
  // Two and not three on purpose: the prediction bars and the brew
  // sliders both have to fit on screen beside the tour callout, so the
  // user can watch the flavor/mood bars move as the sliders change.
  // Left in place after; the user can retune or remove either with ×.
  React.useEffect(() => {
    if (blendTourActive && reverseIngs.length === 0) {
      setReverseIngs(["chamomile", "peppermint"]);
      setPartsById({ chamomile: 2, peppermint: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blendTourActive]);
  const [rcSaveName, setRcSaveName] = useState("");
  const [rcSavePromptOpen, setRcSavePromptOpen] = useState(false);
  const [rcSaveStatus, setRcSaveStatus] = useState(null);
  // Brew-save confirmation — reverse-built blends always start unsaved.
  const [rcBrewAsk, setRcBrewAsk] = useState(false);
  const [rcPendingBrew, setRcPendingBrew] = useState(null);
  const { unit, weightUnit } = useUnit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  // Per-ingredient parts — explicit user-set values keyed by id.
  // Defaults: first ingredient added = 2 parts (the lead), every
  // subsequent addition = 1 part. The user can override via the
  // per-row stepper. We don't seed partsById on add because letting
  // defaults flow from the function below means a user re-arranging
  // ingredients won't see surprise locked values from prior picks.
  const [partsById, setPartsById] = useState({});
  // Garbage-collect explicit values for ingredients that left the
  // pot, so re-adding the same ingredient picks up the default
  // again rather than the stale stepper state.
  React.useEffect(() => {
    setPartsById(prev => {
      const next = {};
      let changed = false;
      for (const id of Object.keys(prev || {})) {
        if (reverseIngs.includes(id)) next[id] = prev[id];
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [reverseIngs]);
  const partsFor = (id) => {
    if (partsById[id] != null) return partsById[id];
    // First-added is the default lead at 2 parts; the rest start
    // as 1-part accents. The user can change the ratio anytime
    // via the row stepper without engaging if they don't want to.
    // 2:1 lands closer to a typical hand-mix where the lead carries
    // about twice the weight of the accents, instead of the older
    // 4:1 split that pushed strong leads into over-pull territory.
    return id === reverseIngs[0] ? 2 : 1;
  };
  const setParts = (id, n) => {
    const clamped = Math.max(1, Math.min(9, Math.round(n)));
    setPartsById(prev => ({ ...prev, [id]: clamped }));
  };
  // Primary highlight = whichever row has the highest parts (when
  // it stands clearly above 1). Rows tied at the max all get the
  // highlight; when everything's at 1 part no row is the lead.
  const maxParts = reverseIngs.length === 0
    ? 0
    : Math.max(...reverseIngs.map(partsFor));
  const isPrimary = (id) => maxParts > 1 && partsFor(id) === maxParts;
  // Mood + flavor sub-filters — multi-select. Same vocabulary as
  // Recipes (mood) and Herbanium (flavor) so filter language
  // stays consistent. Both empty = no constraint; either narrows the
  // ingredient pool via the matching field on each ingredient.
  const [pickerMoods, setPickerMoods] = useState([]);
  const [pickerFlavors, setPickerFlavors] = useState([]);
  const togglePickerMood = (m) =>
    setPickerMoods(prev => prev.includes(m)
      ? prev.filter(x => x !== m)
      : [...prev, m]);
  const togglePickerFlavor = (fam) =>
    setPickerFlavors(prev => prev.includes(fam)
      ? prev.filter(x => x !== fam)
      : [...prev, fam]);
  // "More filters" disclosure — collapses mood + flavor rows so the
  // picker's at-rest state stays compact (search + category chips).
  // Mirrors the Recipes/Herbanium pattern.
  const [pickerFiltersExpanded, setPickerFiltersExpanded] = useState(false);

  // Picker compatibility scoring — for each candidate, how well does
  // it fit the blend's CURRENT brewing-window intersection on both
  // axes (temp + time)? The blend's intersection is the band where
  // every existing ingredient is at home; adding a candidate that
  // fits in that band keeps the blend cohesive. Score:
  //   2 — both temp and time overlap (green: full overlap)
  //   1 — only one axis overlaps      (yellow: partial)
  //   0 — neither axis overlaps        (red: poor fit)
  //   null — pot is empty, no comparison possible (neutral)
  // Declared above filteredAvailable because the sort callback below
  // calls overlapScore — keeping it after would put the helper in TDZ
  // and crash the page on first render.
  const blendOverlap = React.useMemo(() => {
    if (reverseIngs.length === 0) return null;
    let tLo = -Infinity, tHi = Infinity;
    let sLo = -Infinity, sHi = Infinity;
    for (const id of reverseIngs) {
      const ing = INGREDIENTS[id];
      if (!ing) continue;
      tLo = Math.max(tLo, ing.tempC[0]);
      tHi = Math.min(tHi, ing.tempC[1]);
      sLo = Math.max(sLo, ing.timeS[0]);
      sHi = Math.min(sHi, ing.timeS[1]);
    }
    return { tLo, tHi, sLo, sHi };
  }, [reverseIngs]);

  const overlapScore = (candidateId) => {
    if (!blendOverlap) return null;
    const c = INGREDIENTS[candidateId];
    if (!c) return null;
    // Strict inequality (>, not >=) on each axis so a candidate that
    // only meets the blend at a single boundary point doesn't score
    // green. The BlendExtractionExplorer requires a strictly-positive
    // intersection band before it paints the green sweet-spot bar
    // (a zero-width intersect falls back to the yellow compromise
    // zone). Matching its rule here keeps the picker's color and the
    // explorer's bar in sync — pick all-green and the explorer lights
    // up green on both axes.
    const newTLo = Math.max(c.tempC[0], blendOverlap.tLo);
    const newTHi = Math.min(c.tempC[1], blendOverlap.tHi);
    const tempOK = newTHi > newTLo;
    const newSLo = Math.max(c.timeS[0], blendOverlap.sLo);
    const newSHi = Math.min(c.timeS[1], blendOverlap.sHi);
    const timeOK = newSHi > newSLo;
    return (tempOK ? 1 : 0) + (timeOK ? 1 : 0);
  };

  // Set of candidate ids that would introduce a high-severity safety
  // flag ("skip this combination") if added to the pot. We force these
  // to red in the picker even when their temp/time overlap is fine —
  // a high-severity interaction overrides brewing-window math, and
  // letting a clean-looking green chip carry that risk would mislead.
  // Recomputed only when the pot itself changes; we run the safety
  // check once per available candidate at that point.
  const dangerousCandidates = React.useMemo(() => {
    const set = new Set();
    for (const id of Object.keys(INGREDIENTS)) {
      if (reverseIngs.includes(id)) continue;
      const flags = checkIngredientInteractions([...reverseIngs, id]);
      if (flags.some(f => f.severity === "high")) set.add(id);
    }
    return set;
  }, [reverseIngs]);

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
      if (pickerMoods.length > 0) {
        const moods = new Set(pickerMoods);
        const effects = ing.effects || [];
        // Match an ingredient when at least one of the selected moods
        // is expressed at strength >= 3 — same threshold the Herbanium
        // effect filter uses, so weak/incidental matches don't bubble.
        const hit = effects.some(([t, s]) => moods.has(t) && (s || 0) >= 3);
        if (!hit) return false;
      }
      if (pickerFlavors.length > 0) {
        const fams = new Set(pickerFlavors);
        const ingFlavors = ing.flavors || [];
        const hit = ingFlavors.some(fl => {
          const fam = FAMILY_BY_FLAVOR[fl] || fl;
          return fams.has(fam) || fams.has(fl);
        });
        if (!hit) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [ing.name, ing.latin, ...(ing.flavors || []), ing.category, ing.subcategory || ""]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    // Sort: best fit first (green → yellow → red), then alphabetical
    // within each band. When the pot is empty everything scores null
    // so the list collapses to plain alphabetical order. Dangerous
    // candidates (high-severity safety flag) score as 0 so they sink
    // alongside other red chips — keeps the display order matched to
    // what the user sees rendered. Pre-compute scores once.
    .map(id => ({
      id,
      score: dangerousCandidates.has(id) ? 0 : overlapScore(id),
    }))
    .sort((a, b) => {
      const sa = a.score ?? -1;
      const sb = b.score ?? -1;
      if (sa !== sb) return sb - sa;
      return INGREDIENTS[a.id].name.localeCompare(INGREDIENTS[b.id].name);
    })
    .map(x => x.id);

  // Derive temperature and time from the actual ingredients rather than hardcoding.
  // Uses range intersection when possible, weighted-grams dominance when not.
  // Weighted ingredient list — parts double as grams so the
  // perception pipeline sees the user's exact ratio choice. The
  // first-added defaults to 2 parts; subsequent ingredients land as
  // 1-part accents. Users who never engage with the stepper get
  // the same lead/accent shape curated recipes use; users who do
  // engage can dial any ratio they want.
  const ingsForProfile = reverseIngs.map(id => ({
    id,
    g: partsFor(id),
    role: isPrimary(id) ? "lead" : "accent",
  }));
  const profile = computeBrewProfile(ingsForProfile);

  // Live brew state — lifted up so the compatibility warning reacts to the
  // user's slider movements in the BlendExtractionExplorer below.
  const [brewTempC, setBrewTempC] = useState(profile.tempC);
  const [brewTimeS, setBrewTimeS] = useState(profile.timeS);
  useEffect(() => {
    setBrewTempC(profile.tempC);
    setBrewTimeS(profile.timeS);
  }, [profile.tempC, profile.timeS]);

  // Guided-tour demo: while the Blend tour is on the graph/slider steps,
  // gently oscillate the steep time so the prediction bars visibly move —
  // showing the user that the sliders drive the graph. It's demo-only
  // motion; it stops when the step advances or the tour ends. Honors
  // prefers-reduced-motion.
  const tourDemoActive = blendTourStep === "blend-graph" || blendTourStep === "blend-sliders";
  useEffect(() => {
    if (!tourDemoActive) return undefined;
    const times = reverseIngs.map(id => INGREDIENTS[id]?.timeS).filter(Boolean);
    if (times.length === 0) return undefined;
    if (typeof window !== "undefined" && window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let lo = Math.min(...times.map(t => t[0]));
    let hi = Math.max(...times.map(t => t[1]));
    const span = hi - lo;
    lo += span * 0.12; hi -= span * 0.12; // inset so the thumb never clamps at the edge
    if (hi <= lo) return undefined;
    let phase = 0;
    const id = setInterval(() => {
      phase += 0.09;
      const frac = (Math.sin(phase) + 1) / 2;
      setBrewTimeS(Math.round(lo + frac * (hi - lo)));
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourDemoActive, reverseIngs]);

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

  return (
    <>

      {/* Picker leads the page so a fresh user sees the active surface
          immediately. The pot below fills as ingredients are added,
          sitting next to the brewer so the pot contents stay visible
          while the user slides temperature/time. */}
      <SectionLabel n="i">Add from the apothecary</SectionLabel>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {/* Search input */}
        <div data-tour="blend-search" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: theme.ivory, border: `1px solid ${theme.ruleSoft}`,
        }}>
          <span style={{ color: theme.ash, fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search the herbanium…"
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

        {/* Category filter pills — matched to the flavor row's eyebrow
            + spread layout so the two filter axes share visual style.
            7 chips spread across 2 rows of 4 so they breathe rather
            than crowd flush-left at half-width. */}
        <div style={{ marginTop: 8 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 5,
          }}>category</div>
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
            maxPerRow={4}
            align="spread"
            renderItem={([key, label]) => {
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(key)} style={{
                  fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                  padding: "3px 9px", borderRadius: 999,
                  // Inactive chips sit on a faint card wash + slightly
                  // stronger rule so they read as distinct surfaces
                  // against the dark-mode background, where transparent
                  // chips were melting into the page. Active stays the
                  // solid ink fill so the picked state still pops.
                  border: `1px solid ${active ? theme.ink : theme.rule}`,
                  background: active ? theme.ink : "rgba(var(--hi-rgb), 0.05)",
                  color: active ? theme.cream : theme.inkSoft,
                  cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                  boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                }}>{label}</button>
              );
            }}
          />
        </div>

        {/* "More filters" disclosure — collapses mood + flavor rows
            so the picker's at-rest state stays compact. Same pattern
            as Recipes / Herbanium so the filter strip vocabulary is
            consistent across the app. Active-count badge surfaces
            when sub-filters are narrowing the list behind the fold. */}
        {(() => {
          const subFilterCount = pickerMoods.length + pickerFlavors.length;
          return (
            <button
              onClick={() => setPickerFiltersExpanded(v => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 6, marginBottom: pickerFiltersExpanded ? 4 : 0,
                fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.06em",
                color: theme.inkSoft, background: "transparent",
                border: "none", padding: "4px 0", cursor: "pointer",
              }}
            >
              {pickerFiltersExpanded ? "less" : "more filters"}
              {subFilterCount > 0 && !pickerFiltersExpanded && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 16, height: 16, padding: "0 5px",
                  borderRadius: 999, background: theme.terra, color: theme.cream,
                  fontFamily: ff.sans, fontSize: 9, fontWeight: 600,
                }}>{subFilterCount}</span>
              )}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden
                   style={{
                     transition: "transform 0.18s ease",
                     transform: pickerFiltersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                   }}>
                <path d="M1.5 3 L4.5 6 L7.5 3" stroke={theme.inkSoft}
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          );
        })()}

        {pickerFiltersExpanded && (
          <>
            {/* Mood filter — multi-select. Matches an ingredient when
                one of its effects expresses the selected mood at
                strength >= 3 (same threshold Herbanium's effect
                filter uses). */}
            <div style={{ marginTop: 6 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 5,
              }}>mood</div>
              <ChipRows
                items={[
                  ["calm",      "Calm"],
                  ["focus",     "Focus"],
                  ["energy",    "Energy"],
                  ["comfort",   "Comfort"],
                  ["sleepy",    "Sleepy"],
                  ["soothing",  "Soothing"],
                  ["warming",   "Warming"],
                  ["cooling",   "Cooling"],
                  ["digestive", "Digestive"],
                ]}
                gap={4}
                rowGap={4}
                maxPerRow={5}
                align="spread"
                renderItem={([key, label]) => {
                  const active = pickerMoods.includes(key);
                  return (
                    <button key={key} onClick={() => togglePickerMood(key)} style={{
                      fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                      padding: "3px 9px", borderRadius: 999,
                      border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                      background: active ? theme.ink : "transparent",
                      color: active ? theme.cream : theme.ash,
                      cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                    }}>{label.toLowerCase()}</button>
                  );
                }}
              />
            </div>

            {/* Flavor filter — multi-select family chips. Lets the user
                compose by register ("I want a floral accent") rather
                than only by botanical category, matching how the rest
                of the app's filter surfaces work. */}
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase", color: theme.ash, marginBottom: 5,
              }}>flavor</div>
              <ChipRows
                items={FLAVOR_FAMILY_CHIPS.map(c => [c.family, c.label])}
                gap={4}
                rowGap={4}
                maxPerRow={5}
                align="spread"
                renderItem={([key, label]) => {
                  const active = pickerFlavors.includes(key);
                  return (
                    <button key={key} onClick={() => togglePickerFlavor(key)} style={{
                      fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.02em",
                      padding: "3px 9px", borderRadius: 999,
                      border: `1px solid ${active ? theme.ink : theme.ruleSoft}`,
                      background: active ? theme.ink : "transparent",
                      color: active ? theme.cream : theme.ash,
                      cursor: "pointer", flex: 1, whiteSpace: "nowrap",
                    }}>{label.toLowerCase()}</button>
                  );
                }}
              />
            </div>
          </>
        )}

        {/* Filter / results divider — hairline rule spans the card's
            full width via negative horizontal margins, with a small
            "results" eyebrow + match count anchoring it as a labeled
            band rather than a bare line. Reads as: filters above,
            results below — no ambiguity. */}
        <div style={{
          marginTop: 14,
          marginLeft: -14, marginRight: -14,
          borderTop: `1px solid ${theme.rule}`,
        }} />
        <div style={{
          marginTop: 10, marginBottom: 8,
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.ash,
          }}>results</div>
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
          }}>
            {filteredAvailable.length} {filteredAvailable.length === 1 ? "match" : "matches"}
          </div>
        </div>

        {/* Scrollable results — soft ivory wash so the chip list reads
            as a distinct zone from the filter chips above.

            HALF THE HEIGHT IT USED TO BE (180 -> 90). The selector card
            was 418px of a 750px pane on a Pixel 9 — 56% of the screen
            spent on the thing you use to fill the pot rather than on the
            pot. At 90 the list still opens on three rows (~8 chips of
            53), with the third clipped, which is the scroll affordance:
            a list cut exactly at a row boundary reads as complete and
            nobody scrolls it.

            Worth knowing where the rest of the card goes, because
            halving this only reclaims 90 of those 418px: search 41,
            category chips 74, "more filters" 22, the results label 23,
            and ~77 of padding and margins. The list was the biggest
            single piece but not the majority. */}
        <div data-testid="ingredient-results" style={{
          maxHeight: 90, overflowY: "auto",
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
                // Compatibility score with the current pot's brewing
                // window: 2 = full overlap (temp + time), 1 = partial,
                // 0 = neither — null when the pot is empty. Drives the
                // chip's border + tinted background so the user can
                // see at a glance which candidates fit cleanly into
                // what's already in the pot.
                //
                // Safety override: if adding this candidate would
                // trigger a high-severity "skip this combination"
                // interaction, force red regardless of brewing-window
                // overlap. Safety beats fit; we don't want a green
                // chip ever to introduce a flagged combination.
                const isDangerous = dangerousCandidates.has(id);
                const rawScore = overlapScore(id);
                const score = isDangerous ? 0 : rawScore;
                const fitColor =
                  score === 2 ? theme.sageDeep
                  : score === 1 ? theme.ochre
                  : score === 0 ? theme.terra
                  : theme.rule;
                // Green gets a noticeably stronger fill than yellow so
                // the two bands separate at a glance. Yellow stays
                // soft so it reads as "ok-ish" rather than competing
                // with green's "best-fit" register. Red matches green
                // in saturation so a poor fit reads as a real warning.
                const fitBg =
                  score === 2 ? "rgba(125,140,108,0.20)"
                  : score === 1 ? "rgba(165,120,54,0.09)"
                  : score === 0 ? "rgba(176,84,47,0.18)"
                  : "transparent";
                const fitTitle = isDangerous
                  ? "Skip this combination — flagged interaction with what's in the pot"
                  : score === 2 ? "Full overlap with the pot's brew window"
                  : score === 1 ? "Matches the pot on temp or time, not both"
                  : score === 0 ? "Doesn't share a brew window with the pot"
                  : undefined;
                return (
                  <button
                    key={id}
                    onClick={() => setReverseIngs([...reverseIngs, id])}
                    title={fitTitle}
                    style={{
                      fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.02em",
                      padding: "5px 10px 5px 8px", borderRadius: 999,
                      border: `1px solid ${fitColor}`,
                      background: fitBg,
                      color: score === 0 ? theme.terra : theme.inkSoft,
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

      <div style={{ marginTop: 20 }}><SectionLabel n="ii">What's in the pot?</SectionLabel></div>
      <div style={{
        marginTop: 10, padding: 14, border: `1px solid ${theme.rule}`, borderRadius: 12,
        background: theme.cream,
      }}>
        {/* Helper eyebrow — anchors "parts" to a physical
            measurement so the caffeine and balance numbers
            downstream don't read as arbitrary. The implicit
            message: each tap on the stepper adds roughly a
            gram of dry leaf, and the bars below scale from the
            total dose. Single uppercase line keeps the at-rest
            visual weight light while the steppers themselves
            carry the interaction. */}
        {reverseIngs.length > 0 && (
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash,
            marginBottom: 8, lineHeight: 1.5,
          }}>
            <div>
              {weightUnit === "g"
                ? "1 part ≈ 1 g of dry leaf"
                : "1 part ≈ ½ tsp of dry leaf"}
            </div>
            <div>caffeine + balance scale from total</div>
          </div>
        )}
        {reverseIngs.map((id, idx) => {
          const primary = isPrimary(id);
          const parts = partsFor(id);
          return (
            <div
              key={id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 14px",
                margin: "0 -14px",
                gap: 6,
                background: primary ? "rgba(176,84,47,0.08)" : "transparent",
                borderLeft: primary
                  ? `3px solid ${theme.terra}`
                  : "3px solid transparent",
                transition: "background 0.18s ease, border-color 0.18s ease",
              }}
            >
              {/* Name + brewing window — clickable, routes to the
                  ingredient detail page. Now that the row no longer
                  doubles as a primary-toggle target, there's no
                  competing tap, so the name + parameters can carry
                  the navigation directly (no separate ⓘ button). */}
              <button
                onClick={() => go("ingredient", id)}
                style={{
                  flex: 1, minWidth: 0,
                  background: "transparent", border: "none", padding: 0,
                  textAlign: "left", cursor: "pointer",
                  fontFamily: ff.serif, fontSize: 15,
                  color: primary ? theme.ink : theme.inkSoft,
                  fontWeight: primary ? 500 : 400,
                  display: "flex", alignItems: "baseline", gap: 4,
                }}
              >
                {INGREDIENTS[id].name}
                <span style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash, marginLeft: 6 }}>
                  {formatTempShort(INGREDIENTS[id].tempC[0], INGREDIENTS[id].tempC[1], unit)}
                  {" · "}
                  {Math.round(INGREDIENTS[id].timeS[0] / 60)}–{Math.round(INGREDIENTS[id].timeS[1] / 60)}m
                </span>
              </button>

              {/* Parts stepper — − N + cluster. Bumps clamp 1..9 so
                  a single ingredient can't run away to 100. Active
                  number renders in terra when the row is the lead
                  so the eye reads "this is what's driving the cup"
                  without needing the PRIMARY label. */}
              <div
                data-tour={idx === 0 ? "blend-quantity" : undefined}
                style={{
                flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 4,
                marginRight: 4,
              }}>
                <button
                  onClick={() => setParts(id, parts - 1)}
                  disabled={parts <= 1}
                  aria-label={`decrease ${INGREDIENTS[id].name} parts`}
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "transparent",
                    border: `1px solid ${theme.ruleSoft}`,
                    color: parts <= 1 ? theme.rule : theme.inkSoft,
                    fontFamily: ff.sans, fontSize: 13, lineHeight: 1,
                    cursor: parts <= 1 ? "default" : "pointer",
                    padding: 0, opacity: parts <= 1 ? 0.5 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >−</button>
                <span
                  title={parts === 1 ? "1 part" : `${parts} parts`}
                  style={{
                    minWidth: 14, textAlign: "center",
                    fontFamily: ff.mono, fontSize: 12,
                    color: primary ? theme.terra : theme.inkSoft,
                    fontWeight: primary ? 600 : 500,
                  }}
                >{parts}</span>
                <button
                  onClick={() => setParts(id, parts + 1)}
                  disabled={parts >= 9}
                  aria-label={`increase ${INGREDIENTS[id].name} parts`}
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "transparent",
                    border: `1px solid ${theme.ruleSoft}`,
                    color: parts >= 9 ? theme.rule : theme.inkSoft,
                    fontFamily: ff.sans, fontSize: 13, lineHeight: 1,
                    cursor: parts >= 9 ? "default" : "pointer",
                    padding: 0, opacity: parts >= 9 ? 0.5 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >+</button>
              </div>

              <button
                onClick={() => setReverseIngs(reverseIngs.filter(x => x !== id))}
                style={{
                  background: "transparent", border: "none", color: theme.ash,
                  fontSize: 14, cursor: "pointer", padding: "0 4px",
                }}
              >×</button>
            </div>
          );
        })}

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

        {/* Pot empty-state — when no ingredients are selected, this card
            would otherwise be just an empty box. The hint nudges the
            user to the picker below as the obvious next move. */}
        {reverseIngs.length === 0 && rcSafetyFlags.length === 0 && (
          <div style={{
            padding: "12px 4px", textAlign: "center",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.ash, lineHeight: 1.5,
          }}>
            Pick a few ingredients above to start your blend.
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}><SectionLabel n="iii">The blender — see how it brews</SectionLabel></div>
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
            tourStep={blendTourStep}
            familyModeOverride={blendTourFamilyMode}
            controlsOpenOverride={blendTourControlsOpen}
            axisOverride={blendTourAxis}
            // Brew lives in the dock's brew panel now, not at the foot
            // of the page. It was the one action you had to leave the
            // controls to reach — scroll past every graph to commit the
            // cup you'd just been dialling in. Save moved to the steep
            // screen rather than doubling up here: one button keeps the
            // panel readable, and saving is the occasional act.
            brewAction={(
              <Button
                variant="primary"
                disabled={reverseIngs.length === 0}
                onClick={() => {
                  if (reverseIngs.length === 0) return;
                  const candidate = {
                    name: "Untitled blend",
                    ingredients: ingsForProfile,
                    tempC: brewTempC,
                    timeS: brewTimeS,
                  };
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
                icon={<Kettle size={14} c={theme.cream} />}
                // Compact pill, sized to sit in the dock's header row
                // beside the readout rather than as a band under the
                // slider. Short label for the same reason: "Start
                // brewing" needs a full-width button, "Brew" doesn't.
                style={{
                  fontSize: 12, padding: "5px 14px", gap: 6,
                  borderRadius: 999, letterSpacing: "0.04em",
                }}
              >Brew</Button>
            )}
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
              width: "100%", boxSizing: "border-box",
              fontFamily: ff.serif, fontSize: 15, color: theme.ink,
              background: "rgba(var(--hi-rgb),0.05)",
              border: `1px dashed ${theme.rule}`, borderRadius: 8,
              padding: "10px 12px", outline: "none",
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
  // Single-line preview of the entry body. Used as a fallback
  // headline when the entry has no title (legacy entries from
  // before the title field landed) so the timeline doesn't show
  // empty rows for those.
  const preview = (entry.text || "")
    .replace(/\s+/g, " ")
    .trim();
  // Headline rendered for the row: prefer the user's title; fall
  // back to a truncated preview; last-resort, the kind label.
  const headline = (entry.title && entry.title.trim()) || preview || label;
  // Mood arc — same registers as SessionRow so cup rows and entry
  // rows share visual vocabulary in the timeline.
  const start = (entry.currentMoods || []).join(", ").trim();
  const end   = (entry.landedMoods   || []).join(", ").trim();
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
        {/* Header: headline (title || preview) on left, time on right. */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
        }}>
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: ff.serif,
            fontStyle: isVerse && !entry.title ? "italic" : "normal",
            fontSize: 13.5, color: theme.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {headline}
          </span>
          <span style={{
            flexShrink: 0,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11, color: theme.ash,
          }}>{ago}</span>
        </div>
        {/* Mood arc — same coloring as cups (ochre coming-in → terra
            arrow → sage-deep landed). Only renders when at least one
            side of the arc is logged so untouched entries stay quiet. */}
        {(start || end) && (
          <div style={{
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {start && (
              <span style={{ color: theme.ochre, fontStyle: "normal" }}>{start}</span>
            )}
            <span style={{ margin: "0 5px", color: theme.terra, fontStyle: "normal" }}>→</span>
            {end && (
              <span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{end}</span>
            )}
          </div>
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
