/* ──────────────────────────────────────────────────────────────
   tools/lib/palette.mjs

   Are any two effect families the same color to look at?

   The strip draws one band per family, stacked. Two bands the eye
   can't separate is the same failure as two words meaning the same
   thing — the reader can't tell which register they're looking at.

   `immune` was added at #7FA3A0 and sat ΔE 6.7 from `focus`, which is
   indistinguishable in adjacent bands. Nothing caught it because
   color had never been measured, only chosen.

   ΔE here is CIE76 — a plain Euclidean distance in Lab. It's the
   crude one; CIEDE2000 is better calibrated. It's enough for this
   question, which is "could someone confuse these", not "are these
   perceptually identical to a colorimeter".

   Colors are read from src/index.css rather than families.js because
   families.js holds `var(--effect-x)` references and the real values
   live in the stylesheet, per theme.
   ────────────────────────────────────────────────────────────── */

import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS = resolve(__dirname, "../../src/index.css");

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

const lab = (h) => {
  const [r, g, b] = hex(h).map(v => {
    v /= 255;
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  });
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};

export const deltaE = (a, b) => {
  const A = lab(a), B = lab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};

/** Effect-family colors per theme, straight out of the stylesheet. */
export function effectPalettes() {
  const css = readFileSync(CSS, "utf8");
  const [lightBlock, darkBlock = ""] = css.split("prefers-color-scheme: dark");
  const grab = t => Object.fromEntries(
    [...t.matchAll(/--effect-([a-z]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  return { light: grab(lightBlock), dark: grab(darkBlock) };
}

/** Below this, two bands read as the same color at a glance. */
export const MIN_DELTA_E = 12;

/** Pairs closer than MIN_DELTA_E, keyed `<theme>:<a>/<b>` (a,b sorted). */
export function tooCloseToTell() {
  const out = [];
  for (const [theme, pal] of Object.entries(effectPalettes())) {
    const keys = Object.keys(pal);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const dE = deltaE(pal[keys[i]], pal[keys[j]]);
        if (dE < MIN_DELTA_E) {
          out.push({ key: `${theme}:${[keys[i], keys[j]].sort().join("/")}`, dE });
        }
      }
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}
