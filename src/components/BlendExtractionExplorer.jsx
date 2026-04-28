/* ──────────────────────────────────────────────────────────────
   components/BlendExtractionExplorer.jsx — interactive blend-level
   temp/time explorer for BlendDetail and Compose summary.

   This is where the blending algorithm becomes visible to the user.
   For a blend of multiple ingredients, the sliders expose:
   - What happens to effects as you change brew conditions
   - Which ingredients "agree" vs "stretch" at each temperature
   - That brewing involves real trade-offs, not magic single recipes

   Architecture:
   - Temp slider spans the UNION of constituent ingredients' tempC
     ranges (most honest; shows what's possible, even if compromised)
   - Time slider spans the union of timeS ranges similarly
   - Per-ingredient "in-range" dot indicator shows which ingredients
     are being brewed inside their preferred zone at current setting
   - Effect bars recompute live via resolveBlendAtBrew()

   This component is intentionally shared between BlendDetail and
   Compose. The props tell it what to render; the behavior is the
   same in both contexts.

   Shared with single-ingredient ExtractionExplorer: the slider
   styling. Different: the data path (blend-level vs ingredient-level)
   and the per-ingredient range indicator.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useMemo, useEffect } from "react";
import { theme, ff } from "../theme";
import { useUnit, cToF } from "../units/units";
import { resolveBlendAtBrew, computeBrewProfile, TRADITION_TIME_TOLERANCE_S } from "../algo/compose";
import { unionAndPadTempRange, unionAndPadTimeRange } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import { EXTRACTION_PROFILES } from "../data/extractionProfiles";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { EffectBar } from "./EffectBar";
import { VocabInfoCard } from "./layout";

// Slider bounds — union of every ingredient's range, padded with
// experimentation room. Single source of truth in algo/brewBounds.

/**
 * Blend-level temp/time explorer with live effect recomputation.
 *
 * Supports two modes:
 *   - Uncontrolled (default, used by BlendDetail): manages its own
 *     tempC/timeS state internally.
 *   - Controlled (used by ComposeScreen): parent passes tempC/setTempC
 *     and timeS/setTimeS, so the parent can read live values for
 *     reactive warnings above the explorer.
 *
 * Ingredient prop is reactive — if it changes (e.g. user picks a
 * different suggestion), the slider ranges recompute via useMemo,
 * and a safety useEffect clamps any current values into the new range.
 */
