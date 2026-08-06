/* ──────────────────────────────────────────────────────────────
   screens/BlendDetail.jsx — full-screen blend detail page.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { BrewSurface } from "../components/BrewSurface";
import { BrewDockProvider, BLEND_DETAIL_DOCK_ID, useDockHeight } from "../helpers/dock";
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
import { getBlend, sessionAgo, restHintForCelsius } from "../helpers/misc";
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

export const BlendDetail = ({ blendId, onClose, onOpenIngredient, onBrew, onSaveAndBrew, isFavorite, onToggleFavorite, sessions, go, twists = [], setTwists = () => {}, curatedOverrides = {}, setCuratedOverrides = () => {} }) => {
  const { unit, weightUnit } = useUnit();
  const b = getBlend(blendId);
  // The page runs UNDER this screen's dock so its glass has something
  // to show, exactly as the app shell's does. The scroll area is padded
  // by the slot's measured height so nothing is permanently hidden.
  const dockRef = React.useRef(null);
  const dockH = useDockHeight(dockRef);

  const [openMood, setOpenMood] = React.useState(null);
  const [openTag, setOpenTag] = React.useState(null);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
  // Section collapse state. Defaults to open so the first-time
  // view still shows everything; the user can collapse to focus.
  const [recipeOpen, setRecipeOpen] = React.useState(true);
  const [brewingOpen, setBrewingOpen] = React.useState(true);
  /* THE PANEL IS CONTROLLED, like every other brew window.
     It wasn't, and that was a bug rather than a style difference: the
     sliders moved, the strips responded, and Brew started the recipe's
     SAVED temperature and time regardless. You could dial a cup here
     and get a different one. */
  const [brewTempC, setBrewTempC] = React.useState(b?.tempC);
  const [brewTimeS, setBrewTimeS] = React.useState(b?.timeS);
  // Walking to another recipe swaps `blendId` without remounting.
  React.useEffect(() => {
    setBrewTempC(b?.tempC);
    setBrewTimeS(b?.timeS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blendId]);
  // Signal-tag overflow toggle. Cap visible at 6 (3 per row × 2
  // rows); anything beyond hides behind "+N more" until expanded.
  const [tagsExpanded, setTagsExpanded] = React.useState(false);
  const [tableAccentsOpen, setTableAccentsOpen] = React.useState(false);
  // Twists + curated grams overrides live on App (keyed by blendId)
  // so they survive overlay transitions (ingredient detail and back)
  // and reloads. App clears them on brew or save.
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);
  const [twistName, setTwistName] = React.useState("");
  if (!b) return null;

  const isRemix = twists.length > 0;
  // Effective curated rows pick up overrides when in remix mode.
  const effectiveCurated = (b.ingredients || []).map(ing => ({
    ...ing,
    g: isRemix && curatedOverrides[ing.id] != null ? curatedOverrides[ing.id] : ing.g,
  }));
  // Merged ingredient list for engine + brew.
  const mergedIngredients = [...effectiveCurated, ...twists];

  const addTwist = (id) => {
    const meta = INGREDIENTS[id];
    if (!meta) return;
    // Default grams: parse the leading number from `meta.dose` (e.g.
    // "1 tsp · 200ml" → 1) and fall back to 1g. Most herbal doses are
    // 1 tsp ≈ 1g; spices and high-density ingredients we under-dose
    // on purpose so the twist starts modest.
    const doseMatch = (meta.dose || "").match(/^([\d.]+)/);
    const defaultG = doseMatch ? Math.min(parseFloat(doseMatch[1]), 2) : 1;
    setTwists(prev => [...prev, { id, g: defaultG }]);
    setPickerOpen(false);
  };
  const removeTwist = (id) => setTwists(prev => {
    const next = prev.filter(t => t.id !== id);
    // Exiting remix mode — drop curated overrides so the recipe
    // visibly returns to canonical. Avoids stale stale grams persisting
    // invisibly after the user thinks they've reset.
    if (next.length === 0) setCuratedOverrides({});
    return next;
  });
  const updateTwistGrams = (id, g) => setTwists(prev => prev.map(t => t.id === id ? { ...t, g } : t));
  const updateCuratedGrams = (id, g) => setCuratedOverrides(prev => ({ ...prev, [id]: g }));

  const handleBrewTap = () => {
    if (twists.length === 0) {
      // The cup as dialled, not as saved. clearTwistState early-returns
      // when there's no twist state, so passing a blend here is safe.
      onBrew({ ...b, tempC: brewTempC, timeS: brewTimeS });
      return;
    }
    // Default name uses the curated blend name as the lineage anchor.
    setTwistName(`${b.name} — your twist`);
    setSaveModalOpen(true);
  };

  const buildModifiedBlend = () => ({
    ...b,
    tempC: brewTempC,
    timeS: brewTimeS,
    ingredients: mergedIngredients,
    // Drop the tradition/house flags on a twist — it's no longer the
    // canonical recipe, it's a user variation.
    tradition: null,
    house: null,
    experimental: true,
  });

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

  // Scroll-aware hairline under the sticky header — fades in once
  // the page has been scrolled at all so the header reads as a
  // separate layer once content sits behind it. Stays opaque so the
  // paper aesthetic isn't broken by a glassy backdrop blur.
  const [scrolled, setScrolled] = React.useState(false);

  return (
    // This screen covers the tab bar — absolute, inset 0, above it in
    // the stack — so it has to provide its own dock or the brew controls
    // portal to a slot the user can't see. They did exactly that for two
    // commits, which is what made the recipe page look read-only.
    //
    // Column, not one scrolling box: the dock is a flex SIBLING of the
    // scroll area, so the controls sit below the page rather than over
    // it and nothing is hidden underneath them. Same arrangement as the
    // app shell, one level down.
    <BrewDockProvider value={BLEND_DETAIL_DOCK_ID}>
    <div data-testid="blend-detail" style={{
      position: "absolute", top: 0, left: 0, right: 0,
      // Stops at the dock instead of covering it — the main menu is
      // never not on screen. Falls back to 0px so the screen still
      // fills its container if rendered outside the app shell.
      bottom: "var(--app-dock-h, 0px)", zIndex: 30,
      background: theme.ivory,
      display: "flex", flexDirection: "column",
    }}>
    <div
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      // minHeight:0 so this can actually shrink — without it a flex item
      // floors at its content height and the dock gets pushed off the
      // bottom of the screen instead of the page scrolling.
      style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", paddingBottom: dockH }}
    >
      {/* Sticky header — back + eyebrow + favorite-star stay pinned
          to the top of the scroll viewport. Pulled out of the cream
          hero band below so it can stay visible at any scroll depth. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 11,
        background: theme.ivory,
        padding: "10px 22px 8px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: scrolled ? "0 1px 0 rgba(60, 50, 40, 0.08)" : "0 1px 0 rgba(60, 50, 40, 0)",
        transition: "box-shadow 0.18s ease",
      }}>
        <Button variant="ghost" onClick={onClose}>← back</Button>
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

      {/* Hero — flat cream with a soft drop shadow so it reads as a
          lifted card sitting on the ivory page rather than a heavier
          gradient strip. Mirrors Home's card-on-page elevation. */}
      <div style={{
        background: theme.cream,
        padding: "8px 22px 20px",
        borderBottom: `1px solid ${theme.ruleSoft}`,
        boxShadow: shadow.card,
      }}>

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
            // Pull the actual heads-up text per ingredient so the
            // body of the tag is the warning itself, not a generic
            // "common reasons" pamphlet. Each entry: ingredient
            // name (terra) + its specific note. Falls back to the
            // raw id if a meta record is missing — shouldn't happen
            // since `flagged` already gated on INGREDIENTS[id].
            const flaggedItems = (b.ingredients || [])
              .map(ing => ({ meta: INGREDIENTS[ing.id], id: ing.id }))
              .filter(({ meta }) => meta?.headsUp)
              .map(({ meta, id }) => ({
                name: meta.name || id,
                note: meta.headsUp,
              }));
            const summaryLead = flaggedItems.length === 1
              ? "One ingredient in this blend has interactions worth knowing about."
              : "Some ingredients in this blend have interactions worth knowing about.";
            tags.push({
              label: "heads-up",
              summary: summaryLead,
              body: (
                <div>
                  {flaggedItems.map((item, idx) => (
                    <div key={item.name} style={{
                      marginTop: idx === 0 ? 0 : 8,
                    }}>
                      <span style={{ color: theme.terra, fontWeight: 600 }}>
                        {item.name}
                      </span>
                      {" — "}{item.note}
                    </div>
                  ))}
                </div>
              ),
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
              body={EFFECT_DESCRIPTIONS[openMood].body}
              tone="sage"
              onClose={() => setOpenMood(null)}
            />
          </div>
        )}

        {/* Cultural beat — the ritual / lived practice behind the
            cup. Surfaces for curated traditions (each has its own
            culturalNote); experimentals stay quiet. Sits above the
            ingredient list so the user reads the why before the
            what — the cup's context, then its recipe. */}
        {b.culturalNote && (
          <div style={{
            marginTop: 18, marginBottom: 18,
            padding: "12px 14px",
            borderLeft: `2px solid ${theme.ochre}`,
            background: "rgba(193, 148, 80, 0.06)",
            borderRadius: "0 6px 6px 0",
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
            color: theme.inkSoft, lineHeight: 1.55,
          }}>
            {b.culturalNote}
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
                  const effectiveG = isRemix && curatedOverrides[ing.id] != null
                    ? curatedOverrides[ing.id] : ing.g;
                  return (
                    <div key={ing.id} style={{
                      borderTop: i === 0 ? "none" : `1px solid ${theme.ruleSoft}`,
                      padding: "10px 0",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 12,
                    }}>
                      <button onClick={() => onOpenIngredient(ing.id)} style={{
                        flex: 1, minWidth: 0, textAlign: "left",
                        background: "transparent", border: "none", padding: 0, cursor: "pointer",
                      }}>
                        <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.ink }}>
                          {meta.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                        </div>
                        <div style={{
                          fontFamily: ff.sans, fontSize: 10.5, color: theme.ash,
                          marginTop: 2, letterSpacing: "0.02em",
                        }}>
                          {metaParts.join(" · ")}
                        </div>
                      </button>
                      {isRemix ? (
                        <GramsInput
                          value={effectiveG}
                          onChange={(g) => updateCuratedGrams(ing.id, g)}
                          unit={weightUnit}
                        />
                      ) : (
                        <div style={{ fontFamily: ff.mono, fontSize: 11, color: theme.inkSoft, flexShrink: 0, marginLeft: 12 }}>
                          {formatAmount(ing.g, meta.category, weightUnit)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Your twists — user-added ingredients with editable
                    grams. Name renders in sage to signal these are
                    your additions, not part of the curated base. Same
                    meta line as the curated rows so the engineering
                    info (temp / steep / flavor / effect) stays
                    visible at a glance. */}
                {twists.map((t, i) => {
                  const meta = INGREDIENTS[t.id];
                  if (!meta) return null;
                  const formatSteepRange = ([sMin, sMax]) => {
                    if (sMax < 60) return `${sMin}–${sMax}s`;
                    if (sMin < 60) return `${sMin}s–${Math.round(sMax / 60)} min`;
                    const lo = sMin / 60, hi = sMax / 60;
                    return `${Number.isInteger(lo) ? lo : lo.toFixed(1)}–${Number.isInteger(hi) ? hi : hi.toFixed(1)} min`;
                  };
                  const steepRange = meta.timeS ? formatSteepRange(meta.timeS) : null;
                  const topFlavors = (meta.flavors || []).slice(0, 2).join(", ");
                  const topEffect = (meta.effects || []).filter(([tag]) => tag !== "bitterness")[0];
                  const metaParts = [
                    formatTempRange(meta.tempC[0], meta.tempC[1], unit),
                    steepRange,
                    topFlavors,
                    topEffect ? topEffect[0] : null,
                  ].filter(Boolean);
                  return (
                    <div key={t.id} style={{
                      borderTop: i === 0 ? `1px dashed ${theme.ruleSoft}` : `1px solid ${theme.ruleSoft}`,
                      padding: "10px 0",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 12,
                    }}>
                      <button onClick={() => onOpenIngredient(t.id)} style={{
                        flex: 1, minWidth: 0, textAlign: "left",
                        background: "transparent", border: "none", padding: 0, cursor: "pointer",
                      }}>
                        <div style={{ fontFamily: ff.serif, fontSize: 15, color: theme.sageDeep }}>
                          {meta.name} <span style={{ color: theme.rose, fontSize: 11 }}>↗</span>
                        </div>
                        <div style={{
                          fontFamily: ff.sans, fontSize: 10.5, color: theme.ash,
                          marginTop: 2, letterSpacing: "0.02em",
                        }}>
                          {metaParts.join(" · ")}
                        </div>
                      </button>
                      <GramsInput
                        value={t.g}
                        onChange={(g) => updateTwistGrams(t.id, g)}
                        unit={weightUnit}
                      />
                      <button
                        onClick={() => removeTwist(t.id)}
                        title="remove twist"
                        style={{
                          background: "transparent", border: "none",
                          color: theme.ash, fontSize: 16, lineHeight: 1,
                          cursor: "pointer", padding: "2px 4px",
                        }}
                      >×</button>
                    </div>
                  );
                })}

                {/* Add a twist — text-link affordance kept low-key so
                    the curated framing stays primary. */}
                <button
                  onClick={() => setPickerOpen(true)}
                  style={{
                    width: "100%", textAlign: "center",
                    background: "transparent",
                    border: "none",
                    borderTop: `1px dashed ${theme.ruleSoft}`,
                    padding: "10px 0 4px",
                    fontFamily: ff.sans, fontSize: 10.5,
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    color: theme.sageDeep, cursor: "pointer",
                  }}
                >
                  + Add your own twist
                </button>
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

        {/* Recommended Preparations — tradition-specific steps when
            curated, generic template otherwise. Sits directly below
            the ingredient list (under "The recipe") so the user
            reads the how-to-make-this before the interactive
            brewing-science explorer — which order matches how
            people actually use the page: scan ingredients, scan
            steps, then dig into the chemistry if curious. */}
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
          // Append a rest-time hint after any sub-boil temperature so a
          // user without a thermometer or temperature-control kettle
          // knows how to actually reach the target. Skipped when the
          // step already supplies a rest qualifier ("let a boiled
          // kettle rest", "off boil", "equal parts", etc.).
          const augmentSubBoilSteps = (raw) => raw.map(step => {
            const match = step.match(/(\d+)\s*°([CF])/);
            if (!match) return step;
            const value = parseInt(match[1], 10);
            const celsius = match[2] === "C" ? value : Math.round((value - 32) * 5 / 9);
            const hint = restHintForCelsius(celsius);
            if (!hint) return step;
            if (/(rest|off boil|let .* (cool|sit|rest)|equal parts|just below)/i.test(step)) return step;
            return step.replace(/(\d+\s*°[CF])/, `$1 (${hint})`);
          });
          const steps = augmentSubBoilSteps(localizeSteps(tradSteps || fallbackSteps));
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
                  <SectionLabel n="ii">Recommended Preparations</SectionLabel>
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

        {/* Brewing — collapsible header + interactive explorer.
            Default open; collapsing hides the slider explorer and
            volume tag so the user can read just the recipe and
            preparations. The Brew CTA stays outside the collapse
            so the action is always one tap away. */}
        {/* aria-expanded because this is a disclosure, and it had no
            way of saying so. A role="button" that folds a section owes
            assistive tech its state — and the E2E helper was inferring
            that state from whether the panel inside had rendered yet,
            which races the lazy chunk: read too early, it decides the
            section is shut and clicks it CLOSED. That is the flake the
            helper's own comment warns about, and it can't be fixed in
            the spec, because the information wasn't in the markup. */}
        <div
          role="button"
          tabIndex={0}
          data-testid="brewing-section"
          aria-expanded={brewingOpen}
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
          <SectionLabel n="iii">Brewing</SectionLabel>
        </div>
        {brewingOpen && (
          <>
            <BrewSurface
              load={{
                ingredients: mergedIngredients,
                name: b.name,
                tempC: b.tempC,
                timeS: b.timeS,
                kind: "recipe",
              }}
              tempC={brewTempC}
              setTempC={setBrewTempC}
              timeS={brewTimeS}
              setTimeS={setBrewTimeS}
              isTraditional={!!b.tradition && twists.length === 0}
              isHouse={!!b.house && twists.length === 0}
              onBrew={handleBrewTap}
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

        {/* ONE BREW ON THIS PAGE.
            The panel above carries the corner Brew every brew window
            has, so while it's open this full-width CTA was a second
            button doing the same job — and doing it differently, with
            no confirmation where the corner asks first. One page, two
            brews, two behaviours.

            Not deleted outright: the Brewing section folds, taking the
            panel and its corner with it, and a folded recipe page still
            has to be brewable. So this stands in exactly when the panel
            isn't there.

            Hiding it took ~20 specs down on the first attempt, because
            eleven call sites across four files each knew how to brew by
            clicking it. That knowledge now lives in
            e2e/helpers/brew.ts. */}
        {!brewingOpen && (
        <Button
          variant="primary" fullWidth
          onClick={handleBrewTap}
          icon={<Kettle size={20} c={theme.cream} />}
          style={{ marginTop: 18, fontSize: 17, padding: "15px 16px", gap: 10 }}
        >
          {twists.length > 0 ? "Brew your twist →" : "Brew this cup →"}
        </Button>
        )}

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

      {/* Ingredient picker overlay — shown when the user taps
          "+ Add your own twist". Groups available ingredients by
          category and excludes anything already in the recipe. */}
      {pickerOpen && (
        <TwistPicker
          onClose={() => setPickerOpen(false)}
          onPick={addTwist}
          excludeIds={new Set([
            ...((b.ingredients || []).map(i => i.id)),
            ...twists.map(t => t.id),
          ])}
        />
      )}

      {/* Save modal — fires when the user taps Brew with at least one
          twist. They can save the modified blend as a personal copy
          before brewing, or brew an ephemeral copy without saving. */}
      {saveModalOpen && (
        <SaveTwistModal
          name={twistName}
          setName={setTwistName}
          baseName={b.name}
          twists={twists}
          curatedOverrides={curatedOverrides}
          baseIngredients={b.ingredients || []}
          weightUnit={weightUnit}
          onCancel={() => setSaveModalOpen(false)}
          onSaveAndBrew={() => {
            setSaveModalOpen(false);
            onSaveAndBrew(buildModifiedBlend(), twistName);
          }}
          onBrewWithoutSaving={() => {
            setSaveModalOpen(false);
            onBrew(buildModifiedBlend());
          }}
        />
      )}
    </div>

      {/* The brew controls land here. Chrome only while the Brewing
          section is expanded — collapsed, the explorer isn't mounted and
          the slot has to measure 0px, or every recipe pays for a rule
          line and a strip of ivory it never fills. */}
      <div
        ref={dockRef}
        id={BLEND_DETAIL_DOCK_ID}
        style={brewingOpen ? {
          // OVERLAYS the page rather than sitting beside it. As a flex
          // sibling nothing passed behind this, so its glass had
          // nothing to show and it read as a solid block — the app
          // shell's dock looks like glass because the page scrolls
          // under it. Absolute here, with the scroll area padded by the
          // measured height so nothing is permanently hidden.
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: "rgba(var(--ivory-rgb),0.58)",
          backdropFilter: "blur(9px) saturate(1.1)",
          WebkitBackdropFilter: "blur(9px) saturate(1.1)",
          borderTop: `1px solid ${theme.rule}`,
        } : { flexShrink: 0 }}
      />
    </div>
    </BrewDockProvider>
  );
};

/* ──────────────────────────────────────────────────────────────
   GramsInput — small bordered number input shown in remix mode.
   Visible form-field affordance so the user can see the quantity
   is editable without having to click to discover it. Steps in
   0.1g increments; bare-minimum sanity floor of 0.
   ────────────────────────────────────────────────────────────── */

const GramsInput = ({ value, onChange, unit }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 4,
    flexShrink: 0,
  }}>
    <input
      type="number"
      step="0.1"
      min="0"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={{
        width: 52, fontFamily: ff.mono, fontSize: 12,
        padding: "4px 6px", textAlign: "right",
        border: `1px solid ${theme.rule}`,
        borderRadius: 4,
        background: theme.ivory, color: theme.ink,
      }}
    />
    <span style={{
      fontFamily: ff.mono, fontSize: 10, color: theme.ash,
    }}>
      {unit === "oz" ? "oz" : "g"}
    </span>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   TwistPicker — overlay that lists every ingredient grouped by
   category. Tap to add the ingredient at a default dose to the
   user's twist list. Existing recipe + already-added twists are
   excluded so the same ingredient can't double-up.
   ────────────────────────────────────────────────────────────── */

const TwistPicker = ({ onClose, onPick, excludeIds }) => {
  // INGREDIENTS is keyed by id but the objects themselves don't carry
  // an `id` field — pick it up from the entry key.
  const available = Object.entries(INGREDIENTS)
    .filter(([id]) => !excludeIds.has(id))
    .map(([id, meta]) => ({ ...meta, id }));
  const byCategory = available.reduce((acc, meta) => {
    const cat = meta.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(meta);
    return acc;
  }, {});
  const categoryOrder = [
    "true tea", "black", "green", "oolong", "white", "pu-erh",
    "herbal", "leaf", "flower", "spice", "peel", "fruit",
    "root", "rhizome", "adaptogen", "fungus", "other",
  ];
  const sortedCats = Object.keys(byCategory).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(30, 25, 20, 0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          maxHeight: "78vh", overflowY: "auto",
          background: theme.ivory,
          borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
          boxShadow: shadow.card,
          padding: "18px 18px 24px",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14,
        }}>
          <div style={{
            fontFamily: ff.serif, fontSize: 18, color: theme.ink,
          }}>
            Add your own twist
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: theme.ash,
            fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 4,
          }}>×</button>
        </div>
        {sortedCats.map(cat => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
              textTransform: "uppercase", color: theme.ash,
              marginBottom: 6,
            }}>
              {cat.replace("-", " ")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {byCategory[cat].map(meta => (
                <button
                  key={meta.id}
                  onClick={() => onPick(meta.id)}
                  style={{
                    fontFamily: ff.serif, fontSize: 13, color: theme.ink,
                    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
                    borderRadius: radius.sm, padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {meta.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   SaveTwistModal — confirms whether the user wants to keep their
   twist as a personal blend before brewing. Save & brew runs
   saveComposedBlend then starts the steep on the new id; brew-
   without-saving steeps an ephemeral copy and discards on close.
   ────────────────────────────────────────────────────────────── */

const SaveTwistModal = ({ name, setName, baseName, twists = [], curatedOverrides = {}, baseIngredients = [], weightUnit, onCancel, onSaveAndBrew, onBrewWithoutSaving }) => {
  // Build a one-glance recap so the user sees exactly what they're
  // saving without having to mentally reconstruct it. Curated rows
  // whose grams were tweaked render as "1.4g Chamomile (was 1g)";
  // user additions render as "+ 0.5g Rose Petal".
  const fmt = (g) => weightUnit === "oz"
    ? `${(g * 0.0353).toFixed(2)}oz`
    : `${g}g`;
  const overrideRows = baseIngredients
    .filter(ing => curatedOverrides[ing.id] != null && curatedOverrides[ing.id] !== ing.g)
    .map(ing => {
      const meta = INGREDIENTS[ing.id];
      if (!meta) return null;
      return `${fmt(curatedOverrides[ing.id])} ${meta.name} (was ${fmt(ing.g)})`;
    })
    .filter(Boolean);
  const twistRows = twists
    .map(t => {
      const meta = INGREDIENTS[t.id];
      if (!meta) return null;
      return `+ ${fmt(t.g)} ${meta.name}`;
    })
    .filter(Boolean);
  const recapRows = [...overrideRows, ...twistRows];

  return (
  <div
    onClick={onCancel}
    style={{
      position: "fixed", inset: 0, zIndex: 55,
      background: "rgba(30, 25, 20, 0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 380,
        background: theme.ivory,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        padding: "22px 22px 18px",
      }}
    >
      <div style={{
        fontFamily: ff.serif, fontSize: 18, color: theme.ink,
        marginBottom: 6,
      }}>
        Save this twist?
      </div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13,
        color: theme.ash, lineHeight: 1.5, marginBottom: 14,
      }}>
        Keep it on your shelf so you can brew it again, or skip and steep this cup once.
      </div>
      {recapRows.length > 0 && (
        <div style={{
          background: theme.cream,
          border: `1px solid ${theme.ruleSoft}`,
          borderRadius: radius.sm,
          padding: "10px 12px",
          marginBottom: 14,
          fontFamily: ff.serif, fontSize: 12.5, color: theme.inkSoft,
          lineHeight: 1.55,
        }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            {baseName}
          </div>
          {recapRows.map((row, i) => (
            <div key={i} style={{ fontStyle: "italic" }}>{row}</div>
          ))}
        </div>
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name your twist"
        style={{
          width: "100%", boxSizing: "border-box",
          fontFamily: ff.serif, fontSize: 14, color: theme.ink,
          background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
          borderRadius: radius.sm, padding: "10px 12px",
          marginBottom: 14,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button variant="primary" fullWidth onClick={onSaveAndBrew}>
          Save & brew
        </Button>
        <Button variant="secondary" fullWidth onClick={onBrewWithoutSaving}>
          Brew without saving
        </Button>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none",
          fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase", color: theme.ash,
          padding: "6px 0", cursor: "pointer",
        }}>cancel</button>
      </div>
    </div>
  </div>
  );
};
