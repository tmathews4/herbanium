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
import { INGREDIENTS } from "../data/ingredients";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { EffectBar } from "./EffectBar";
import { VocabInfoCard } from "./layout";

/**
 * Compute the UNION of all ingredients' temp ranges. Used for slider bounds.
 * Returns [min, max] in Celsius.
 */
function unionTempRange(ingredients) {
  if (!ingredients?.length) return [90, 100];
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].tempC;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return [lo, hi];
}

function unionTimeRange(ingredients) {
  if (!ingredients?.length) return [120, 600];
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].timeS;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return [lo, hi];
}

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

  const tempCRange = useMemo(() => unionTempRange(ingredients), [ingredients]);
  const timeSRange = useMemo(() => unionTimeRange(ingredients), [ingredients]);

  // Internal state — only used when parent hasn't supplied controlled values.
  const [tempCInternal, setTempCInternal] = useState(() =>
    defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2)
  );
  const [timeSInternal, setTimeSInternal] = useState(() =>
    defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2)
  );
  const [openFlavor, setOpenFlavor] = useState(null);
  const [openEffect, setOpenEffect] = useState(null);

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

  return (
    <div style={{
      padding: compact ? "14px 14px 16px" : "16px 16px 18px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
    }}>
      {/* Temp slider */}
      <div style={{ marginBottom: 14 }}>
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

      {/* Time slider */}
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
          {!compatible && (
            <div style={{
              marginTop: 6,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
              color: theme.ash, lineHeight: 1.4,
            }}>
              {brew.outsiders.length === 1
                ? `${brew.outsiders[0]} is outside its preferred temp — will extract unevenly.`
                : `${brew.outsiders.join(", ")} are outside their preferred temps.`}
            </div>
          )}
        </div>
      )}

      {/* Tradition-over-literature notice — appears on curated blends
          that brew outside what the studies prescribe. The curator
          chose this point on purpose; the note acknowledges that the
          warning system has been silenced here, and explains why. */}
      {brew.traditionNote && (
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

      {/* Warnings — masking, ceiling, paradox, tannin, aromatic.
          Surfaced ABOVE the predicted flavor/effect blocks so the
          user sees the brewing nudge before reading the cup it
          would produce. Outsiders are still shown inline above
          with the per-ingredient pills; filter to avoid duplication. */}
      {(() => {
        const filtered = (brew.warnings || []).filter(w => w.kind !== "outsider");
        if (filtered.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
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

      {/* Predicted profile — taste (flavor pills) on top, mood (effect
          bars) below. Either section hides itself when its dataset is
          empty. Both filter zero-strength entries so ghost rows don't
          leak through slider motion. */}
      {(() => {
        const visibleEffects = (brew.effects || []).filter(([, n]) =>
          Math.round((n || 0) * 10) / 10 > 0
        );
        const visibleBalance = (brew.balance || []).filter(([, n]) =>
          Math.round((n || 0) * 10) / 10 > 0
        );
        const visibleFlavors = (brew.flavors || []).filter(([, s]) =>
          Math.round((s || 0) * 10) / 10 > 0
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
            {visibleFlavors.length > 0 && (
              <div style={{ marginBottom: visibleEffects.length > 0 ? 14 : 0 }}>
                {sectionLabel("predicted taste")}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {visibleFlavors.map(([name, strength]) => {
                    const known = !!FLAVOR_DESCRIPTIONS[name];
                    const active = openFlavor === name;
                    const intensity = Math.max(0.35, Math.min(1, strength / 5));
                    return (
                      <button
                        key={name}
                        onClick={() => known && setOpenFlavor(prev => prev === name ? null : name)}
                        disabled={!known}
                        style={{
                          fontFamily: ff.sans, fontSize: 10.5,
                          color: active ? theme.cream : theme.terra, letterSpacing: "0.04em",
                          padding: "3px 9px",
                          border: `1px solid ${theme.terra}`, borderRadius: 999,
                          background: active ? theme.terra : "transparent",
                          opacity: active ? 1 : intensity,
                          cursor: known ? "pointer" : "default",
                          transition: "all 0.15s ease",
                        }}
                      >{name}</button>
                    );
                  })}
                </div>
                {openFlavor && FLAVOR_DESCRIPTIONS[openFlavor] && (
                  <div style={{ marginTop: 10 }}>
                    <VocabInfoCard
                      term={openFlavor}
                      summary={FLAVOR_DESCRIPTIONS[openFlavor].summary}
                      body={FLAVOR_DESCRIPTIONS[openFlavor].body}
                      tone="terra"
                      onClose={() => setOpenFlavor(null)}
                    />
                  </div>
                )}
              </div>
            )}
            {visibleEffects.length > 0 && (
              <div style={{ marginBottom: visibleBalance.length > 0 ? 14 : 0 }}>
                {sectionLabel("predicted mood")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {visibleEffects.map(([tag, n], i) => {
                    const known = !!EFFECT_DESCRIPTIONS[tag];
                    const active = openEffect === tag;
                    const color =
                      i === 0 ? theme.sage
                      : i === 1 ? theme.ochre
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
                {openEffect && EFFECT_DESCRIPTIONS[openEffect] && (
                  <div style={{ marginTop: 10 }}>
                    <VocabInfoCard
                      term={openEffect}
                      summary={EFFECT_DESCRIPTIONS[openEffect].summary}
                      body={EFFECT_DESCRIPTIONS[openEffect].body}
                      tone="sage"
                      onClose={() => setOpenEffect(null)}
                    />
                  </div>
                )}
              </div>
            )}
            {visibleBalance.length > 0 && (
              <div>
                {sectionLabel("predicted balance")}
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

      {/* Synergy tags — multi-effect bonuses the cup actually carries. */}
      {brew.synergyTags && brew.synergyTags.length > 0 && (
        <div style={{ marginTop: 4 }}>
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
