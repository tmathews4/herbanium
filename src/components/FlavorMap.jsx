/* ──────────────────────────────────────────────────────────────
   components/FlavorMap.jsx — temperature × {flavor | mood} maps.

   A horizontal strip showing how each dominant flavor (or effect)
   changes across the temperature range. Reads at a glance:
   "muscatel peaks early, astringent climbs late, hibiscus tart
   stays loud everywhere." The current brew-temp slider position
   draws as a vertical indicator cutting through every track, so
   the user sees both where they ARE and what's possible at every
   other temperature.

   Each row gets its own color from a family palette. Track
   intensity (alpha) maps to strength at that temp; darker means
   louder. The map runs the brew engine N times across the temp
   axis at the current steep time, so it's an honest prediction.

   Two views share the same shape:
     - <FlavorMap />       — taste notes (flavors)
     - <MoodMap />         — felt-state effects (moods)
   Both wrap the shared TrackMap component below.

   Cost: N brew-engine evaluations per render, shared between the
   two strips when they sit next to each other (the resolveBlendAtBrew
   call returns both flavors and effects in one pass). Memoized on
   (ingredients, timeS, range) so a temp-only slider drag doesn't
   recompute — only the indicator moves.
   ────────────────────────────────────────────────────────────── */

import React, { useMemo, useState } from "react";
import { resolveBlendAtBrew } from "../algo/compose";
import { ff, theme } from "../theme";
import { cToF, useUnit } from "../units/units";

// Number of temp samples across the axis. 24 keeps the gradient
// smooth without making the engine work too hard on every change
// to ingredients / steep time.
const SAMPLES = 24;
// Primary track count — the strip always shows up to this many
// rows by peak. Beyond ~5 the strip starts feeling like a check-
// list rather than a profile.
const MAX_TRACKS = 5;
// Peak strength a flavor must reach somewhere in the envelope to
// earn a primary row.
const PRIMARY_THRESHOLD = 0.5;
// Secondary tier: flavors that don't make the primary cut but
// rise above this threshold somewhere in the envelope are shown
// behind a "more" expand toggle. Below this threshold the flavor
// is essentially absent and stays hidden — surfacing it would
// just be noise.
const SECONDARY_THRESHOLD = 0.3;
// Cap on secondary tracks shown when expanded.
const MAX_SECONDARY = 6;

// Family → color mapping. Keeps the strip readable as a palette
// of related notes rather than a confetti of unrelated hues.
const FAMILY_COLORS = {
  fruit:    "#B0542F",  // terra
  floral:   "#C37959",  // rose
  earthy:   "#4A573A",  // sageDeep
  spiced:   "#A57836",  // ochre
  smoky:    "#7B4A5A",  // plum
  fresh:    "#7F9AA0",  // sky
  vegetal:  "#6D7E55",  // sage
  body:     "#796E5B",  // ash
  off:      "#B0542F",  // terra (off-notes share terra to read as "warning")
};

const FAMILY_BY_FLAVOR = {
  // fruit
  muscatel: "fruit", fruit: "fruit", fruity: "fruit", peach: "fruit",
  apricot: "fruit", berry: "fruit", tart: "fruit", cranberry: "fruit",
  bright: "fruit", melon: "fruit",
  // floral
  floral: "floral", rose: "floral", orchid: "floral", honeyed: "floral",
  honey: "floral", sweet: "floral", delicate: "floral",
  // earthy / dark / woody
  earthy: "earthy", woody: "earthy", mushroom: "earthy", leather: "earthy",
  dark: "earthy", mineral: "earthy", malty: "earthy", cocoa: "earthy",
  rich: "earthy", chestnut: "earthy", nutty: "earthy", caramel: "earthy",
  toasted: "earthy", roasted: "earthy", warm: "earthy", bold: "earthy",
  robust: "earthy", brisk: "earthy", musky: "earthy", musty: "earthy",
  // spiced / warming
  spiced: "spiced", clove: "spiced", peppery: "spiced", aromatic: "spiced",
  pungent: "spiced", numbing: "spiced", hot: "spiced",
  // smoky
  smoky: "smoky", smoked: "smoky", campfire: "smoky", pine: "smoky",
  tar: "smoky", coal: "smoky",
  // fresh / cooling / mint / citrus
  citrus: "fresh", minty: "fresh", mint: "fresh", cool: "fresh",
  cooling: "fresh", fresh: "fresh", camphor: "fresh", licorice: "fresh",
  // vegetal / grassy / marine
  grassy: "vegetal", marine: "vegetal", umami: "vegetal", vegetal: "vegetal",
  oceanic: "vegetal", seaweed: "vegetal", buttery: "vegetal", savory: "vegetal",
  hay: "vegetal", bean: "vegetal",
  // body words
  creamy: "body",
  // off / diagnostic
  bitter: "off", bitterness: "off", astringent: "off", tannic: "off",
  harsh: "off", acrid: "off", soapy: "off", muddy: "off", medicinal: "off",
};