export const BlendExtractionExplorer = ({
  ingredients,              // [{id, g}, ...]
  hideTraditionNote = false,  // suppress the inline note (caller renders elsewhere)
  onTraditionNoteChange,    // optional callback fired with the note payload
  defaultTempC,             // from computeBrewProfile (algorithm's recommendation)
  defaultTimeS,             // from computeBrewProfile
  tempC: tempCProp,         // optional controlled
  setTempC: setTempCProp,   // optional controlled
  timeS: timeSProp,         // optional controlled
  setTimeS: setTimeSProp,   // optional controlled
  compact = false,          // smaller layout for Compose context
  curated = false,          // curator-chosen recipe — suppresses outsider
                            // warnings when sitting on the curator's defaults
  experimental = false,     // user-built blend — every warning fires
                            // immediately, no baseline-at-rest suppression.
                            // The user is exploring; spell out what's wrong.
  isTraditional = false,    // genuine cultural tradition (chai, sencha…).
                            // Required for the tradition-over-literature
                            // notice to fire; experimentals and synths
                            // shouldn't claim that lineage.
}) => {
  const { unit } = useUnit();

  const tempCRange = useMemo(() => unionAndPadTempRange(ingredients, INGREDIENTS), [ingredients]);
  const timeSRange = useMemo(() => unionAndPadTimeRange(ingredients, INGREDIENTS), [ingredients]);

  // Master union of every flavor and effect that any constituent
  // ingredient can ever produce — pulls from EXTRACTION_PROFILES first,
  // and falls back to INGREDIENTS[id].flavors / .effects for ingredients
  // without authored profile points. Used to render the full set in the
  // predicted-taste / predicted-mood strips, dimmed when the slider
  // pushes a given entry's strength to zero.
  const possible = useMemo(() => {
    const fSet = new Set(), eSet = new Set();
    const addEffect = (tag) => {
      // bitterness lives in the predicted-balance strip, not moods.
      if (tag === "bitterness") return;
      eSet.add(tag);
    };
    (ingredients || []).forEach(({ id }) => {
      const profilePoints = EXTRACTION_PROFILES[id];
      if (profilePoints && profilePoints.length > 0) {
        profilePoints.forEach(p => {
          (p.flavors || []).forEach(f => fSet.add(f));
          (p.effects || []).forEach(([tag]) => addEffect(tag));
        });
      } else {
        const meta = INGREDIENTS[id];
        if (meta) {
          (meta.flavors || []).forEach(f => fSet.add(f));
          (meta.effects || []).forEach(([tag]) => addEffect(tag));
        }
      }
    });
    return { flavors: [...fSet], effects: [...eSet] };
  }, [ingredients]);

  // Internal state — only used when parent hasn't supplied controlled values.
  const [tempCInternal, setTempCInternal] = useState(() =>
    defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2)
  );
  const [timeSInternal, setTimeSInternal] = useState(() =>
    defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2)
  );
  const [openFlavor, setOpenFlavor] = useState(null);
  const [openEffect, setOpenEffect] = useState(null);
  // Predicted-taste pill row caps at 6; the rest hide behind an
  // expand toggle so a long flavor list doesn't dominate the screen.
  const [flavorsExpanded, setFlavorsExpanded] = useState(false);

  const isControlled = tempCProp !== undefined && setTempCProp !== undefined;
  const tempC = isControlled ? tempCProp : tempCInternal;
  const setTempC = isControlled ? setTempCProp : setTempCInternal;
  const timeS = (timeSProp !== undefined && setTimeSProp) ? timeSProp : timeSInternal;
  const setTimeS = (timeSProp !== undefined && setTimeSProp) ? setTimeSProp : setTimeSInternal;

  // Safety: if ingredients change and the slider values are now out of
  // range, clamp them. Only applies in uncontrolled mode — parent-controlled
  // mode is responsible for its own reset logic.
  useEffect(() => {
    if (isControlled) return;
    if (tempC < tempCRange[0] || tempC > tempCRange[1]) {
      setTempC(defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2));
    }
    if (timeS < timeSRange[0] || timeS > timeSRange[1]) {
      setTimeS(defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempCRange, timeSRange]);

  // Live blend computation at current slider values. The default tempC/timeS
  // act as the baseline — per-ingredient over-pull warnings only fire when
  // the user has pushed past them. For curated blends, outsider warnings
  // are also silenced when the user sits exactly on the baseline.
  // Experimental (user-built) blends skip baseline entirely so every
  // warning fires immediately.
  const brew = experimental
    ? resolveBlendAtBrew(ingredients, tempC, timeS)
    : resolveBlendAtBrew(ingredients, tempC, timeS, defaultTempC, defaultTimeS, curated, isTraditional);

  // Algorithm-derived "research-aligned" brew — the temperature-range
  // intersection (or grams-weighted compromise) plus weighted time.
  // Restricts to lead-role ingredients so accents and catalysts (which
  // the curator deliberately stretched) don't drag the recommendation
  // toward a Western-steep compromise that nobody actually drinks.
  const sciBrew = useMemo(
    () => computeBrewProfile(ingredients, { leadOnly: true }),
    [ingredients],
  );
  // Show the recommendation only when it points somewhere meaningfully
  // different — temp delta or > 90s time delta. A 30-second steep
  // adjustment isn't a "research-aligned alternative" worth surfacing.
  const sciDiffers = sciBrew.tempC !== defaultTempC
    || Math.abs(sciBrew.timeS - defaultTimeS) > TRADITION_TIME_TOLERANCE_S;
  const sciTempDisplay = unit === "F" ? `${cToF(sciBrew.tempC)}°F` : `${sciBrew.tempC}°C`;
  const sciTimeDisplay = `${Math.floor(sciBrew.timeS / 60)}:${String(sciBrew.timeS % 60).padStart(2, "0")}`;

  // Display formatting
  const displayTemp = unit === "F" ? `${cToF(tempC)}°F` : `${tempC}°C`;
  const displayTime = `${Math.floor(timeS / 60)}:${String(timeS % 60).padStart(2, "0")}`;
  const tempMinDisplay = unit === "F" ? cToF(tempCRange[0]) : tempCRange[0];
  const tempMaxDisplay = unit === "F" ? cToF(tempCRange[1]) : tempCRange[1];

  const compatible = brew.outsiders.length === 0;

  // When a parent caller wants to render the tradition note in
  // its own slot (BlendDetail places it above the preparations
  // dropdown), notify it whenever the note's payload changes.
  // The render here is also suppressed via hideTraditionNote.
  useEffect(() => {
    if (!onTraditionNoteChange) return;
    if (brew.traditionNote) {
      onTraditionNoteChange({
        sciDiffers,
        sciTempDisplay,
        sciTimeDisplay,
      });
    } else {
      onTraditionNoteChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brew.traditionNote, sciDiffers, sciTempDisplay, sciTimeDisplay]);

  return (
    <div style={{
      padding: compact ? "14px 14px 16px" : "16px 16px 18px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
    }}>
      {/* Per-ingredient range indicators */}
      {brew.perIngredient && brew.perIngredient.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          }}>
            {brew.perIngredient.map(({ id, name, inRange }) => (
              <div key={id} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 9px", borderRadius: 999,
                background: inRange ? "rgba(109,126,85,0.10)" : "rgba(176,84,47,0.08)",
                border: `1px solid ${inRange ? theme.sage : theme.terra}`,
                opacity: inRange ? 1 : 0.75,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: inRange ? theme.sage : theme.terra,
                }} />
                <span style={{
                  fontFamily: ff.sans, fontSize: 10.5,
                  color: inRange ? theme.sageDeep : theme.terra,
                }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
          {!compatible && (() => {
            const items = brew.outsiders.map(o =>
              typeof o === "object" && o
                ? { name: o.name, reason: o.reason }
                : { name: o, reason: "temp" }
            );
            // Highlight the out-of-range axis words in terracotta so a
            // quick glance picks up "temperature" / "steep time" without
            // reading the whole sentence.
            const Hi = ({ children }) => (
              <span style={{
                color: theme.terra, fontStyle: "normal", fontWeight: 500,
              }}>{children}</span>
            );
            const phraseFor = (reason) => {
              if (reason === "both") return (
                <>is outside its preferred <Hi>temperature</Hi> and <Hi>steep time</Hi></>
              );
              if (reason === "time") return (
                <>is <Hi>steeped past its preferred range</Hi></>
              );
              return (
                <>is outside its preferred <Hi>temperature</Hi></>
              );
            };
            const renderOne = (it, i) => (
              <React.Fragment key={i}>
                {it.name} {phraseFor(it.reason)}
              </React.Fragment>
            );
            return (
              <div style={{
                marginTop: 6,
                fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                color: theme.ash, lineHeight: 1.4,
              }}>
                {items.length === 1 ? (
                  <>{renderOne(items[0], 0)} — will extract unevenly.</>
                ) : (
                  <>
                    {items.map((it, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && "; "}{renderOne(it, i)}
                      </React.Fragment>
                    ))}
                    .
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tradition-over-literature notice — appears on curated blends
          that brew outside what the studies prescribe. The curator
          chose this point on purpose; the note acknowledges that the
          warning system has been silenced here, and explains why.
          Suppressed when the caller has lifted rendering out (e.g.
          BlendDetail places it above the preparations dropdown). */}
      {!hideTraditionNote && brew.traditionNote && (
        <div style={{
          marginBottom: 12, padding: "8px 10px", borderRadius: 6,
          background: "rgba(165, 120, 54, 0.08)",
          border: `1px solid rgba(165, 120, 54, 0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.inkSoft, lineHeight: 1.45,
        }}>
          <em style={{
            color: theme.ochre, fontStyle: "normal",
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
            textTransform: "uppercase", marginRight: 6,
          }}>tradition over literature</em>
          This brew sits outside the ranges current research recommends.
          The science matters; the centuries of practice that found this
          cup matter too — and sometimes practice knows what science
          hasn't measured yet.
          {sciDiffers && (
            <div style={{ marginTop: 6, color: theme.ash }}>
              If you'd like the research-aligned version, try{" "}
              <em style={{ fontStyle: "normal", color: theme.inkSoft }}>
                {sciTempDisplay} · {sciTimeDisplay}
              </em>.
            </div>
          )}
        </div>
      )}

      {/* Temp + time sliders. Sit ABOVE the predicted-profile bars
          so they stay in a fixed position even as bars/pills below
          populate during a slider drag. Putting them under the
          predicted profile meant the bars could expand mid-drag and
          shove the sliders downward under the user's finger. */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 6,
        }}>
          <label style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
            textTransform: "uppercase", color: theme.inkSoft,
          }}>
            Water
          </label>
          <div style={{ fontFamily: ff.mono, fontSize: 13, color: theme.ink }}>
            {displayTemp}
          </div>
        </div>
        <input
          type="range"
          min={tempCRange[0]}
          max={tempCRange[1]}
          step={1}
          value={tempC}
          onChange={(e) => setTempC(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: theme.terra,
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
        }}>
          <span>{tempMinDisplay}°</span>
          <span>{tempMaxDisplay}°</span>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 6,
        }}>
          <label style={{
            fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
            textTransform: "uppercase", color: theme.inkSoft,
          }}>
            Steep
          </label>
          <div style={{ fontFamily: ff.mono, fontSize: 13, color: theme.ink }}>
            {displayTime}
          </div>
        </div>
        <input
          type="range"
          min={timeSRange[0]}
          max={timeSRange[1]}
          step={15}
          value={timeS}
          onChange={(e) => setTimeS(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: theme.sage,
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
        }}>
          <span>{Math.round(timeSRange[0] / 60)} min</span>
          <span>{Math.round(timeSRange[1] / 60)} min</span>
        </div>
      </div>

      {/* Predicted profile — taste (flavor pills) on top, mood (effect
          bars) below. Each section renders the FULL set of entries any
          constituent ingredient can produce; entries the slider has
          pushed to zero stay in the list but render dim, so the user
          can see what's *possible* and watch each pill or bar fill in
          as the brew conditions move into its territory. Balance keeps
          its zero-strength filter — those metrics (bitterness, tartness)
          are diagnostic, not constants of the blend's identity. */}
      {(() => {
        const flavorMap = {};
        (brew.flavors || []).forEach(([n, s]) => { flavorMap[n] = s || 0; });
        const effectMap = {};
        (brew.effects || []).forEach(([t, n]) => {
          if (t === "bitterness") return;
          effectMap[t] = n || 0;
        });

        // Defensive union: any tag the algo currently emits but our
        // static-profile scan missed (e.g. a synergy-derived effect)
        // joins the master set so it isn't dropped from view.
        const fNames = new Set([...possible.flavors, ...Object.keys(flavorMap)]);
        const eTags  = new Set([...possible.effects, ...Object.keys(effectMap)]);
        const flavorEntries = [...fNames].map(name => [name, flavorMap[name] || 0]);
        const effectEntries = [...eTags].map(tag => [tag, effectMap[tag] || 0]);

        // Sort each: active first (by strength desc), inactive after (alphabetical).
        const sortMixed = (entries) => entries.sort(([a, an], [b, bn]) => {
          const aActive = Math.round(an * 10) / 10 > 0;
          const bActive = Math.round(bn * 10) / 10 > 0;
          if (aActive !== bActive) return aActive ? -1 : 1;
          if (aActive) return bn - an;
          return a.localeCompare(b);
        });
        sortMixed(flavorEntries);
        sortMixed(effectEntries);

        const visibleFlavors = flavorEntries;
        const visibleEffects = effectEntries;
        const visibleBalance = (brew.balance || []).filter(([, n]) =>
          Math.round((n || 0) * 10) / 10 > 0
        );
        if (visibleEffects.length === 0 && visibleBalance.length === 0 && visibleFlavors.length === 0) return null;

        const sectionLabel = (text) => (
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>{text}</div>
        );

        return (
          <div style={{ marginBottom: 14 }}>
            {visibleFlavors.length > 0 && (() => {
              // Always show the top 6 (sorted active-first by strength,
              // then alphabetical inactives). The remainder lives behind
              // an expand toggle. Sort runs every render so the top 6
              // stays live-correct as the brew sliders move.
              const FLAVOR_HEAD = 6;
              const headFlavors = visibleFlavors.slice(0, FLAVOR_HEAD);
              const tailFlavors = visibleFlavors.slice(FLAVOR_HEAD);
              const shownFlavors = flavorsExpanded ? visibleFlavors : headFlavors;
              return (
                <div style={{ marginBottom: visibleEffects.length > 0 ? 14 : 0 }}>
                  {sectionLabel("predicted taste")}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {shownFlavors.map(([name, strength]) => {
                      const known = !!FLAVOR_DESCRIPTIONS[name];
                      const opened = openFlavor === name;
                      const isActive = Math.round(strength * 10) / 10 > 0;
                      const intensity = Math.max(0.35, Math.min(1, strength / 5));
                      return (
                        <button
                          key={name}
                          onClick={() => known && setOpenFlavor(prev => prev === name ? null : name)}
                          disabled={!known}
                          style={{
                            fontFamily: ff.sans, fontSize: 10.5,
                            color: opened ? theme.cream
                                  : isActive ? theme.terra
                                  : theme.ash,
                            letterSpacing: "0.04em",
                            padding: "3px 9px",
                            border: `1px solid ${opened || isActive ? theme.terra : theme.rule}`,
                            borderRadius: 999,
                            background: opened ? theme.terra : "transparent",
                            opacity: opened ? 1 : isActive ? intensity : 0.45,
                            fontStyle: isActive ? "normal" : "italic",
                            cursor: known ? "pointer" : "default",
                            transition: "all 0.15s ease",
                          }}
                        >{name}</button>
                      );
                    })}
                    {tailFlavors.length > 0 && (
                      <button
                        onClick={() => setFlavorsExpanded(v => !v)}
                        style={{
                          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                          color: theme.ash,
                          padding: "3px 9px",
                          border: `1px dashed ${theme.rule}`,
                          borderRadius: 999,
                          background: "transparent",
                          cursor: "pointer",
                          fontStyle: "italic",
                        }}
                      >
                        {flavorsExpanded ? "show fewer" : `+${tailFlavors.length} more`}
                      </button>
                    )}
                  </div>
                  {openFlavor && FLAVOR_DESCRIPTIONS[openFlavor] && (
                    <div style={{ marginTop: 10 }}>
                      <VocabInfoCard
                        term={openFlavor}
                        summary={FLAVOR_DESCRIPTIONS[openFlavor].summary}
                        tone="terra"
                        onClose={() => setOpenFlavor(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            {visibleEffects.length > 0 && (() => {
              let activeIdx = 0;
              const colored = visibleEffects.map(([tag, n]) => {
                const isActive = Math.round(n * 10) / 10 > 0;
                let color;
                if (!isActive)              color = theme.ash;
                else if (activeIdx === 0) { color = theme.sage;  activeIdx++; }
                else if (activeIdx === 1) { color = theme.ochre; activeIdx++; }
                else                      { color = theme.sky;   activeIdx++; }
                return { tag, n, isActive, color };
              });
              return (
              <div style={{ marginBottom: visibleBalance.length > 0 ? 14 : 0 }}>
                {sectionLabel("predicted mood")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {colored.map(({ tag, n, isActive, color }) => {
                    const known = !!EFFECT_DESCRIPTIONS[tag];
                    const opened = openEffect === tag;
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
                          padding: "2px 4px", borderRadius: 4,
                          background: opened ? "rgba(98, 124, 92, 0.10)" : "transparent",
                          cursor: known ? "pointer" : "default",
                          outline: "none",
                        }}
                      >
                        <EffectBar label={tag} value={n} color={color} dim={!isActive} />
                      </div>
                    );
                  })}
                </div>
                {openEffect && EFFECT_DESCRIPTIONS[openEffect] && (
                  <div style={{ marginTop: 10 }}>
                    <VocabInfoCard
                      term={openEffect}
                      summary={EFFECT_DESCRIPTIONS[openEffect].summary}
                      tone="sage"
                      onClose={() => setOpenEffect(null)}
                    />
                  </div>
                )}
              </div>
              );
            })()}
            {visibleBalance.length > 0 && (
              <div>
                {sectionLabel("predicted palate")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {visibleBalance.map(([tag, n]) => {
                    const known = !!EFFECT_DESCRIPTIONS[tag];
                    const active = openEffect === tag;
                    const color =
                      tag === "bitterness" ? theme.terra
                      : tag === "sweetness" ? theme.ochre
                      : tag === "astringency" ? theme.terra
                      : tag === "tartness" ? theme.ochre
                      : theme.sky;
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
                          padding: "2px 4px", borderRadius: 4,
                          background: active ? "rgba(98, 124, 92, 0.10)" : "transparent",
                          cursor: known ? "pointer" : "default",
                          outline: "none",
                        }}
                      >
                        <EffectBar label={tag} value={n} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Warnings — masking, ceiling, paradox, tannin, aromatic.
          Sit between the slider levers and the profile bars so the user
          can adjust steep/temp and immediately see whether the cup is
          pulling tannins or hitting another ceiling. Outsiders are
          shown inline above with the per-ingredient pills; filter here
          to avoid duplication. */}
      {(() => {
        const filtered = (brew.warnings || []).filter(w => w.kind !== "outsider");
        if (filtered.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, marginBottom: 14 }}>
            {filtered.map((w, i) => {
              const accent = w.kind === "ceiling" ? theme.terra
                : w.kind === "tannin" ? theme.terra
                : w.kind === "aromatic" ? theme.terra
                : w.kind === "paradox" ? theme.sageDeep
                : theme.ash;
              return (
                <div key={i} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: accent, lineHeight: 1.4,
                }}>
                  {w.text}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Cup summary — dominant 1–2 effects and flavors as small
          pills matching the predicted-taste row's exact dimensions.
          Threshold-gated in the algorithm so quiet cups don't claim
          a read. Pills render as <button> elements to inherit the
          same UA reset (font-size, line-height) as the predicted-
          taste row's buttons — using <span> here picked up parent
          line-height and made the pills visibly taller. Eyebrow
          label sits inline to the left of each row. */}
      {((brew.moodSummary?.length || 0) > 0 || (brew.flavorSummary?.length || 0) > 0) && (() => {
        const summaryPill = (label, tone) => (
          <button key={label} type="button" disabled style={{
            fontFamily: ff.sans, fontSize: 10.5,
            color: tone, letterSpacing: "0.04em",
            padding: "3px 9px",
            border: `1px solid ${tone}`, borderRadius: 999,
            background: "transparent",
            cursor: "default",
          }}>{label}</button>
        );
        const labelStyle = {
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
          textTransform: "uppercase", color: theme.ash,
          flexShrink: 0,
        };
        return (
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
            {brew.moodSummary?.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={labelStyle}>Blended Mood</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {brew.moodSummary.map(t => summaryPill(t, theme.sageDeep))}
                </div>
              </div>
            )}
            {brew.flavorSummary?.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={labelStyle}>Blended Flavor</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {brew.flavorSummary.map(t => summaryPill(t, theme.terra))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Synergy tags — multi-effect bonuses the cup actually carries. */}
      {brew.synergyTags && brew.synergyTags.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {brew.synergyTags.map(tag => (
              <span key={tag} style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase", color: theme.sageDeep,
                padding: "3px 9px",
                background: "rgba(98, 124, 92, 0.10)",
                border: `1px solid ${theme.sageDeep}`, borderRadius: 999,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
