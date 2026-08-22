/* Type surface for data/families.js — the E2E reads the same
   vocabulary the app orders its strips by, rather than restating an
   expected row order that would drift the moment a token is added. */

export const FAMILY_BY_FLAVOR: Record<string, string>;
export const FAMILY_BY_EFFECT: Record<string, string>;
export const FLAVOR_FAMILY_ORDER: string[];
export const MOOD_FAMILY_ORDER: string[];
export const FLAVOR_LEAF_ORDER: string[];
export const EFFECT_LEAF_ORDER: string[];

/** Row comparator: names only, never strengths. */
export function compareTracks(kind: "mood" | "flavor" | string):
  (a: string, b: string) => number;