const colorFor = (flavor) => FAMILY_COLORS[FAMILY_BY_FLAVOR[flavor] || "body"] || "#796E5B";

// Mood / effect → family. Smaller catalog than flavors, mostly
// derived from how the app already groups effect tags (mood
// register = sage, energy register = ochre, comfort = terra).
const FAMILY_BY_EFFECT = {
  // calm register — sage family
  calm: "calm", soothing: "calm", grounding: "calm", cooling: "calm",
  // focus register — sky / steady
  focus: "focus",
  // energy register — ochre / bright
  energy: "energy", uplifting: "energy",
  // warm / comfort register — terra / rose
  warming: "warm", comfort: "warm",
  // body register — sage-deep
  digestive: "body",
  // sleep register — plum
  sleepy: "sleep",
};
const EFFECT_FAMILY_COLORS = {
  calm:   "#6D7E55",  // sage
  focus:  "#7F9AA0",  // sky
  energy: "#A57836",  // ochre
  warm:   "#C37959",  // rose
  body:   "#4A573A",  // sageDeep
  sleep:  "#7B4A5A",  // plum
};
const colorForEffect = (effect) =>
  EFFECT_FAMILY_COLORS[FAMILY_BY_EFFECT[effect] || "body"] || "#796E5B";

// Palate / balance axes — diagnostic taste-structure dimensions
// (bitterness, sweetness, astringency, tartness, menthol). Colored
// to read like sensory warnings + comforts: terra for grippy/bitter,
// rose for tart, ochre for sweet, sky for cooling.
const PALATE_COLORS = {
  bitterness:  "#B0542F",  // terra
  astringency: "#B0542F",  // terra
  tartness:    "#C37959",  // rose
  sweetness:   "#A57836",  // ochre
  menthol:     "#7F9AA0",  // sky
};
const colorForPalate = (axis) => PALATE_COLORS[axis] || "#796E5B";

// Per-axis "unpleasant" thresholds for the palate strip. The
// bitterness axis sums bitter + bitterness + astringent, so it
// can register high on a cup that reads as grippy/tannic without
// being meaningfully bitter — kept the threshold conservative so
// the ⚠ doesn't fire on cups that are just confidently brewed.
// Astringency stays tighter because tannic at moderate levels is
// already a 'pull back' signal in tea-drinker terms.
const PALATE_WARNINGS = {
  bitterness:  { threshold: 3.8, label: "bitter" },
  astringency: { threshold: 3.0, label: "tannic" },
  tartness:    { threshold: 4.0, label: "sour" },
  menthol:     { threshold: 4.0, label: "burning" },
};

// Flavors that belong to the PALATE strip's axes (bitterness,
// astringency, menthol families) shouldn't double up as their own
// rows in the FLAVOR strip. Otherwise the user sees the same note
// twice — once as a diagnostic palate band, once as a flavor band
// — which dilutes both. Sweet / tart / bright stay on the flavor
// side because tea drinkers describe cups with those words; they
// just happen to also feed the palate sweetness / tartness axes.
const EXCLUDED_FROM_FLAVOR = new Set([
  // bitterness / astringency family
  "bitter", "bitterness", "astringent", "tannic",
  "harsh", "acrid", "sharp", "burnt",
  // menthol / cooling family
  "cool", "cooling", "menthol", "minty", "mint", "camphor",
]);

