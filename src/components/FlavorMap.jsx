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

import React, { useMemo } from "react";
import { resolveBlendAtBrew } from "../algo/compose";
import { ff, theme } from "../theme";
import { cToF, useUnit } from "../units/units";

// Number of temp samples across the axis. 24 keeps the gradient
// smooth without making the engine work too hard on every change
// to ingredients / steep time.
const SAMPLES = 24;
// Number of flavors to display as their own track. Beyond ~5 the
// strip starts feeling like a checklist rather than a profile.
const MAX_TRACKS = 5;

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
const TrackMap = ({ kind, ingredients, tempC, timeS, tempCRange, showAxis = true, title }) => {
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

  // Pick the top MAX_TRACKS by their peak strength anywhere in the
  // envelope. Peak (not average) means notes that surface only at
  // one end still get their own row — that IS the information the
  // map is trying to surface. Returns both the ranked names AND
  // the peaks map so the gradient renderer can normalize each
  // track to its own dynamic range.
  const trackData = useMemo(() => {
    const peaks = {};
    for (const s of samples) {
      const map = pickMap(s);
      for (const [name, strength] of Object.entries(map)) {
        peaks[name] = Math.max(peaks[name] || 0, strength);
      }
    }
    const names = Object.entries(peaks)
      .filter(([, peak]) => peak >= 0.5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TRACKS)
      .map(([name]) => name);
    return { names, peaks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples, kind]);
  const tracks = trackData.names;

  if (tracks.length === 0 || samples.length === 0) return null;

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
  const gradientFor = (name) => {
    const rgb = hexToRgb(colorForName(name));
    const peak = trackData.peaks[name] || 1;
    const cap = peak < 1 ? Math.sqrt(peak) : 1;
    const stops = samples.map((s, i) => {
      const x = (i / (SAMPLES - 1)) * 100;
      const strength = pickMap(s)[name] || 0;
      const alpha = Math.max(0, Math.min(cap, (strength / peak) * cap));
      return `rgba(${rgb}, ${alpha.toFixed(3)}) ${x.toFixed(1)}%`;
    }).join(", ");
    return `linear-gradient(to right, ${stops})`;
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
          {tracks.map(name => (
            <div key={name} style={{
              height: TRACK_H,
              fontFamily: ff.sans, fontSize: 10, color: theme.inkSoft,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              minWidth: LABEL_W,
            }}>{name}</div>
          ))}
        </div>

        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column", gap: TRACK_GAP,
        }}>
          {tracks.map(name => (
            <div key={name} style={{
              height: TRACK_H,
              borderRadius: 3,
              background: gradientFor(name),
              boxShadow: `inset 0 0 0 1px ${theme.ruleSoft}`,
            }} />
          ))}
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