// Hex → "r,g,b" string for rgba() composition.
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/**
 * Shared track-map renderer.
 *   kind:        "flavor" | "mood" | "palate" — controls which
 *                dimension is pulled from each sample and which
 *                color palette drives the bands.
 *   ingredients: list of {id, g, role?}.
 *   tempC, timeS: current slider values.
 *   tempCRange:  [min, max] for the temp axis.
 *   showAxis:    render the temp tick row below the strip. Default
 *                true; pass false on stacked strips so the axis
 *                only appears once.
 */
const TrackMap = ({
  kind, ingredients, tempC, timeS, tempCRange,
  showAxis = true, title,
  // Tradition-deference suppression. When the strip is rendering a
  // curated traditional recipe (e.g. Wuyi yancha at 212°F, gongfu
  // black at 195°F × 30s) and the user is sitting AT or BELOW that
  // recipe's defaults, the at-current-position ⚠ on palate axes is
  // muffled. The model's bitter/tannic thresholds are tuned to a
  // generic palate that treats astringency as a defect — but in
  // these tea families it's the point of the cup. The terra
  // underlay stripe in the band still shows where the warning
  // region IS, so the user gets a region preview if they push past
  // the recipe; only the alarm at the current position goes quiet.
  curated = false,
  isTraditional = false,
  defaultTempC = null,
  defaultTimeS = null,
}) => {
  const { unit } = useUnit();
  const [tMin, tMax] = tempCRange;
  const span = tMax - tMin;

  // Sample the brew engine across the temp axis. Each sample carries
  // flavor / effect / palate maps so all three strips share work
  // when stacked (resolveBlendAtBrew already returns all three in
  // one pass; React memoization keeps the inner loop from running
  // three times per render).
  const samples = useMemo(() => {
    if (!ingredients || ingredients.length === 0 || span <= 0) return [];
    const out = [];
    for (let i = 0; i < SAMPLES; i++) {
      const t = tMin + span * (i / (SAMPLES - 1));
      const brew = resolveBlendAtBrew(
        ingredients, t, timeS, undefined, undefined,
        false, false, null,
      );
      const flavorMap = {};
      (brew.flavors || []).forEach(([name, strength]) => {
        // Palate-axis families (bitter, astringent, menthol/mint)
        // belong to the palate strip; keeping them here would
        // double up the same note across two strips.
        if (EXCLUDED_FROM_FLAVOR.has(name)) return;
        flavorMap[name] = strength;
      });
      const effectMap = {};
      (brew.effects || []).forEach(([name, strength]) => {
        // Bitterness is a diagnostic axis (rendered on the palate
        // strip), not a felt-state mood. Keep it out of the mood map.
        if (name === "bitterness") return;
        effectMap[name] = strength;
      });
      const palateMap = {};
      (brew.balance || []).forEach(([name, strength]) => {
        palateMap[name] = strength;
      });
      out.push({ t, flavorMap, effectMap, palateMap });
    }
    return out;
  }, [ingredients, timeS, tMin, tMax, span]);

  // Pick which sample-map this strip pulls from.
  const pickMap = (s) =>
    kind === "flavor" ? s.flavorMap
    : kind === "mood" ? s.effectMap
    : s.palateMap;
  const colorForName =
    kind === "flavor" ? colorFor
    : kind === "mood" ? colorForEffect
    : colorForPalate;

  // Compute peak strengths once, then split into two tiers:
  //   - primary: top MAX_TRACKS with peak ≥ PRIMARY_THRESHOLD
  //   - secondary: next ones with peak ≥ SECONDARY_THRESHOLD that
  //     didn't make the primary cut. These are flavors getting
  //     close to surfacing but not quite — useful to expose under
  //     a "more" toggle so the user can see what's just below the
  //     waterline. Anything below SECONDARY_THRESHOLD is genuine
  //     noise and stays hidden.
  // Returns the names + peaks so the gradient renderer can
  // normalize each track to its own dynamic range.
  const trackData = useMemo(() => {
    const peaks = {};
    for (const s of samples) {
      const map = pickMap(s);
      for (const [name, strength] of Object.entries(map)) {
        peaks[name] = Math.max(peaks[name] || 0, strength);
      }
    }
    const ranked = Object.entries(peaks).sort((a, b) => b[1] - a[1]);
    let primary = ranked
      .filter(([, peak]) => peak >= PRIMARY_THRESHOLD)
      .slice(0, MAX_TRACKS)
      .map(([name]) => name);
    // If no track clears the primary threshold but the strip still has
    // tracks above the secondary threshold, promote the loudest of those
    // so the strip is never empty-with-an-expand-button. The user
    // shouldn't have to tap "+ N near the surface" just to see the one
    // mood / flavor / palate that does exist.
    if (primary.length === 0) {
      primary = ranked
        .filter(([, peak]) => peak >= SECONDARY_THRESHOLD)
        .slice(0, MAX_TRACKS)
        .map(([name]) => name);
    }
    const primarySet = new Set(primary);
    const secondary = ranked
      .filter(([name, peak]) => peak >= SECONDARY_THRESHOLD && !primarySet.has(name))
      .slice(0, MAX_SECONDARY)
      .map(([name]) => name);
    return { primary, secondary, peaks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples, kind]);
  const [expanded, setExpanded] = useState(false);
  const primaryTracks   = trackData.primary;
  const secondaryTracks = trackData.secondary;
  const tracks = expanded ? [...primaryTracks, ...secondaryTracks] : primaryTracks;

  if (primaryTracks.length === 0 && secondaryTracks.length === 0) return null;
  if (samples.length === 0) return null;

  // Fill in zero-strength gaps that sit between non-zero neighbors
  // by linear interpolation. This catches authoring artifacts where
  // a flavor exists in an ingredient's light + strong profile points
  // but is missing from its standard point — the engine's interpolation
  // would lerp toward 0 across the middle bracket, then re-emerge at
  // the strong bracket, producing a dark→light→dark band (or worse,
  // a visible transparent gap) that doesn't reflect real chemistry.
  //
  // Any gap between two non-zero samples gets filled — if the flavor
  // is present on BOTH sides of a gap, it's effectively continuous
  // (the zero in the middle is the engine's 0.5 threshold-drop, not
  // a real disappearance). Gaps that touch the start or end of the
  // series stay zero — those represent flavors that only exist at
  // one extreme of the temp range, which IS real information.
  const fillGaps = (series) => {
    const out = [...series];
    const n = out.length;
    for (let i = 1; i < n - 1; i++) {
      if (out[i] > 0) continue;
      let leftIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (series[j] > 0) { leftIdx = j; break; }
      }
      let rightIdx = -1;
      for (let j = i + 1; j < n; j++) {
        if (series[j] > 0) { rightIdx = j; break; }
      }
      if (leftIdx >= 0 && rightIdx >= 0) {
        const t = (i - leftIdx) / (rightIdx - leftIdx);
        out[i] = series[leftIdx] * (1 - t) + series[rightIdx] * t;
      }
    }
    return out;
  };

  // Per-track normalization. Alpha scales each band to its OWN peak
  // across the envelope rather than the engine's absolute 0-5 scale.
  // A flavor that ranges 0.5 → 1.5 used to render 10% → 30% opacity
  // (barely visible movement); now it renders ~33% → 100% within
  // its track. The user sees real gradient instead of a hairline shift.
  //
  // Loudness comparison across tracks is preserved by the track ORDER
  // (sorted by peak descending), and by an intensity floor that keeps
  // a flat-quiet track from reading as loud-and-unchanging — peaks
  // below 1.0 cap their max alpha at sqrt(peak), so a track that
  // peaks at 0.6 maxes around 0.78 opacity rather than full 1.0.
  // Perceptual ceiling on band opacity. A track that's uniformly at
  // its peak across the whole envelope used to render every stop at
  // alpha 1.0 — a flat block of full-saturation color that visually
  // 'punches in' compared to a varying gradient on the same band.
  // Capping below 1.0 keeps uniform regions feeling like part of the
  // same band as varying regions.
  const MAX_BAND_ALPHA = 0.82;

  // Cup-wide extraction strength. Bands per-track-normalize for
  // SHAPE (so a minor flavor in a healthy cup still shows clear
  // gradient) but we want a CUP-LEVEL fade when the whole cup is
  // underextracted — at timeS → 0, everything should fade out
  // toward transparent rather than sit at full per-track opacity.
  // The cup-strength factor compares the loudest peak in the
  // strip to a "well-extracted" reference (1.5 on the engine's
  // 0–5 scale). When the cup-wide peak is healthy, no fade. When
  // it drops because the user pulled the time slider toward zero,
  // every band dampens in proportion.
  const cupPeak = Math.max(0, ...Object.values(trackData.peaks));
  const FULL_EXTRACTION_REF = 1.5;
  const cupStrength = Math.min(1, cupPeak / FULL_EXTRACTION_REF);

  const gradientFor = (name) => {
    const rgb = hexToRgb(colorForName(name));
    const peak = trackData.peaks[name] || 1;
    const cap = (peak < 1 ? Math.sqrt(peak) : 1) * MAX_BAND_ALPHA * cupStrength;
    // Build the raw strength series, then fill threshold-drop gaps
    // before mapping to alpha so the gradient reads as continuous.
    const rawSeries = samples.map(s => pickMap(s)[name] || 0);
    const series = fillGaps(rawSeries);
    const stops = series.map((strength, i) => {
      const x = (i / (SAMPLES - 1)) * 100;
      const alpha = Math.max(0, Math.min(cap, (strength / peak) * cap));
      return `rgba(${rgb}, ${alpha.toFixed(3)}) ${x.toFixed(1)}%`;
    }).join(", ");
    return `linear-gradient(to right, ${stops})`;
  };

  // Per-track palate warning lookup. Returns null for non-palate
  // strips and for axes that never cross their unpleasant threshold;
  // otherwise returns the threshold config plus a per-sample
  // intensity series that the warning underlay maps to alpha.
  const warningFor = (name) => {
    if (kind !== "palate") return null;
    const cfg = PALATE_WARNINGS[name];
    if (!cfg) return null;
    const peak = trackData.peaks[name] || 0;
    if (peak < cfg.threshold) return null;
    const intensities = samples.map(s => {
      const v = pickMap(s)[name] || 0;
      if (v < cfg.threshold) return 0;
      return Math.min(1, (v - cfg.threshold) / (5 - cfg.threshold));
    });
    return { ...cfg, peak, intensities };
  };

  // Build a thin terra warning gradient — fully transparent under
  // the threshold, deepening as the axis pushes further past it.
  const warningGradientFor = (warning) => {
    const stops = warning.intensities.map((intensity, i) => {
      const x = (i / (SAMPLES - 1)) * 100;
      const alpha = intensity > 0 ? 0.4 + intensity * 0.55 : 0;
      return `rgba(176,84,47, ${alpha.toFixed(3)}) ${x.toFixed(1)}%`;
    }).join(", ");
    return `linear-gradient(to right, ${stops})`;
  };

  // Find the user's current sample index for the badge — the closest
  // sample to where the slider sits. Used to decide whether to
  // surface a "you're in the warning zone" badge next to the track.
  const currentSampleIdx = span > 0
    ? Math.round(((tempC - tMin) / span) * (SAMPLES - 1))
    : 0;
  // Tradition-deference: on curated traditional blends, suppress the
  // at-position ⚠ when the user is sitting at or below the curator's
  // recommended brew. The recipe is the recipe — bitterness/tannin in
  // a yancha or gongfu black at its tradition default is a feature,
  // not a defect. Only fires for palate strips on curated traditions
  // with both defaults declared; otherwise the suppression is a no-op
  // and warnings behave as before.
  const traditionMuffleActive =
    kind === "palate"
    && curated && isTraditional
    && defaultTempC != null && defaultTimeS != null
    && tempC <= defaultTempC
    && timeS <= defaultTimeS;
  const isWarningHere = (warning) => {
    if (!warning) return false;
    if (traditionMuffleActive) return false;
    return warning.intensities[Math.max(0, Math.min(SAMPLES - 1, currentSampleIdx))] > 0;
  };

  const indicatorPct = span > 0
    ? Math.max(0, Math.min(100, ((tempC - tMin) / span) * 100))
    : 0;

  const tempLabel = (c) => unit === "F" ? `${cToF(c)}°F` : `${c}°C`;

  const TRACK_H   = 14;
  const TRACK_GAP = 3;
  const LABEL_W   = 64;

  return (
    <div style={{
      padding: "12px 12px 10px",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10,
    }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
        textTransform: "uppercase", color: theme.ash, marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span>{title}</span>
        <span style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5,
          letterSpacing: 0, textTransform: "none", color: theme.ash,
        }}>
          at current steep
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          flex: "0 0 auto",
          display: "flex", flexDirection: "column", gap: TRACK_GAP,
        }}>
          {tracks.map(name => {
            const warn = warningFor(name);
            const here = isWarningHere(warn);
            return (
              <div key={name} style={{
                height: TRACK_H,
                fontFamily: ff.sans, fontSize: 10,
                color: here ? theme.terra : theme.inkSoft,
                fontWeight: here ? 500 : 400,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                gap: 3,
                minWidth: LABEL_W,
              }}>
                {/* ⚠ only fires when the CURRENT slider position is
                    inside a warning zone — not just because a warning
                    zone exists somewhere in the envelope. The terra
                    underlay stripe in the band still shows where the
                    bad region IS, so the user gets a region preview
                    without a false 'your cup is bitter' alarm when
                    the current brew is fine. */}
                {here && (
                  <span
                    title={`this brew is in ${warn.label} territory`}
                    style={{ color: theme.terra, fontSize: 10, lineHeight: 1 }}
                  >⚠</span>
                )}
                <span>{name}</span>
              </div>
            );
          })}
        </div>

        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column", gap: TRACK_GAP,
        }}>
          {tracks.map(name => {
            const warn = warningFor(name);
            return (
              <div key={name} style={{
                position: "relative",
                height: TRACK_H,
                borderRadius: 3,
                background: gradientFor(name),
                boxShadow: `inset 0 0 0 1px ${theme.ruleSoft}`,
              }}>
                {/* Warning underlay — a thin terra stripe along the
                    bottom of the band wherever the palate axis crosses
                    its unpleasant threshold. Positioned inside the
                    band so it scrolls with the gradient and doesn't
                    add height to the row. */}
                {warn && (
                  <div style={{
                    position: "absolute",
                    left: 0, right: 0, bottom: 0,
                    height: 3,
                    borderRadius: "0 0 2px 2px",
                    background: warningGradientFor(warn),
                    pointerEvents: "none",
                  }} />
                )}
              </div>
            );
          })}
          <div style={{
            position: "absolute",
            top: -2, bottom: -2,
            left: `${indicatorPct}%`,
            width: 2,
            transform: "translateX(-1px)",
            background: theme.terra,
            borderRadius: 1,
            pointerEvents: "none",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.55)",
          }} />
        </div>
      </div>

      {/* Expand toggle — only when the strip has secondary tracks
          worth surfacing. Shows the count of near-but-not-quite
          flavors so the user knows what's available before tapping. */}
      {secondaryTracks.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: LABEL_W + 8 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: theme.ash,
              background: "transparent",
              border: `1px dashed ${theme.ruleSoft}`,
              borderRadius: 999,
              padding: "3px 10px",
              cursor: "pointer",
              fontStyle: "normal",
            }}
          >
            {expanded
              ? "show less"
              : `+ ${secondaryTracks.length} near the surface`}
          </button>
        </div>
      )}

      {showAxis && (
        <div style={{
          marginTop: 6,
          marginLeft: LABEL_W + 8,
          display: "flex", justifyContent: "space-between",
          fontFamily: ff.mono, fontSize: 9, color: theme.ash,
        }}>
          <span>{tempLabel(tMin)}</span>
          <span>{tempLabel(Math.round((tMin + tMax) / 2))}</span>
          <span>{tempLabel(tMax)}</span>
        </div>
      )}
    </div>
  );
};

export const FlavorMap = (props) => (
  <TrackMap {...props} kind="flavor" title="Flavor across temperature" />
);

export const MoodMap = (props) => (
  <TrackMap {...props} kind="mood" title="Mood across temperature" />
);

export const PalateMap = (props) => (
  <TrackMap {...props} kind="palate" title="Palate across temperature" />
);
